(function () {
  const FALLBACK = { lat: 7.2906, lon: 80.6337, name: 'Kandy, Sri Lanka' };
  const REFRESH_MS = 5 * 60 * 1000;

  let coords = FALLBACK;          // current location being shown
  let timer = null;

  // WMO weather-code -> our three visual states
  function classify(code) {
    if (code == null) return 'clear';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return 'rain';
    if ([2, 3, 45, 48].includes(code)) return 'cloudy';
    return 'clear';
  }

  function compass(deg) {
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
  }

  // --- geocoding: city name -> coords ---------------------------------
  async function geocode(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding HTTP ' + res.status);
    const j = await res.json();
    if (!j.results || !j.results.length) throw new Error('City not found: ' + name);
    const r = j.results[0];
    return {
      lat: r.latitude,
      lon: r.longitude,
      name: [r.name, r.admin1, r.country].filter(Boolean).slice(0, 2).join(', ')
    };
  }

  // --- device geolocation -------------------------------------------
  function geolocate() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(FALLBACK);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }),
        () => resolve(FALLBACK),
        { timeout: 6000, maximumAge: 600000 }
      );
    });
  }

  // --- forecast ----------------------------------------------------
  async function poll() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}` +
      `&longitude=${coords.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m` +
      `&wind_speed_unit=ms`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
    const c = (await res.json()).current;

    const data = {
      place: coords.name,
      temperature: Math.round(c.temperature_2m),
      windSpeed: +c.wind_speed_10m.toFixed(1),
      windDir: Math.round(c.wind_direction_10m),
      windCompass: compass(c.wind_direction_10m),
      code: c.weather_code,
      condition: classify(c.weather_code),
      time: new Date(c.time)
    };

    // Demo overrides: ?condition=rain|clear|cloudy  &  ?wind=8
    const q = new URLSearchParams(location.search);
    if (q.has('condition')) data.condition = q.get('condition');
    if (q.has('wind')) { data.windSpeed = +q.get('wind'); }

    window.AgriWeather = { ...(window.AgriWeather || {}), data };
    document.dispatchEvent(new CustomEvent('weather-updated', { detail: data }));
    console.log('[AgriAR] weather', data);
    return data;
  }

  function run() {
    return poll().catch((e) => {
      console.warn('[AgriAR] weather fetch failed:', e.message);
      document.dispatchEvent(new CustomEvent('weather-error', { detail: e.message }));
    });
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = setInterval(run, REFRESH_MS);
  }

  // --- public API -------------------------------------------------
  async function setCity(name) {
    document.dispatchEvent(new CustomEvent('weather-searching', { detail: name }));
    try {
      coords = await geocode(name);
      document.dispatchEvent(new CustomEvent('weather-location', { detail: coords.name }));
      await run();
      schedule();
    } catch (e) {
      document.dispatchEvent(new CustomEvent('weather-error', { detail: e.message }));
    }
  }

  async function start() {
    const q = new URLSearchParams(location.search);
    coords = q.has('city') ? await geocode(q.get('city')).catch(() => FALLBACK)
      : await geolocate();
    document.dispatchEvent(new CustomEvent('weather-location', { detail: coords.name }));
    await run();
    schedule();
  }

  window.AgriWeather = { refresh: run, setCity };
  window.addEventListener('load', start);
})();
