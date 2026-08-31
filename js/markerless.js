// Markerless-AR page logic.
// A-Frame's `ar-hit-test` scene component does the heavy lifting: it runs a
// WebXR hit-test against detected surfaces, shows a reticle, and on the user's
// tap ("select") teleports #farm to the reticle and makes it visible.
// Here we just drive the UI around that and expose a re-place button.

const scene   = document.querySelector('a-scene');
const farm    = document.querySelector('#farm');
const hint    = document.querySelector('#hint');
const controls = document.querySelector('#controls');
const resetBtn = document.querySelector('#reset');

let placed = false;

// --- session lifecycle ---------------------------------------------------
scene.addEventListener('enter-vr', () => {
  if (scene.is('ar-mode')) {
    window.setStatus('Scanning for a surface…');
    hint.textContent = 'Move your phone slowly, then tap a surface to place the farm.';
    hint.hidden = false;
  }
});

scene.addEventListener('exit-vr', () => {
  window.setStatus('AR session ended');
  hint.textContent = 'Press Enter AR to start again.';
  hint.hidden = false;
  controls.hidden = true;
});

// --- hit-test feedback -------------------------------------------------
scene.addEventListener('ar-hit-test-start', () => {
  window.setStatus('Point at the floor…');
});

scene.addEventListener('ar-hit-test-achieved', () => {
  if (!placed) window.setStatus('Surface found — tap to place');
});

// Fired by ar-hit-test right after it places the target on tap.
scene.addEventListener('ar-hit-test-select', () => {
  placed = true;
  window.setStatus('Farm placed ✓');
  hint.hidden = true;
  controls.hidden = false;
  farm.emit('placed');            // Step 6 / audio can hook this
});

// --- re-place button --------------------------------------------------
resetBtn.addEventListener('click', () => {
  placed = false;
  farm.setAttribute('visible', false);
  scene.setAttribute('ar-hit-test', 'enabled', true);
  window.setStatus('Scanning for a surface…');
  hint.textContent = 'Tap a surface to place the farm.';
  hint.hidden = false;
  controls.hidden = true;
});

// --- desktop / no-WebXR preview -------------------------------------
// So the scene isn't just black when opened on a laptop for development.
scene.addEventListener('loaded', async () => {
  const supported = navigator.xr &&
    await navigator.xr.isSessionSupported?.('immersive-ar').catch(() => false);
  if (!supported) {
    window.setStatus('Preview mode (no WebXR here)');
    hint.innerHTML = 'No WebXR on this device — showing a static preview. ' +
                     'Open on Android Chrome for real markerless AR.';
    farm.setAttribute('visible', true);
    farm.setAttribute('position', '0 0 -0.6');
    farm.setAttribute('scale', '0.12 0.12 0.12');
  }
});
