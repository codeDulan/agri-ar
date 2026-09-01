// A-Frame component: weather-fx
// Turns live weather (from the `weather-updated` document event) into scene
// changes:
//   - wind speed   -> turbine blade RPM (window.turbineRPM, read by spin-part)
//   - wind direction -> turbine yaw + a wind-arrow indicator
//   - condition    -> a sun (clear) OR clouds + falling rain (rain) in the sky
//   - updates a text panel (selector in `panel`)
//
// Place one on an entity that sits ABOVE the field, e.g.
//   <a-entity weather-fx="turbine: #turbine-ent; panel: #marker-readout;
//             panelRoot: #marker-panel"></a-entity>

AFRAME.registerComponent('weather-fx', {
  schema: {
    turbine:   { type: 'selector' },
    panel:     { type: 'selector' },
    panelRoot: { type: 'selector' },
    rainCount: { type: 'int', default: 140 }
  },

  init() {
    this.condition = 'clear';

    // --- sky containers -------------------------------------------------
    this.sun    = this._makeSun();
    this.clouds = this._makeClouds();
    this.rain   = this._makeRain(this.data.rainCount);
    this.el.setObject3D('sun', this.sun);
    this.el.setObject3D('clouds', this.clouds);
    this.el.setObject3D('rain', this.rain.mesh);

    this._apply('clear');

    this._hasData = false;
    this._onWeather = (e) => { this._hasData = true; this._handle(e.detail); };
    document.addEventListener('weather-updated', this._onWeather);

    this._onError = (e) => {
      if (this._hasData) return;                 // keep last good reading
      if (this.data.panelRoot) this.data.panelRoot.setAttribute('visible', true);
      if (this.data.panel) {
        this.data.panel.setAttribute('text', 'value',
          'Live weather unavailable\n(' + (e.detail || 'network error') + ')\nShowing default scene');
      }
    };
    document.addEventListener('weather-error', this._onError);

    if (window.AgriWeather && window.AgriWeather.data) this._handle(window.AgriWeather.data);
  },

  remove() {
    document.removeEventListener('weather-updated', this._onWeather);
    document.removeEventListener('weather-error', this._onError);
  },

  // --------------------------------------------------------------------
  _handle(d) {
    if (!d) return;

    // wind -> blade speed (cap so it stays believable)
    window.turbineRPM = Math.min(Math.max(d.windSpeed * 2.2, 1), 32);

    // wind direction -> turbine yaw (face into the wind)
    if (this.data.turbine) {
      this.data.turbine.setAttribute('rotation',
        { x: 0, y: (d.windDir + 180) % 360, z: 0 });
    }

    this._apply(d.condition);
    this._updatePanel(d);
  },

  _apply(condition) {
    this.condition = condition;
    const rain = condition === 'rain';
    const clear = condition === 'clear';
    this.sun.visible    = clear;
    this.clouds.visible = !clear;
    this.rain.mesh.visible = rain;
  },

  _updatePanel(d) {
    if (this.data.panelRoot) this.data.panelRoot.setAttribute('visible', true);
    if (!this.data.panel) return;
    const label = { clear: 'Sunny', cloudy: 'Cloudy', rain: 'Rainy' }[d.condition] || '—';
    const txt =
      `${d.place}   ${d.temperature}°C\n` +
      `Wind ${d.windSpeed} m/s  ${d.windCompass} (${d.windDir}°)\n` +
      `${label}`;
    this.data.panel.setAttribute('text', 'value', txt);
  },

  // --- builders ------------------------------------------------------
  _makeSun() {
    const g = new THREE.Group();
    g.position.set(1.15, 1.95, -0.7);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.22 })
    );
    g.add(core, glow);
    return g;
  },

  _makeClouds() {
    const g = new THREE.Group();
    g.position.set(0.1, 1.9, -0.5);
    const mat = new THREE.MeshLambertMaterial({ color: 0xdfe4e8 });
    const puffs = [[0,0,0,0.28],[0.28,0.03,0.05,0.22],[-0.28,0.01,-0.03,0.23],[0.08,-0.03,0.2,0.19]];
    puffs.forEach(([x,y,z,r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), mat);
      m.position.set(x, y, z);
      m.scale.y = 0.6;
      g.add(m);
    });
    return g;
  },

  _makeRain(count) {
    const geo = new THREE.CylinderGeometry(0.006, 0.006, 0.16, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9fc4e6, transparent: true, opacity: 0.6 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false;

    const area = { x: 1.9, z: 1.4, top: 2.2, bottom: 0 };
    const drops = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const p = {
        x: (Math.random() - 0.5) * area.x + 0.2,
        y: Math.random() * area.top,
        z: (Math.random() - 0.5) * area.z - 0.4,
        v: 2.5 + Math.random() * 2.0
      };
      drops.push(p);
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    return { mesh, drops, area, dummy };
  },

  tick(t, dt) {
    if (this.condition !== 'rain' || !dt) return;
    const s = dt / 1000;
    const { mesh, drops, area, dummy } = this.rain;
    for (let i = 0; i < drops.length; i++) {
      const p = drops[i];
      p.y -= p.v * s;
      if (p.y < area.bottom) {
        p.y = area.top;
        p.x = (Math.random() - 0.5) * area.x + 0.2;
        p.z = (Math.random() - 0.5) * area.z - 0.4;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
});
