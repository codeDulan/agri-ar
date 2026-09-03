// Marker-AR page logic: react to marker found / lost, and surface
// camera-permission errors clearly.

const marker = document.querySelector('#hiro');
const scanHint = document.querySelector('#scan-hint');

let announced = false;
marker.addEventListener('markerFound', () => {
  window.setStatus('Marker locked ✓');
  scanHint.style.display = 'none';
  if (!announced) { window.AgriAudio?.ping(); announced = true; }
});

marker.addEventListener('markerLost', () => {
  window.setStatus('Searching for marker…');
  scanHint.style.display = '';
});

// Note: we deliberately do NOT pre-open the camera here. Opening and then
// closing a stream right before AR.js opens its own caused Android Chrome to
// fall back to the front camera. AR.js handles the getUserMedia call and its
// own error reporting; we surface a generic hint if the video never appears.
window.addEventListener('load', () => {
  setTimeout(() => {
    const v = document.querySelector('video');
    if (!v || !v.srcObject) {
      window.setStatus('⚠️ Camera not available');
      scanHint.innerHTML = 'Allow camera access and reload the page.';
    }
  }, 5000);
});
