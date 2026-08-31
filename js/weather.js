// Live weather via the Open-Meteo REST API (no key, CORS-enabled).
// Fetches current conditions for the user's location (or a fallback farm
// coordinate) and broadcasts them as a `weather-updated` event on document.

(function () {
  const FALLBACK = { lat: 7.2906, lon: 80.6337, name: 'Kandy, Sri Lanka' };
  const REFRESH_MS = 5 * 60 * 1000; // re-poll every 5 min

  // WMO weather-code -> our three visual states
  function classify(code) {
    if (code == null) return 'clear';
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) return 'rain';
    if ([2,3,45,48].includes(code)) return 'cloudy';
    return 'clear'; // 0,1 and anything else
  }

  function compass(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function getCoords() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(FALLBACK);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }),
        ()  => resolve(FALLBACK),
        { timeout: 6000, maximumAge: 600000 }
      );
    });
  }

  async function poll(coords) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}` +
      `&longitude=${coords.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m` +
      `&wind_speed_unit=ms`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
    const j = await res.json();
    const c = j.current;

    const data = {
      place: coords.name,
      temperature: Math.round(c.temperature_2m),
      windSpeed: +c.wind_speed_10m.toFixed(1),      // m/s
      windDir: Math.round(c.wind_direction_10m),     // degrees (FROM)
      windCompass: compass(c.wind_direction_10m),
      code: c.weather_code,
      condition: classify(c.weather_code),           // 'clear' | 'cloudy' | 'rain'
      time: new Date(c.time)
    };

    window.AgriWeather = { ...(window.AgriWeather || {}), data };
    document.dispatchEvent(new CustomEvent('weather-updated', { detail: data }));
    console.log('[AgriAR] weather', data);
    return data;
  }

  async function start() {
    const coords = await getCoords();
    const run = () => poll(coords).catch((e) => {
      console.warn('[AgriAR] weather fetch failed:', e.message);
      document.dispatchEvent(new CustomEvent('weather-error', { detail: e.message }));
    });
    run();
    setInterval(run, REFRESH_MS);
    window.AgriWeather = { ...(window.AgriWeather || {}), refresh: run };
  }

  window.addEventListener('load', start);
})();
