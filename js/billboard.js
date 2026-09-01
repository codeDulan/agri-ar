// A-Frame component: billboard
// Rotates the entity to face the active camera each frame (so text panels
// stay readable from any angle). yAxisOnly keeps it upright.

AFRAME.registerComponent('billboard', {
  schema: { yAxisOnly: { default: true } },

  init() {
    this._camWorld = new THREE.Vector3();
    this._selfWorld = new THREE.Vector3();
  },

  tick() {
    const cam = this.el.sceneEl.camera;
    if (!cam) return;
    cam.getWorldPosition(this._camWorld);
    this.el.object3D.getWorldPosition(this._selfWorld);

    if (this.data.yAxisOnly) {
      const dx = this._camWorld.x - this._selfWorld.x;
      const dz = this._camWorld.z - this._selfWorld.z;
      this.el.object3D.rotation.set(0, Math.atan2(dx, dz), 0);
    } else {
      this.el.object3D.lookAt(this._camWorld);
    }
  }
});
