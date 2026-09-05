// Landing-page capability probe.
// Tells the user up front what their device/browser supports, so failures

(async function deviceCheck() {
  const el = document.querySelector('#device-check');
  const notes = [];

  // 1. Secure context — camera + WebXR require HTTPS or localhost.
  if (!window.isSecureContext) {
    notes.push('⚠️ Not a secure context (need HTTPS). AR will not start.');
  }

  // 2. Camera presence.
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!hasCamera) notes.push('⚠️ No camera API — Marker AR unavailable.');

  // 3. WebXR immersive-AR support (markerless).
  let xrAR = false;
  if (navigator.xr && navigator.xr.isSessionSupported) {
    try { xrAR = await navigator.xr.isSessionSupported('immersive-ar'); } catch (_) { }
  }
  if (!xrAR) {
    notes.push('ℹ️ WebXR immersive-AR not supported here — use Marker AR, or open Markerless on an Android/Chrome phone.');
  }

  if (notes.length === 0) {
    el.textContent = '✓ Device ready for both AR modes.';
    el.classList.add('device-check--ok');
  } else {
    el.innerHTML = notes.join('<br />');
    el.classList.add('device-check--warn');
  }
})();
