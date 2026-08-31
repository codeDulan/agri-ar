// Shared chrome for both AR mode pages: a back button and a status line.
// Each page includes an element with id="status" and id="back".

(function arShell() {
  const back = document.querySelector('#back');
  if (back) back.addEventListener('click', () => { window.location.href = 'index.html'; });

  // Small helper other scripts use: setStatus('placing…')
  window.setStatus = function setStatus(text) {
    const s = document.querySelector('#status');
    if (s) s.textContent = text;
    console.log('[AgriAR]', text);
  };

  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('loaded', () => window.setStatus('Scene ready ✓'));
  }
})();
