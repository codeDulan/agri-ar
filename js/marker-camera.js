// Camera control for the marker page.
//
// AR.js starts its own webcam <video> (often the SELFIE camera on multi-camera
// Android phones). Rather than fight AR.js's init, we let it run, then swap the
// MediaStream on its <video> element:
//   - on load: try to switch to the rear camera automatically
//   - the 🔄 button cycles through all cameras
// AR.js keeps reading frames from the same <video>, so this is transparent to it.

(function () {
  const btn = document.querySelector('#cam-switch');
  let cameras = [];
  let index = 0;

  const isRear = (l) => /back|rear|environment/i.test(l || '');

  function video() {
    return document.querySelector('#arjs-video') || document.querySelector('video');
  }

  function waitForVideo() {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        const v = video();
        if (v && v.srcObject) { clearInterval(t); resolve(v); }
      }, 200);
      setTimeout(() => { clearInterval(t); resolve(video()); }, 8000);
    });
  }

  async function listCameras() {
    const list = (await navigator.mediaDevices.enumerateDevices())
      .filter((d) => d.kind === 'videoinput')
      .map((d) => ({ deviceId: d.deviceId, label: d.label }));
    list.sort((a, b) => (isRear(b.label) ? 1 : 0) - (isRear(a.label) ? 1 : 0));
    return list;
  }

  async function useCamera(constraints, labelHint) {
    const v = video();
    if (!v) return false;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: constraints });
    } catch (e) {
      window.setStatus?.('⚠️ camera switch failed: ' + e.name);
      return false;
    }
    // stop the stream AR.js was using, attach the new one
    try { v.srcObject && v.srcObject.getTracks().forEach((t) => t.stop()); } catch (_) {}
    v.srcObject = stream;
    await v.play().catch(() => {});

    // nudge AR.js to recompute the source size for the new resolution
    const arjs = document.querySelector('a-scene').components.arjs;
    v.addEventListener('loadedmetadata', () => {
      try { arjs && arjs.arSource && arjs.arSource.onResizeElement(); } catch (_) {}
    }, { once: true });

    window.setStatus?.(labelHint || 'Camera switched');
    return true;
  }

  async function init() {
    await waitForVideo();

    try { cameras = await listCameras(); } catch (_) { cameras = []; }
    if (cameras.length <= 1 && btn) btn.hidden = true;

    // auto-select a rear camera if AR.js didn't
    const rear = cameras.find((c) => isRear(c.label));
    if (rear) {
      index = cameras.indexOf(rear);
      await useCamera({ deviceId: { exact: rear.deviceId } }, 'Rear camera — show the marker');
    } else {
      await useCamera({ facingMode: { ideal: 'environment' } }, 'Camera ready — show the marker');
    }
  }

  btn?.addEventListener('click', async () => {
    if (!cameras.length) { try { cameras = await listCameras(); } catch (_) {} }
    if (!cameras.length) return;
    index = (index + 1) % cameras.length;
    const cam = cameras[index];
    await useCamera({ deviceId: { exact: cam.deviceId } },
      isRear(cam.label) ? 'Rear camera' : 'Front camera');
  });

  const scene = document.querySelector('a-scene');
  if (scene.hasLoaded) init();
  else scene.addEventListener('loaded', init);
})();
