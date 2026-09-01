// Marker page: a self-contained 3-scenario demonstration of how weather
// affects a crop field. Each button synthesises a `weather-updated` event,
// so it reuses the exact same weather-fx pipeline the markerless page uses
// with live data (sky, turbine, crop tint, panel).

(function () {
  const compass = (deg) =>
    ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];

  const SCENARIOS = {
    sunny: { condition: 'clear',  windSpeed: 2,  windDir: 90,  temperature: 34,
             place: 'Scenario: Sunny — field dries out' },
    rainy: { condition: 'rain',   windSpeed: 5,  windDir: 200, temperature: 24,
             place: 'Scenario: Rainy — field turns lush' },
    windy: { condition: 'cloudy', windSpeed: 15, windDir: 280, temperature: 26,
             place: 'Scenario: Windy — turbine at full output' }
  };

  function set(key) {
    const s = SCENARIOS[key];
    if (!s) return;
    const detail = { ...s, windCompass: compass(s.windDir), code: 0, time: new Date() };
    document.dispatchEvent(new CustomEvent('weather-updated', { detail }));

    document.querySelectorAll('#scenario-bar button').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.scenario === key));
    window.setStatus?.(key[0].toUpperCase() + key.slice(1) + ' scenario');
    window.AgriAudio?.ping?.();
  }

  document.querySelector('#scenario-bar')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-scenario]');
    if (btn) set(btn.dataset.scenario);
  });

  // start on Sunny once the scene is ready
  const scene = document.querySelector('a-scene');
  if (scene && scene.hasLoaded) set('sunny');
  else scene?.addEventListener('loaded', () => set('sunny'));
})();
