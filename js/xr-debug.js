(function () {
  const debugMode = /[?&]debug=1/.test(location.search);
  const btn = document.querySelector('#xr-debug-btn');

  // The debug button is only shown when ?debug=1 is in the URL.
  if (!debugMode) { if (btn) btn.hidden = true; return; }

  const panel = document.createElement('div');
  panel.id = 'xr-debug';
  document.querySelector('#ui').appendChild(panel);
  btn?.addEventListener('click', () => { panel.hidden = !panel.hidden; });

  let lines = [];
  function log(msg) {
    const t = new Date().toLocaleTimeString().split(' ')[0];
    lines.push(`${t}  ${msg}`);
    if (lines.length > 40) lines = lines.slice(-40);
    panel.textContent = lines.join('\n');
    panel.scrollTop = panel.scrollHeight;
    console.log('[xr-debug]', msg);
  }

  window.addEventListener('error', (e) => log('JS ERROR: ' + e.message));
  window.addEventListener('unhandledrejection', (e) =>
    log('PROMISE REJECT: ' + (e.reason && e.reason.message || e.reason)));

  // --- capability probe -------------------------------------------------
  (async () => {
    log('navigator.xr: ' + (navigator.xr ? 'present' : 'MISSING'));
    if (!navigator.xr) return;
    try {
      const ok = await navigator.xr.isSessionSupported('immersive-ar');
      log('immersive-ar supported: ' + ok);
    } catch (e) { log('isSessionSupported threw: ' + e.message); }
  })();

  // --- A-Frame ar-hit-test events -----------------------------------
  const scene = document.querySelector('a-scene');
  ['ar-hit-test-start', 'ar-hit-test-achieved', 'ar-hit-test-select'].forEach((ev) =>
    scene.addEventListener(ev, () => log('A-Frame event: ' + ev)));

  // --- session inspection on enter ---------------------------------
  scene.addEventListener('enter-vr', () => {
    if (!scene.is('ar-mode')) { log('entered VR (not AR mode)'); return; }
    const session = scene.renderer && scene.renderer.xr && scene.renderer.xr.getSession();
    if (!session) { log('enter-vr but no XRSession on renderer'); return; }

    log('XR session started');
    log('granted features: ' +
      (session.enabledFeatures ? session.enabledFeatures.join(', ') : '(not reported)'));
    log('blend mode: ' + session.environmentBlendMode +
      ' · interaction: ' + session.interactionMode);

    session.addEventListener('end', () => log('XR session ended'));

    // Independent hit-test source, parallel to A-Frame's, to isolate the cause.
    let hitSource = null;
    let frameCount = 0, hitFrames = 0, lastReport = performance.now();

    session.requestReferenceSpace('viewer').then((viewerSpace) => {
      log('got viewer reference space');
      if (!session.requestHitTestSource) {
        log('session.requestHitTestSource MISSING (hit-test not available)');
        return;
      }
      session.requestHitTestSource({ space: viewerSpace }).then((src) => {
        hitSource = src;
        log('hit-test source created OK — now move the phone over a surface');
      }).catch((e) => log('requestHitTestSource failed: ' + e.message));
    }).catch((e) => log('requestReferenceSpace(viewer) failed: ' + e.message));

    function onXRFrame(time, frame) {
      session.requestAnimationFrame(onXRFrame);
      frameCount++;
      if (hitSource) {
        const results = frame.getHitTestResults(hitSource);
        if (results.length) hitFrames++;
      }
      const now = performance.now();
      if (now - lastReport > 2000) {
        log(`2s: ${frameCount} frames, hit-test hit on ${hitFrames} of them` +
          (hitSource ? '' : ' (no source yet)'));
        frameCount = 0; hitFrames = 0; lastReport = now;
      }
    }
    session.requestAnimationFrame(onXRFrame);
  });

  scene.addEventListener('exit-vr', () => log('exit-vr'));

  log('xr-debug ready');
})();
