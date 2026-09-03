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

// Camera acquisition + rear-camera selection is handled in js/marker-camera.js.
