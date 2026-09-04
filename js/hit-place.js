// A-Frame component: hit-place
// Our own WebXR hit-test reticle + placement, replacing A-Frame 1.6's
// `ar-hit-test` (which did not surface a reticle on the test device even
// though the underlying hit-test API works).
//
// <a-scene hit-place="reticle: #reticle">
//   emits 'hitplace-surface' the first time a surface is seen
//   emits 'hitplace-select' (detail: {position}) on a screen tap over the reticle

AFRAME.registerComponent('hit-place', {
  schema: { reticle: { type: 'selector' } },

  init() {
    this.hitSource = null;
    this.viewerSpace = null;
    this.refSpace = null;
    this.hasSurface = false;
    this.reticleVisible = false;

    this._pos = new THREE.Vector3();
    this._quat = new THREE.Quaternion();

    this.el.addEventListener('enter-vr', () => this._onEnter());
    this.el.addEventListener('exit-vr',  () => this._onExit());
  },

  async _onEnter() {
    if (!this.el.is('ar-mode')) return;
    const session = this.el.renderer.xr.getSession();
    if (!session) return;
    this.session = session;
    this.refSpace = this.el.renderer.xr.getReferenceSpace();

    try {
      this.viewerSpace = await session.requestReferenceSpace('viewer');
      this.hitSource = await session.requestHitTestSource({ space: this.viewerSpace });
      console.log('[hit-place] hit-test source ready');
    } catch (e) {
      console.warn('[hit-place] could not create hit-test source:', e.message);
      return;
    }

    this._onSelect = () => {
      if (this.hasSurface && this.reticleVisible) {
        this.el.emit('hitplace-select', { position: this._pos.clone() });
      }
    };
    session.addEventListener('select', this._onSelect);
  },

  _onExit() {
    if (this.session && this._onSelect) {
      this.session.removeEventListener('select', this._onSelect);
    }
    this.hitSource = null;
    this.hasSurface = false;
    this._setReticle(false);
  },

  _setReticle(v) {
    this.reticleVisible = v;
    if (this.data.reticle) this.data.reticle.setAttribute('visible', v);
  },

  tick() {
    if (!this.hitSource || this.paused) return;
    // A-Frame stores the live XRFrame on the scene; fall back to three.js
    const frame = this.el.frame ||
      (this.el.renderer.xr.getFrame && this.el.renderer.xr.getFrame());
    if (!frame || !this.refSpace) return;

    const results = frame.getHitTestResults(this.hitSource);
    if (!results.length) { this._setReticle(false); return; }

    const pose = results[0].getPose(this.refSpace);
    if (!pose) { this._setReticle(false); return; }

    const p = pose.transform.position;
    const o = pose.transform.orientation;
    this._pos.set(p.x, p.y, p.z);
    this._quat.set(o.x, o.y, o.z, o.w);

    const r = this.data.reticle;
    if (r) {
      r.object3D.position.copy(this._pos);
      r.object3D.quaternion.copy(this._quat);
    }
    this._setReticle(true);

    if (!this.hasSurface) {
      this.hasSurface = true;
      this.el.emit('hitplace-surface');
    }
  }
});
