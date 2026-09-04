// Markerless-AR page logic.
//
// Primary path: the `hit-place` component runs a WebXR hit-test, previews the
// farm at the detected surface, and emits `hitplace-surface` / `hitplace-select`.
// Fallback path: if no surface is found within a few seconds, the user can tap
// anywhere to drop the farm ~1 m in front of them at an estimated floor height.

const scene    = document.querySelector('a-scene');
const farm     = document.querySelector('#farm');
const hint     = document.querySelector('#hint');
const controls = document.querySelector('#controls');
const resetBtn = document.querySelector('#reset');
const cameraEl = document.querySelector('a-camera');

let placed = false;
let surfaceFound = false;
let fallbackArmed = false;
let fallbackTimer = null;

function setHint(txt) { hint.innerHTML = txt; hint.hidden = false; }

// ---- place the farm (shared by both paths) ---------------------------
function hitPlace() { return scene.components['hit-place']; }

function finishPlacement() {
  placed = true;
  clearTimeout(fallbackTimer);
  if (hitPlace()) hitPlace().paused = true;       // stop following the aim
  window.AgriAudio?.ping();
  window.setStatus('Farm placed ✓');
  setHint('Drag to rotate · pinch to resize');
  controls.hidden = false;
  farm.setAttribute('visible', true);
  farm.setAttribute('gesture-transform', 'enabled', true);
  farm.emit('placed');
}

function placeInFront() {
  // position the farm 1 m ahead of the camera, dropped to an estimated floor
  const camObj = cameraEl.object3D;
  const dir = new THREE.Vector3();
  camObj.getWorldDirection(dir);            // points backwards in three.js
  dir.multiplyScalar(-1);
  dir.y = 0; dir.normalize();

  const pos = new THREE.Vector3();
  camObj.getWorldPosition(pos);
  pos.addScaledVector(dir, 1.0);
  pos.y = Math.max(0, camObj.position.y - 1.4);

  farm.object3D.position.copy(pos);
  finishPlacement();
}

// ---- session lifecycle ---------------------------------------------
scene.addEventListener('enter-vr', () => {
  if (!scene.is('ar-mode')) return;
  placed = false;
  surfaceFound = false;
  fallbackArmed = false;
  window.setStatus('Scanning for a surface…');
  setHint('Move your phone slowly across the floor.');

  armFallback();
});

// ARCore usually needs 6–12 s to lock the first surface, so only offer the
// tap-anywhere fallback after a longer wait, and word it as an option.
function armFallback() {
  clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(() => {
    if (placed || surfaceFound) return;
    fallbackArmed = true;
    window.setStatus('Still scanning…');
    setHint('Still looking for a surface — keep moving the phone, or <strong>tap anywhere</strong> to place it in front of you.');
  }, 12000);
}

scene.addEventListener('exit-vr', () => {
  clearTimeout(fallbackTimer);
  window.setStatus('AR session ended');
  setHint('Press Enter AR to start again.');
  controls.hidden = true;
});

// ---- hit-test path (our hit-place component) --------------------------
scene.addEventListener('hitplace-surface', () => {
  surfaceFound = true;
  fallbackArmed = false;               // real surface wins; retract the fallback
  clearTimeout(fallbackTimer);
  if (!placed) {
    window.setStatus('Aim, then tap to place');
    setHint('The farm follows your aim — <strong>tap</strong> to drop it here.');
  }
});

scene.addEventListener('hitplace-select', (e) => {
  if (placed) return;
  farm.object3D.position.copy(e.detail.position);
  farm.object3D.rotation.set(0, 0, 0);
  finishPlacement();
});

// ---- fallback tap ----------------------------------------------
scene.addEventListener('enter-vr', () => {
  const session = scene.renderer && scene.renderer.xr && scene.renderer.xr.getSession();
  if (!session) return;
  session.addEventListener('select', () => {
    if (!placed && fallbackArmed && !surfaceFound) placeInFront();
  });
});

// ---- controls -------------------------------------------------
document.querySelector('#refresh')?.addEventListener('click', () => {
  window.setStatus('Refreshing weather…');
  window.AgriWeather?.refresh?.();
});
document.addEventListener('weather-updated', (e) => {
  if (placed) window.setStatus(`${e.detail.condition} · wind ${e.detail.windSpeed} m/s`);
});

resetBtn.addEventListener('click', () => {
  placed = false;
  surfaceFound = false;
  fallbackArmed = false;
  farm.setAttribute('visible', false);
  farm.setAttribute('gesture-transform', 'enabled', false);
  farm.object3D.rotation.set(0, 0, 0);
  farm.object3D.scale.set(0.16, 0.16, 0.16);
  if (hitPlace()) { hitPlace().paused = false; hitPlace().hasSurface = false; hitPlace().tracking = false; }
  window.setStatus('Scanning for a surface…');
  setHint('Move the phone to scan, then tap to place the farm.');
  controls.hidden = true;
  armFallback();
});

// ---- desktop / no-WebXR preview ------------------------------
scene.addEventListener('loaded', async () => {
  const supported = navigator.xr &&
    await navigator.xr.isSessionSupported?.('immersive-ar').catch(() => false);
  if (!supported) {
    window.setStatus('Preview mode (no WebXR here)');
    setHint('No WebXR on this device — showing a static preview. Open on Android Chrome for real markerless AR.');
    farm.setAttribute('visible', true);
    farm.setAttribute('position', '0 0 -0.6');
    farm.setAttribute('scale', '0.12 0.12 0.12');
    farm.setAttribute('gesture-transform', 'enabled', true);
  }
});
