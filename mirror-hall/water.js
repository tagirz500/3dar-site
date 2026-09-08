export const FLOW_WIDTH = 96;
export const FLOW_HEIGHT = 64;
export const FLOW_BOUNDS = [-16, 2, 32, 64 / 3];
const CELL_SIZE = FLOW_BOUNDS[2] / FLOW_WIDTH;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function waterPoint(x, y, config) {
  if (y < config.horizon + config.centralHeight * 0.44) return null;
  const z = config.focal * config.camera / (y - config.horizon);
  return { x: (x - config.width / 2) * z / config.focal, z };
}

function sample(field, x, y) {
  x = clamp(x, 0, FLOW_WIDTH - 1.001);
  y = clamp(y, 0, FLOW_HEIGHT - 1.001);
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy, i = iy * FLOW_WIDTH + ix;
  return (field[i] * (1 - fx) + field[i + 1] * fx) * (1 - fy)
    + (field[i + FLOW_WIDTH] * (1 - fx) + field[i + FLOW_WIDTH + 1] * fx) * fy;
}

// An advected velocity field carries cursor motion through the water.
// Pressure projection keeps the current smooth and volume-preserving.
export class Water {
  constructor() {
    const size = FLOW_WIDTH * FLOW_HEIGHT;
    this.x = new Float32Array(size);
    this.z = new Float32Array(size);
    this.nextX = new Float32Array(size);
    this.nextZ = new Float32Array(size);
    this.pressure = new Float32Array(size);
    this.nextPressure = new Float32Array(size);
    this.divergence = new Float32Array(size);
    this.pixels = new Uint8Array(size * 4);
    this.pointerTarget = null;
    this.pointerSmooth = null;
    this.hoverPoint = { x: 0, z: 8.5 };
    this.hoverStrength = 0;
    this.hoverUniform = new Float32Array([0, 8.5, 0, 0]);
    this.lastTime = null;
    this.revision = 0;
    this.encode();
  }

  pointer(x, y, card, config) {
    let point;
    if (card) {
      const z = Math.cos(card.angle) * config.radius;
      point = { x: (x - config.width / 2) * z / config.focal, z };
    } else point = waterPoint(x, y, config);
    if (!point) { this.leave(); return; }
    this.pointerTarget = point;
    // Entering establishes a position; subsequent motion stirs the water.
    if (!this.pointerSmooth) {
      this.pointerSmooth = { ...point };
      this.hoverPoint = { ...point };
    }
  }

  leave() { this.pointerTarget = null; this.pointerSmooth = null; }

  stir(dt) {
    if (!this.pointerTarget || !this.pointerSmooth) return;
    const previous = this.pointerSmooth;
    const follow = 1 - Math.exp(-8 * dt);
    const x = previous.x + (this.pointerTarget.x - previous.x) * follow;
    const z = previous.z + (this.pointerTarget.z - previous.z) * follow;
    let vx = (x - previous.x) / dt, vz = (z - previous.z) / dt;
    this.pointerSmooth = { x, z };
    const speed = Math.hypot(vx, vz);
    if (speed < 0.008) return;
    const limit = Math.min(1, 1.55 / speed);
    vx *= limit; vz *= limit;
    const cx = (x - FLOW_BOUNDS[0]) / CELL_SIZE;
    const cy = (z - FLOW_BOUNDS[1]) / CELL_SIZE;
    const radius = 0.9 / CELL_SIZE;
    const blend = 1 - Math.exp(-7 * dt);
    const reach = Math.ceil(radius * 2.4);
    for (let y = Math.max(1, Math.floor(cy) - reach); y <= Math.min(FLOW_HEIGHT - 2, cy + reach); y++) {
      for (let x = Math.max(1, Math.floor(cx) - reach); x <= Math.min(FLOW_WIDTH - 2, cx + reach); x++) {
        const dx = (x - cx) / radius, dz = (y - cy) / radius;
        const weight = Math.exp(-(dx * dx + dz * dz) * 1.6) * blend;
        const i = y * FLOW_WIDTH + x;
        this.x[i] += (vx - this.x[i]) * weight;
        this.z[i] += (vz - this.z[i]) * weight;
      }
    }
  }

  update(time) {
    if (this.lastTime === null) { this.lastTime = time; return; }
    const dt = clamp(time - this.lastTime, 0, 0.035);
    this.lastTime = time;
    if (dt <= 0) return;
    this.stir(dt);
    const hoverTarget = this.pointerTarget ? 1 : 0;
    this.hoverStrength += (hoverTarget - this.hoverStrength) * (1 - Math.exp(-(hoverTarget ? 4.2 : 2.4) * dt));
    if (this.pointerSmooth) this.hoverPoint = { ...this.pointerSmooth };
    this.hoverUniform.set([this.hoverPoint.x, this.hoverPoint.z, this.hoverStrength, 0]);
    const decay = Math.exp(-0.83 * dt);
    const diffuse = 1 - Math.exp(-1.5 * dt);
    const travel = dt / CELL_SIZE;
    for (let y = 1; y < FLOW_HEIGHT - 1; y++) {
      for (let x = 1; x < FLOW_WIDTH - 1; x++) {
        const i = y * FLOW_WIDTH + x;
        const sx = x - (this.x[i] + 0.075) * travel;
        const sy = y - (this.z[i] - 0.04) * travel;
        const ax = sample(this.x, sx, sy), az = sample(this.z, sx, sy);
        const mx = (this.x[i - 1] + this.x[i + 1] + this.x[i - FLOW_WIDTH] + this.x[i + FLOW_WIDTH]) * 0.25;
        const mz = (this.z[i - 1] + this.z[i + 1] + this.z[i - FLOW_WIDTH] + this.z[i + FLOW_WIDTH]) * 0.25;
        this.nextX[i] = (ax + (mx - ax) * diffuse) * decay;
        this.nextZ[i] = (az + (mz - az) * diffuse) * decay;
      }
    }
    [this.x, this.nextX] = [this.nextX, this.x];
    [this.z, this.nextZ] = [this.nextZ, this.z];
    this.pressure.fill(0);
    this.nextPressure.fill(0);
    for (let y = 1; y < FLOW_HEIGHT - 1; y++) {
      for (let x = 1; x < FLOW_WIDTH - 1; x++) {
        const i = y * FLOW_WIDTH + x;
        this.divergence[i] = -0.5 * (this.x[i + 1] - this.x[i - 1] + this.z[i + FLOW_WIDTH] - this.z[i - FLOW_WIDTH]);
      }
    }
    for (let pass = 0; pass < 10; pass++) {
      for (let y = 1; y < FLOW_HEIGHT - 1; y++) {
        for (let x = 1; x < FLOW_WIDTH - 1; x++) {
          const i = y * FLOW_WIDTH + x;
          this.nextPressure[i] = (this.divergence[i] + this.pressure[i - 1] + this.pressure[i + 1] + this.pressure[i - FLOW_WIDTH] + this.pressure[i + FLOW_WIDTH]) * 0.25;
        }
      }
      [this.pressure, this.nextPressure] = [this.nextPressure, this.pressure];
    }
    for (let y = 1; y < FLOW_HEIGHT - 1; y++) {
      for (let x = 1; x < FLOW_WIDTH - 1; x++) {
        const i = y * FLOW_WIDTH + x;
        this.x[i] = clamp(this.x[i] - 0.5 * (this.pressure[i + 1] - this.pressure[i - 1]), -1.6, 1.6);
        this.z[i] = clamp(this.z[i] - 0.5 * (this.pressure[i + FLOW_WIDTH] - this.pressure[i - FLOW_WIDTH]), -1.6, 1.6);
      }
    }
    this.encode();
    this.revision++;
  }

  encode() {
    for (let i = 0; i < this.x.length; i++) {
      this.pixels[i * 4] = Math.round(128 + this.x[i] * 48);
      this.pixels[i * 4 + 1] = Math.round(128 + this.z[i] * 48);
      this.pixels[i * 4 + 2] = 0;
      this.pixels[i * 4 + 3] = 255;
    }
  }

  sample(x, z) {
    const gx = (x - FLOW_BOUNDS[0]) / CELL_SIZE;
    const gy = (z - FLOW_BOUNDS[1]) / CELL_SIZE;
    return { x: sample(this.x, gx, gy), z: sample(this.z, gx, gy) };
  }
}

// The fallback bends reflections with the same continuous current.
export function waterSlope(x, z, time, water) {
  const flow = water.sample(x, z);
  const distance = (x - water.hoverPoint.x) ** 2 + (z - water.hoverPoint.z) ** 2;
  const hover = Math.exp(-distance * 0.22) * water.hoverStrength;
  const waveGain = 1 + hover * 0.9;
  let px = x * 0.65, pz = z * 0.65;
  px += Math.sin(pz * 0.7 + time * 0.13) * 0.28 + flow.x * 0.3;
  pz += Math.cos(x * 0.65 * 0.56 - time * 0.09) * 0.28 + flow.z * 0.3;
  return {
    x: (Math.sin(pz * 4.2 + px * 0.6 - time * 0.85) * 0.065
      + Math.sin(pz * 7.6 - px * 0.7 + time * 0.43) * 0.022) * waveGain + flow.x * 0.32,
    z: (Math.cos(pz * 3.3 - px * 1.1 - time * 0.62) * 0.028
      + Math.sin(px * 2.8 + pz * 1.2 - time * 0.37) * 0.012) * waveGain + flow.z * 0.24,
    hover,
  };
}

export function waterDisplacement(slope, config, y) {
  const foreground = clamp((y - config.waterline) / (config.height - config.waterline), 0, 1);
  const scale = clamp(config.focal / 720, 0.75, 1.5);
  const perspective = 0.85 + foreground * 0.7;
  return {
    x: clamp(slope.x * 84 * perspective, -26, 26) * scale,
    y: clamp(slope.z * 46 * perspective, -16, 16) * scale,
  };
}
