/* ---------- input ---------- */
const I = { left: 0, right: 0, up: 0, down: 0, jump: 0, dash: 0, grab: 0, jumpPress: false, dashPress: false };
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyC: 'jump', KeyK: 'jump', KeyX: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyJ: 'dash',
  KeyZ: 'grab', KeyV: 'grab', KeyL: 'grab'
};
const held = new Map(), cnt = {};
function press(code, a) {
  if (held.has(code)) return;
  held.set(code, a); cnt[a] = (cnt[a] || 0) + 1; I[a] = 1;
  if (cnt[a] === 1) { if (a === 'jump') I.jumpPress = true; if (a === 'dash') I.dashPress = true; }
}
function release(code) {
  const a = held.get(code); if (!a) return;
  held.delete(code); cnt[a] = Math.max(0, cnt[a] - 1);
  if (cnt[a] === 0) I[a] = 0;
}
function releaseAll() { Array.from(held.keys()).forEach(release); }
function typing(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA'); }
window.addEventListener('keydown', e => {
  if (window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode !== 'running')) return;
  if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'KeyR') { if (!e.repeat) spawn(); return; }
  const a = KEYMAP[e.code]; if (!a) return;
  e.preventDefault();
  if (!e.repeat) press(e.code, a);
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) release(e.code); });
window.addEventListener('blur', releaseAll);
cv.addEventListener('pointerdown', () => cv.focus());
document.querySelectorAll('.touch button').forEach(b => {
  const code = 'touch-' + b.dataset.act;
  b.addEventListener('pointerdown', e => { e.preventDefault(); if (window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode !== 'running')) return; try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('down'); press(code, b.dataset.act); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { b.classList.remove('down'); release(code); }));
  b.addEventListener('contextmenu', e => e.preventDefault());
});

