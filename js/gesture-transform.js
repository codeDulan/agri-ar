AFRAME.registerComponent('gesture-transform', {
  schema: {
    enabled: { default: false },
    min: { default: 0.04 },
    max: { default: 0.5 },
    rotSpeed: { default: 0.4 }        // degrees per pixel
  },

  init() {
    this.obj = this.el.object3D;

    this.oneActive = false;
    this.pinchActive = false;
    this.lastX = 0;
    this.startPinchDist = 0;
    this.startScale = this.obj.scale.x;

    this._ts = this.onTouchStart.bind(this);
    this._tm = this.onTouchMove.bind(this);
    this._te = this.onTouchEnd.bind(this);
    this._md = this.onMouseDown.bind(this);
    this._mm = this.onMouseMove.bind(this);
    this._mu = this.onMouseUp.bind(this);

    window.addEventListener('touchstart', this._ts, { passive: false });
    window.addEventListener('touchmove', this._tm, { passive: false });
    window.addEventListener('touchend', this._te);
    window.addEventListener('mousedown', this._md);
    window.addEventListener('mousemove', this._mm);
    window.addEventListener('mouseup', this._mu);
  },

  remove() {
    window.removeEventListener('touchstart', this._ts);
    window.removeEventListener('touchmove', this._tm);
    window.removeEventListener('touchend', this._te);
    window.removeEventListener('mousedown', this._md);
    window.removeEventListener('mousemove', this._mm);
    window.removeEventListener('mouseup', this._mu);
  },

  _dist(t) {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  },

  // ignore touches that start on a UI button
  _onUI(e) {
    return e.target.closest && e.target.closest('#ui button, #ui .searchbar');
  },

  onTouchStart(e) {
    if (!this.data.enabled || this._onUI(e)) return;
    if (e.touches.length === 1) {
      this.oneActive = true;
      this.lastX = e.touches[0].clientX;
    } else if (e.touches.length === 2) {
      this.pinchActive = true;
      this.oneActive = false;
      this.startPinchDist = this._dist(e.touches);
      this.startScale = this.obj.scale.x;
    }
  },

  onTouchMove(e) {
    if (!this.data.enabled) return;

    if (this.pinchActive && e.touches.length === 2) {
      e.preventDefault();
      const factor = this._dist(e.touches) / this.startPinchDist;
      this._setScale(this.startScale * factor);
    } else if (this.oneActive && e.touches.length === 1) {
      e.preventDefault();
      const x = e.touches[0].clientX;
      this._rotate((x - this.lastX) * this.data.rotSpeed);
      this.lastX = x;
    }
  },

  onTouchEnd(e) {
    if (e.touches.length === 0) { this.oneActive = false; this.pinchActive = false; }
    else if (e.touches.length === 1) {
      this.pinchActive = false;
      this.oneActive = true;
      this.lastX = e.touches[0].clientX;
    }
  },

  onMouseDown(e) {
    if (!this.data.enabled || this._onUI(e)) return;
    this.oneActive = true;
    this.lastX = e.clientX;
  },
  onMouseMove(e) {
    if (!this.data.enabled || !this.oneActive) return;
    this._rotate((e.clientX - this.lastX) * this.data.rotSpeed);
    this.lastX = e.clientX;
  },
  onMouseUp() { this.oneActive = false; },

  _rotate(deg) {
    this.obj.rotation.y += THREE.MathUtils.degToRad(deg);
  },

  _setScale(s) {
    s = Math.min(this.data.max, Math.max(this.data.min, s));
    this.obj.scale.set(s, s, s);
  }
});
