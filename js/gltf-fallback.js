// A-Frame component: gltf-fallback
// Usage: <a-entity gltf-model="url(#turbine)" gltf-fallback="#turbine-fallback">
//
// If the glTF fails to load (missing file, decode error, network), the entity
// referenced by the selector is cloned in as a stand-in and a warning is logged.
// This keeps the AR scene usable during development and on flaky connections,
// and gives us a concrete talking point for the report's troubleshooting section.

AFRAME.registerComponent('gltf-fallback', {
  schema: { type: 'selector' },

  init() {
    this.el.addEventListener('model-error', (e) => {
      console.warn('[AgriAR] glTF failed, using fallback:', e.detail && e.detail.src);
      if (window.setStatus) window.setStatus('⚠️ model missing — showing placeholder');

      if (this.data) {
        const clone = this.data.cloneNode(true);
        clone.removeAttribute('id');
        clone.setAttribute('visible', true);
        this.el.appendChild(clone);
      }
    });

    this.el.addEventListener('model-loaded', () => {
      console.log('[AgriAR] glTF loaded:', this.el.getAttribute('gltf-model'));
    });
  }
});
