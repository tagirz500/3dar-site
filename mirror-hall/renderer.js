import { project } from './geometry.js';
import { FLOW_WIDTH, FLOW_HEIGHT, FLOW_BOUNDS, waterPoint, waterSlope, waterDisplacement } from './water.js';

const vertexSource = `
  precision mediump float;
  attribute vec2 aUV;
  uniform vec2 uResolution;
  uniform vec2 uSize;
  uniform float uRadius, uAngle, uFocal, uCamera, uHorizon;
  uniform float uReflection, uScale, uLift, uSink;
  varying vec2 vUV;
  void main() {
    vUV = aUV;
    float localX = (aUV.x - 0.5) * uSize.x * uScale;
    float x = sin(uAngle) * uRadius + cos(uAngle) * localX;
    float extent = (1.0 - aUV.y) * uSize.y * uScale + uLift - uSink * (uSize.y * uScale + uLift);
    float z = cos(uAngle) * uRadius - sin(uAngle) * localX;
    float y = uCamera + mix(-extent, extent, uReflection);
    gl_Position = vec4(
      2.0 * uFocal * x / uResolution.x,
      (1.0 - 2.0 * uHorizon / uResolution.y) * z - 2.0 * uFocal * y / uResolution.y,
      0.0,
      z
    );
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uTexture;
  uniform float uReflection, uAspect, uAngle, uSink;
  varying vec2 vUV;
  void main() {
    vec2 uv = vUV;
    if (vUV.y > 1.0 - uSink) discard;
    vec2 q = abs(vec2(vUV.x - 0.5, (vUV.y - 0.5) * uAspect)) - vec2(0.5, uAspect * 0.5) + 0.028;
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.028;
    float mask = 1.0 - smoothstep(-0.0015, 0.002, dist);
    vec2 sampleUV = vec2(clamp(uv.x, 0.002, 0.998), 1.0 - clamp(uv.y, 0.002, 0.998));
    vec3 color = texture2D(uTexture, sampleUV).rgb;
    float center = exp(-uAngle * uAngle * 25.0);
    float edge = exp(-abs(dist + 0.006) * 160.0);
    color = mix(color * (0.78 + center * 0.22), vec3(0.80, 0.88, 1.0), edge * center * 0.8);
    if (uReflection > 0.5) {
      mask *= 0.90 * pow(uv.y, 0.90);
    }
    if (mask < 0.002) discard;
    gl_FragColor = vec4(color, mask);
  }
`;

const waterVertex = `
  precision mediump float;
  attribute vec2 aUV;
  varying vec2 vUV;
  void main() {
    vUV = aUV;
    gl_Position = vec4(aUV * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const waterFragment = `
  precision mediump float;
  uniform sampler2D uScene;
  uniform sampler2D uFlow;
  uniform vec2 uResolution;
  uniform float uFocal, uCamera, uHorizon, uWaterline, uTime;
  uniform vec4 uFlowBounds;
  uniform vec4 uPointer;
  varying vec2 vUV;

  vec3 surfaceData(vec2 point) {
    vec2 flowUV = clamp((point - uFlowBounds.xy) / uFlowBounds.zw + vec2(0.5 / ${FLOW_WIDTH}.0, 0.5 / ${FLOW_HEIGHT}.0), vec2(0.0), vec2(1.0));
    vec2 current = (texture2D(uFlow, flowUV).rg - vec2(128.0 / 255.0)) * (255.0 / 48.0);
    vec2 pointerDelta = point - uPointer.xy;
    float hover = exp(-dot(pointerDelta, pointerDelta) * 0.22) * uPointer.z;
    vec2 p = point * 0.65;
    p += vec2(sin(p.y * 0.7 + uTime * 0.13), cos(p.x * 0.56 - uTime * 0.09)) * 0.28;
    p += current * 0.3;
    vec2 slope = vec2(
      sin(p.y * 4.2 + p.x * 0.6 - uTime * 0.85) * 0.065
        + sin(p.y * 7.6 - p.x * 0.7 + uTime * 0.43) * 0.022,
      cos(p.y * 3.3 - p.x * 1.1 - uTime * 0.62) * 0.028
        + sin(p.x * 2.8 + p.y * 1.2 - uTime * 0.37) * 0.012
    ) * (1.0 + hover * 0.9) + current * vec2(0.32, 0.24);
    return vec3(slope, hover);
  }

  void main() {
    vec2 pixel = vec2(vUV.x, 1.0 - vUV.y) * uResolution;
    float depth = pixel.y - uHorizon;
    if (depth <= 8.0) discard;
    float z = uFocal * uCamera / depth;
    vec2 point = vec2((pixel.x - uResolution.x * 0.5) * z / uFocal, z);
    vec3 surface = surfaceData(point);
    vec2 slope = surface.xy;
    float hover = surface.z;
    float foreground = clamp((pixel.y - uWaterline) / (uResolution.y - uWaterline), 0.0, 1.0);
    float visualScale = clamp(uFocal / 720.0, 0.75, 1.5);
    vec2 displacement = clamp(slope * vec2(84.0, -46.0) * (0.85 + foreground * 0.7), vec2(-26.0, -16.0), vec2(26.0, 16.0)) * visualScale / uResolution;
    vec2 uv = clamp(vUV + displacement, vec2(0.001), vec2(0.999));
    vec2 blur = vec2(0.5 + foreground * 0.7) / uResolution;
    vec3 reflection = texture2D(uScene, uv).rgb * 0.50;
    reflection += texture2D(uScene, uv + vec2(blur.x, 0.0)).rgb * 0.20;
    reflection += texture2D(uScene, uv - vec2(blur.x, 0.0)).rgb * 0.20;
    reflection += texture2D(uScene, uv + vec2(0.0, blur.y)).rgb * 0.10;

    // Fresnel and transmission keep the near water clear. Its normals bend
    // the entire reflected scene, including the gaps between artworks.
    float fresnel = mix(0.63, 0.42, foreground);
    reflection *= fresnel * clamp(1.0 + dot(slope, vec2(0.42, -0.32)), 0.88, 1.12);
    // A broad, soft sheen follows the wave slope even in dark gaps. There
    // are no point lights, bright impact rings, or circular splash outlines.
    float sheen = smoothstep(-0.06, 0.085, slope.x * 0.28 + slope.y);
    vec3 water = vec3(0.002, 0.006, 0.010);
    water += vec3(0.016, 0.026, 0.036) * sheen * (0.32 + hover * 0.72);
    float coverage = smoothstep(uHorizon + 12.0, uWaterline - 8.0, pixel.y);
    gl_FragColor = vec4(water + reflection, coverage);
  }
`;

const starVertex = `
  precision mediump float;
  attribute vec3 aStar;
  uniform float uTime, uDpr;
  varying float vAlpha;
  void main() {
    gl_Position = vec4(aStar.xy, 0.0, 1.0);
    gl_PointSize = (0.7 + aStar.z * 0.75) * uDpr;
    vAlpha = (0.09 + aStar.z * 0.24) * (0.75 + 0.25 * sin(uTime * 0.3 + aStar.x * 28.0));
  }
`;
const starFragment = `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    gl_FragColor = vec4(0.65, 0.69, 0.89, vAlpha * (1.0 - smoothstep(0.05, 0.5, d)));
  }
`;

function program(gl, vertex, fragment) {
  const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision ? 'highp' : 'mediump';
  const shaders = [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]].map(([type, source]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source.replace('precision mediump float;', `precision ${precision} float;`));
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  });
  const result = gl.createProgram();
  shaders.forEach(shader => gl.attachShader(result, shader));
  gl.linkProgram(result);
  shaders.forEach(shader => gl.deleteShader(shader));
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
  return result;
}

export class WebGLRenderer {
  constructor(canvas, images) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.cardProgram = program(gl, vertexSource, fragmentSource);
    this.starProgram = program(gl, starVertex, starFragment);
    this.waterProgram = program(gl, waterVertex, waterFragment);
    this.uniforms = {};
    for (const name of ['Resolution', 'Size', 'Radius', 'Angle', 'Focal', 'Camera', 'Horizon', 'Reflection', 'Scale', 'Lift', 'Aspect', 'Texture', 'Sink']) {
      this.uniforms[name] = gl.getUniformLocation(this.cardProgram, `u${name}`);
    }
    this.uvAttribute = gl.getAttribLocation(this.cardProgram, 'aUV');
    this.starAttribute = gl.getAttribLocation(this.starProgram, 'aStar');
    this.starTime = gl.getUniformLocation(this.starProgram, 'uTime');
    this.starDpr = gl.getUniformLocation(this.starProgram, 'uDpr');
    this.waterUniforms = {};
    for (const name of ['Scene', 'Flow', 'FlowBounds', 'Pointer', 'Resolution', 'Focal', 'Camera', 'Horizon', 'Waterline', 'Time']) {
      this.waterUniforms[name] = gl.getUniformLocation(this.waterProgram, `u${name}`);
    }
    this.waterAttribute = gl.getAttribLocation(this.waterProgram, 'aUV');
    this.screenBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    this.reflectionBuffer = gl.createFramebuffer();
    this.reflectionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.reflectionTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.bufferWidth = 0;
    this.bufferHeight = 0;
    this.flowTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.flowTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FLOW_WIDTH, FLOW_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.flowRevision = -1;
    const grid = [];
    const nx = 12, ny = 28;
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const u = x / nx, v = y / ny, u1 = (x + 1) / nx, v1 = (y + 1) / ny;
        grid.push(u, v, u1, v, u, v1, u, v1, u1, v, u1, v1);
      }
    }
    this.vertexCount = grid.length / 2;
    this.meshBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.STATIC_DRAW);
    let seed = 37;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const stars = [];
    for (let i = 0; i < 100; i++) stars.push(random() * 2 - 1, 1 - random() * 1.02, random());
    this.starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stars), gl.STATIC_DRAW);
    this.textures = images.map(image => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return texture;
    });
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  }

  drawCards(cards, config, reflection) {
    const gl = this.gl, u = this.uniforms;
    gl.useProgram(this.cardProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshBuffer);
    gl.enableVertexAttribArray(this.uvAttribute);
    gl.vertexAttribPointer(this.uvAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u.Resolution, config.width, config.height);
    gl.uniform2f(u.Size, config.cardWidth, config.cardHeight);
    gl.uniform1f(u.Aspect, config.cardHeight / config.cardWidth);
    gl.uniform1f(u.Radius, config.radius);
    gl.uniform1f(u.Focal, config.focal);
    gl.uniform1f(u.Camera, config.camera);
    gl.uniform1f(u.Horizon, config.horizon);
    gl.uniform1i(u.Texture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(u.Reflection, reflection);
    for (const card of cards) {
      gl.uniform1f(u.Angle, card.angle);
      gl.uniform1f(u.Sink, card.sink || 0);
      gl.uniform1f(u.Scale, card.scale ?? 1);
      gl.uniform1f(u.Lift, card.lift ?? config.lift);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[card.index]);
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
    gl.disableVertexAttribArray(this.uvAttribute);
  }

  render(cards, config, seconds, energy, hover, dpr, water, waterTime) {
    const gl = this.gl;
    const width = gl.canvas.width, height = gl.canvas.height;
    gl.viewport(0, 0, width, height);
    if (this.bufferWidth !== width || this.bufferHeight !== height) {
      this.bufferWidth = width; this.bufferHeight = height;
      gl.bindTexture(gl.TEXTURE_2D, this.reflectionTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.reflectionBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.reflectionTexture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Unable to initialize the water surface');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.reflectionBuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawCards(cards, config, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.starProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starBuffer);
    gl.enableVertexAttribArray(this.starAttribute);
    gl.vertexAttribPointer(this.starAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(this.starTime, seconds);
    gl.uniform1f(this.starDpr, dpr);
    gl.drawArrays(gl.POINTS, 0, 100);
    gl.disableVertexAttribArray(this.starAttribute);

    const u = this.waterUniforms;
    gl.useProgram(this.waterProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.screenBuffer);
    gl.enableVertexAttribArray(this.waterAttribute);
    gl.vertexAttribPointer(this.waterAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u.Resolution, config.width, config.height);
    gl.uniform1f(u.Focal, config.focal);
    gl.uniform1f(u.Camera, config.camera);
    gl.uniform1f(u.Horizon, config.horizon);
    gl.uniform1f(u.Waterline, config.waterline);
    gl.uniform1f(u.Time, waterTime);
    gl.uniform4fv(u.FlowBounds, FLOW_BOUNDS);
    gl.uniform4fv(u.Pointer, water.hoverUniform);
    gl.uniform1i(u.Flow, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.flowTexture);
    if (this.flowRevision !== water.revision) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FLOW_WIDTH, FLOW_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, water.pixels);
      this.flowRevision = water.revision;
    }
    gl.uniform1i(u.Scene, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.reflectionTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(this.waterAttribute);

    this.drawCards(cards, config, 0);
  }
}

// An affine triangle mesh preserves the curved gallery on browsers without WebGL.
export class CanvasRenderer {
  constructor(canvas, images) {
    this.ctx = canvas.getContext('2d');
    this.images = images;
  }

  triangle(image, source, destination, alpha) {
    const ctx = this.ctx;
    const [s0, s1, s2] = source, [p0, p1, p2] = destination;
    const det = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    if (Math.abs(det) < 0.001) return;
    const solve = key => [
      (p0[key] * (s1.y - s2.y) + p1[key] * (s2.y - s0.y) + p2[key] * (s0.y - s1.y)) / det,
      (p0[key] * (s2.x - s1.x) + p1[key] * (s0.x - s2.x) + p2[key] * (s1.x - s0.x)) / det,
      (p0[key] * (s1.x * s2.y - s2.x * s1.y) + p1[key] * (s2.x * s0.y - s0.x * s2.y) + p2[key] * (s0.x * s1.y - s1.x * s0.y)) / det,
    ];
    const x = solve('x'), y = solve('y');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
    ctx.clip();
    ctx.transform(x[0], y[0], x[1], y[1], x[2], y[2]);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }

  render(cards, config, seconds, energy, hover, dpr, water, waterTime) {
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, config.width, config.height);
    const waterColor = ctx.createLinearGradient(0, config.horizon, 0, config.height);
    waterColor.addColorStop(0, 'rgba(0,5,9,0)');
    waterColor.addColorStop(0.5, 'rgba(1,6,9,.6)');
    waterColor.addColorStop(1, 'rgba(1,4,7,.6)');
    ctx.fillStyle = waterColor;
    ctx.fillRect(0, config.horizon, config.width, config.height - config.horizon);
    for (const reflection of [true, false]) {
      for (const card of cards) {
        const image = this.images[card.index];
        const scale = card.scale ?? 1;
        for (let row = 0; row < 16; row++) {
          if(row / 16 > 1 - (card.sink || 0)) continue;
          for (let col = 0; col < 6; col++) {
            const u = col / 6, v = row / 16, u1 = (col + 1) / 6, v1 = (row + 1) / 16;
            const uv = [[u, v], [u1, v], [u1, v1], [u, v1]];
            const source = uv.map(([x, y]) => ({ x: x * image.width, y: y * image.height }));
            const points = uv.map(([x, y]) => {
              const p = project(x, y, card.angle, config, reflection, scale, (card.lift ?? config.lift) - (card.sink || 0) * (config.cardHeight * scale + config.lift));
              if (reflection) {
                const point = waterPoint(p.x, p.y, config);
                if (point) {
                  const slope = waterSlope(point.x, point.z, waterTime, water);
                  const displacement = waterDisplacement(slope, config, p.y);
                  p.x += displacement.x;
                  p.y += displacement.y;
                }
              }
              return p;
            });
            const alpha = reflection ? 0.49 * Math.pow((v + v1) / 2, 1.10) : 1;
            for (const tri of [[0, 1, 2], [0, 2, 3]]) this.triangle(image, tri.map(i => source[i]), tri.map(i => points[i]), alpha);
          }
        }
      }
    }
  }

}
