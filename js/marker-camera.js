// AR.js picks the first enumerated camera, which on many Android phones
// (e.g. Pixel) is the SELFIE camera. This resolves the rear camera first
// and hands its deviceId to AR.js before the arjs component initialises.
//
// marker.html's <a-scene> intentionally has NO `arjs` attribute — we add it
// here once the correct camera is known.

(function () {
  const BASE =
    'sourceType: webcam; detectionMode: mono; matrixCodeType: 3x3; ' +
    'debugUIEnabled: false; sourceWidth: 1280; sourceHeight: 960; ' +
    'displayWidth: 1280; displayHeight: 960;';

  const scene = document.querySelector('a-scene');

  async function pickRearCamera() {
    let deviceId = null;

    // 1. Ask for the environment-facing camera; this also unlocks device labels.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      const track = stream.getVideoTracks()[0];
      deviceId = track.getSettings().deviceId || null;
      stream.getTracks().forEach((t) => t.stop());
      window.setStatus?.('Camera ready — show the marker');
    } catch (err) {
      window.setStatus?.('⚠️ Camera blocked: ' + err.name);
      const hint = document.querySelector('#scan-hint');
      if (hint) hint.textContent =
        'Camera permission denied. Enable it in the address bar and reload.';
      return null;
    }

    // 2. If several cameras exist, prefer one whose label looks rear-facing.
    try {
      const cams = (await navigator.mediaDevices.enumerateDevices())
        .filter((d) => d.kind === 'videoinput');
      const rear = cams.find((d) => /back|rear|environment/i.test(d.label));
      if (rear) deviceId = rear.deviceId;
    } catch (_) { /* keep the facingMode result */ }

    return deviceId;
  }

  async function start() {
    const deviceId = await pickRearCamera();
    const arjs = BASE + (deviceId ? ' deviceId: ' + deviceId + ';' : '');
    scene.setAttribute('arjs', arjs);
  }

  if (scene.hasLoaded) start();
  else scene.addEventListener('loaded', start);
})();
