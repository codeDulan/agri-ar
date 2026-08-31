// Wires the #city-form search box to AgriWeather.setCity().
// Shared by marker.html and markerless.html.

(function () {
  const form  = document.querySelector('#city-form');
  if (!form) return;
  const input = form.querySelector('input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (name) window.AgriWeather?.setCity(name);
    input.blur();
  });

  document.addEventListener('weather-searching', (e) => window.setStatus?.('Finding ' + e.detail + '…'));
  document.addEventListener('weather-location',  (e) => window.setStatus?.('📍 ' + e.detail));
  document.addEventListener('weather-error',     (e) => window.setStatus?.('⚠️ ' + e.detail));
})();
