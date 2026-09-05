(function () {
  const btn = document.querySelector('#sound');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const on = window.AgriAudio ? window.AgriAudio.toggle() : false;
    btn.textContent = on ? '🔊' : '🔇';
    btn.setAttribute('aria-pressed', String(on));
    if (window.setStatus) window.setStatus(on ? 'Sound on' : 'Sound off');
  });
})();
