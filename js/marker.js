// Marker-AR page logic: react to marker found / lost, and surface
// camera-permission errors clearly.

const marker = document.querySelector('#hiro');
const scanHint = document.querySelector('#scan-hint');

marker.addEventListener('markerFound', () => {
  window.setStatus('Marker locked ✓');
  scanHint.style.display = 'none';
});

marker.addEventListener('markerLost', () => {
  window.setStatus('Searching for marker…');
  scanHint.style.display = '';
});

// AR.js requests the camera as soon as the scene initialises. If the user
// blocks it (or there is no camera) getUserMedia rejects — tell them why.
window.addEventListener('load', () => {
  navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      stream.getTracks().forEach(t => t.stop()); // release; AR.js opens its own
      window.setStatus('Camera ready — show the marker');
    })
    .catch(err => {
      window.setStatus('⚠️ Camera blocked: ' + err.name);
      scanHint.innerHTML = 'Camera permission denied. Enable it in the address bar and reload.';
    });
});
