(function () {
  let ctx = null;
  let master = null;
  let wind = null;   // { gain, filter }
  let rain = null;
  let enabled = false;

  function noiseBuffer() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function makeLoop(filterType, freq, q) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    if (q != null) filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    return { gain, filter };
  }

  function enable() {
    if (ctx) { resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    wind = makeLoop('lowpass', 480);
    rain = makeLoop('bandpass', 1600, 0.7);
    enabled = true;

    // apply whatever weather we already have
    if (window.AgriWeather && window.AgriWeather.data) applyWeather(window.AgriWeather.data);
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setEnabled(on) {
    enabled = on;
    if (!ctx) { if (on) enable(); return; }
    master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.1);
    if (on) resume();
  }

  function toggle() { setEnabled(!enabled); return enabled; }

  function ping() {
    if (!ctx || !enabled) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g).connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  }

  function applyWeather(d) {
    if (!ctx || !d) return;
    const t = ctx.currentTime;
    // wind: 0..15 m/s -> 0..0.18 gain, and open the filter a bit as it rises
    const w = Math.min(d.windSpeed / 15, 1);
    wind.gain.gain.setTargetAtTime(0.03 + w * 0.15, t, 0.5);
    wind.filter.frequency.setTargetAtTime(350 + w * 500, t, 0.5);
    // rain on/off
    rain.gain.gain.setTargetAtTime(d.condition === 'rain' ? 0.14 : 0, t, 0.4);
  }

  document.addEventListener('weather-updated', (e) => applyWeather(e.detail));

  window.AgriAudio = {
    enable,
    toggle,
    ping,
    setEnabled,
    get enabled() { return enabled; }
  };
})();
