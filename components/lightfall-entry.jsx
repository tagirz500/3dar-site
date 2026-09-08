import { Component } from 'react';
import { createRoot } from 'react-dom/client';
import PrismaticBurst from './PrismaticBurst';

// Preserve the registry component verbatim; isolate static-site integration here.
class BackgroundBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
// Keep the existing mount contract so the service-card choreography is unchanged.
window.mountServiceLightfall = host => {
  const root = createRoot(host);
  root.render(<BackgroundBoundary><PrismaticBurst
    animationType="rotate3d"
    intensity={1.5}
    speed={0.3}
    distort={1.5}
    paused={false}
    offset={{ x: 0, y: 0 }}
    hoverDampness={0.25}
    rayCount={24}
    mixBlendMode="lighten"
    colors={['#ff007a', '#4d3dff', '#ffffff']}
  /></BackgroundBoundary>);
  return () => root.unmount();
};
