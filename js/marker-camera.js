// Camera control for the marker page.
//
// AR.js often opens the selfie camera on multi-camera Android phones and
// ignores a `deviceId` passed once. This module:
//   1. resolves the list of video cameras (rear first)
//   2. starts AR.js on the rear camera
//   3. exposes a switch-camera button that fully re-initialises the AR.js
//      source on the next camera (remove + re-add the `arjs` component)
//
// marker.html's <a-scene> has NO `arjs` attribute at parse time — we add it here.

(function () {
  const BASE =
    'sourceType: webcam; detectionMode: mono; matrixCodeType: 3x3; ' +
    'debugUIEnabled: false; sourceWidth: 1280; sourceHeight: 960; ' +
    'displayWidth: 1280; displayHeight: 960;';

  const scene = document.querySelector('a-scene');
  const btn = document.querySelector('#cam-switch');

  let cameras = [];   // [{ deviceId, label }]
  let index = 0;

  function isRear(label) { return /back|rear|environment/i.test(label || ''); }

  async function enumerate() {
    const list = (await navigator.mediaDevices.enumerateDevices())
      .filter((d) => d.kind === 'videoinput')
      .map((d) => ({ deviceId: d.deviceId, label: d.label }));
    // rear cameras first, then the rest
    list.sort((a, b) => (isRear(b.label) ? 1 : 0) - (isRear(a.label) ? 1 : 0));
    return list;
  }

  function applyCamera(deviceId) {
    const arjs = BASE + (deviceId ? ' deviceId: ' + deviceId + ';' : '');
    // A plain setAttribute update does not restart the AR.js video source,
    // so remove the component, tear down its <video>, and re-add it.
    scene.removeAttribute('arjs');
    document.querySelectorAll('video').forEach((v) => {
      try { v.srcObject && v.srcObject.getTracks().forEach((t) => t.stop()); } catch (_) {}
      v.remove();
    });
    requestAnimationFrame(() => scene.setAttribute('arjs', arjs));
  }

  async function init() {
    // Unlock device labels + get an initial (ideally rear) stream.
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      s.getTracks().forEach((t) => t.stop());
    } catch (err) {
      window.setStatus?.('⚠️ Camera blocked: ' + err.name);
      const hint = document.querySelector('#scan-hint');
      if (hint) hint.textContent =
        'Camera permission denied — enable it in the address bar and reload.';
      if (btn) btn.hidden = true;
      return;
    }

    cameras = await enumerate();
    if (cameras.length <= 1 && btn) btn.hidden = true;

    index = 0;                       // enumerate() put a rear camera first
    applyCamera(cameras[0] ? cameras[0].deviceId : null);
    window.setStatus?.('Camera ready — show the marker');
  }

  btn?.addEventListener('click', async () => {
    if (!cameras.length) cameras = await enumerate();
    if (!cameras.length) return;
    index = (index + 1) % cameras.length;
    const cam = cameras[index];
    window.setStatus?.(isRear(cam.label) ? 'Rear camera' : 'Front camera');
    applyCamera(cam.deviceId);
  });

  if (scene.hasLoaded) init();
  else scene.addEventListener('loaded', init);
})();
