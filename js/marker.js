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

// Camera start is gated behind the Start button — see js/ar-start.js.
// (Pre-opening the camera here previously made Android reopen on the front
// camera, and an automatic on-load request is blocked while overlay apps run.)
