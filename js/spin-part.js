// A-Frame component: spin-part
// Rotates ONE named sub-object of a loaded glTF model (e.g. just the turbine
// blades, not the whole tower).
//
// Usage: <a-entity gltf-model="#turbine"
//                  spin-part="part: windturbine_tall_fan; axis: z; speed: 90">
//   speed = degrees per second. Set window.turbineRPM later (Step 6) to drive
//   it from live wind data; this component reads data.speed as the default.

AFRAME.registerComponent('spin-part', {
  schema: {
    part:  { type: 'string', default: '' },
    axis:  { type: 'string', default: 'z' },  // x | y | z
    speed: { type: 'number', default: 90 }    // deg/sec
  },

  init() {
    this.target = null;
    this.el.addEventListener('model-loaded', () => {
      const root = this.el.getObject3D('mesh');
      if (!root) return;
      this.target = root.getObjectByName(this.data.part) || null;
      if (!this.target) {
        // Help future debugging: list what names ARE in the model.
        const names = [];
        root.traverse(o => o.name && names.push(o.name));
        console.warn('[AgriAR] spin-part: "' + this.data.part +
                     '" not found. Available:', names);
      }
    });
  },

  tick(time, dt) {
    if (!this.target || !dt) return;
    const rpm = (window.turbineRPM != null) ? window.turbineRPM : null;
    const degPerSec = (rpm != null) ? rpm * 6 : this.data.speed; // rpm*360/60
    this.target.rotation[this.data.axis] += THREE.MathUtils.degToRad(degPerSec) * (dt / 1000);
  }
});
