// A-Frame component: crop-health
// Tints a loaded glTF crop model toward a health colour whenever a
// `crop-health` event fires on document (dispatched by weather-fx).
//   green  = healthy   amber = stressed   brown = poor
//
// Usage: <a-entity gltf-model="#crop" crop-health></a-entity>

AFRAME.registerComponent('crop-health', {
  schema: { strength: { default: 0.55 } },   // 0 = no tint, 1 = full colour

  init() {
    this.originals = [];   // { mat, color: THREE.Color }
    this.pending = null;

    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse((o) => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m && m.color) this.originals.push({ mat: m, color: m.color.clone() });
        });
      });
      if (this.pending != null) this._apply(this.pending);
    });

    this._onHealth = (e) => {
      this.pending = e.detail.hex;
      if (this.originals.length) this._apply(e.detail.hex);
    };
    document.addEventListener('crop-health', this._onHealth);
  },

  remove() {
    document.removeEventListener('crop-health', this._onHealth);
  },

  _apply(hex) {
    const target = new THREE.Color(hex);
    const s = this.data.strength;
    this.originals.forEach(({ mat, color }) => {
      mat.color.copy(color).lerp(target, s);
      mat.needsUpdate = true;
    });
  }
});
