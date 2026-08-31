// AgriAR — application entry point.
// Step 1: just confirm the scene is alive. Real logic arrives in later steps.

const scene = document.querySelector('#scene');
const statusEl = document.querySelector('#status');

scene.addEventListener('loaded', () => {
  console.log('[AgriAR] A-Frame scene loaded');
  statusEl.textContent = 'Scene ready ✓';
});
