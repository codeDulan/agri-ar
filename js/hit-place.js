AFRAME.registerComponent('hit-place', {
  schema: { target: { type: 'selector' } },

  init() {
    this.hitSource = null;
    this.refSpace = null;
    this.hasSurface = false;
    this.tracking = false;      // currently following a hit
    this.paused = false;        // set true after placement

    this._pos = new THREE.Vector3();

    this.el.addEventListener('enter-vr', () => this._onEnter());
    this.el.addEventListener('exit-vr', () => this._onExit());
  },

  async _onEnter() {
    if (!this.el.is('ar-mode')) return;
    const session = this.el.renderer.xr.getSession();
    if (!session) return;
    this.session = session;
    this.refSpace = this.el.renderer.xr.getReferenceSpace();

    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      this.hitSource = await session.requestHitTestSource({ space: viewerSpace });
      console.log('[hit-place] hit-test source ready');
    } catch (e) {
      console.warn('[hit-place] could not create hit-test source:', e.message);
      return;
    }

    this._onSelect = () => {
      if (this.tracking && !this.paused) {
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
    this.tracking = false;
  },

  tick() {
    if (!this.hitSource || this.paused || !this.data.target) return;
    const frame = this.el.frame ||
      (this.el.renderer.xr.getFrame && this.el.renderer.xr.getFrame());
    if (!frame || !this.refSpace) return;

    const results = frame.getHitTestResults(this.hitSource);
    if (!results.length) { this.tracking = false; return; }

    const pose = results[0].getPose(this.refSpace);
    if (!pose) { this.tracking = false; return; }

    const p = pose.transform.position;
    this._pos.set(p.x, p.y, p.z);

    // move the preview, keep it upright (yaw only, left to the user afterwards)
    this.data.target.object3D.position.copy(this._pos);
    if (!this.data.target.getAttribute('visible')) {
      this.data.target.setAttribute('visible', true);
    }
    this.tracking = true;

    if (!this.hasSurface) {
      this.hasSurface = true;
      this.el.emit('hitplace-surface');
    }
  }
});
