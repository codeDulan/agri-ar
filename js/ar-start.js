// Marker page: start AR.js only after an explicit tap, so the camera
// permission prompt is a direct response to a user gesture (Android blocks
// prompts triggered while another app is drawing an overlay, and an
// automatic on-load request is the worst case for that).

(function () {
  const scene   = document.querySelector('a-scene');
  const overlay = document.querySelector('#ar-start');
  const btn     = document.querySelector('#ar-start-btn');

  const ARJS =
    'sourceType: webcam; detectionMode: mono; matrixCodeType: 3x3; ' +
    'debugUIEnabled: false; sourceWidth: 1280; sourceHeight: 960; ' +
    'displayWidth: 1280; displayHeight: 960;';

  function start() {
    btn.disabled = true;
    window.setStatus?.('Starting camera…');
    scene.setAttribute('arjs', ARJS);   // triggers AR.js init + getUserMedia

    // hide the gate once the camera video is actually up
    const check = setInterval(() => {
      const v = document.querySelector('video');
      if (v && v.srcObject) {
        clearInterval(check);
        overlay.hidden = true;
        window.setStatus?.('Point at the Hiro marker');
      }
    }, 200);

    setTimeout(() => {
      clearInterval(check);
      if (!overlay.hidden) {
        overlay.hidden = true;   // don't trap the user on the gate
        window.setStatus?.('If the camera is black, check permissions and reload');
      }
    }, 8000);
  }

  btn.addEventListener('click', start, { once: true });
})();
