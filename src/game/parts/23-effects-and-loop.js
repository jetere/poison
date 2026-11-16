/* ---------- extra VFX ---------- */
const FXC = ['#82f5d6', '#ff9bf0', '#ffd86b', '#6fc8ff'], fxs = { t: 0, dashes: 0, dead: false, gems: 0, cpx: -1 };
function spark(x, y, vx, vy, life, c, nd) { if (particles.length < 2600) particles.push({ x, y, vx, vy, life, max: life, c, nd }); }
function ring(x, y, c, spd, n) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; spark(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 0.5, c); } }
function fxTick(dt) {
  if (!lvl.goal || pl.dead && fxs.dead) { fxs.dead = pl.dead; return; }
  fxs.t += dt; const cx = pl.x + 4, cy = pl.y + 4, g = lvl.goal;
  if (fxs.t > 0.04) {
    fxs.t = 0;
    const a = Math.random() * 6.2832, r = 5 + Math.random() * 3;
    if (Math.hypot(pl.vx, pl.vy) > 120 && !pl.dead) spark(cx, cy + 3, -pl.vx * 0.08, -8, 0.35, bodyColor());
  }
  if (pl.dashes < fxs.dashes) ring(cx, cy, FXC[3], 70, 18);
  if (!pl.dead && fxs.dead === false && stats.gems > fxs.gems) { ring(cx, cy, FXC[2], 60, 14); for (let i = 0; i < 8; i++) spark(cx, cy, (Math.random() - 0.5) * 40, -30 - Math.random() * 40, 0.8, FXC[2]); }
  if (pl.dead && !fxs.dead) { ring(cx, cy, FXC[1], 110, 28); ring(cx, cy, FXC[2], 55, 16); }
  if (cp.x !== fxs.cpx) { if (fxs.cpx >= 0) { ring(cp.x + 4, cp.y + 4, FXC[0], 50, 16); for (let i = 0; i < 12; i++) spark(cp.x + 4, cp.y + 8, (Math.random() - 0.5) * 20, -40 - Math.random() * 40, 1, FXC[0]); } fxs.cpx = cp.x; }
  fxs.dashes = pl.dashes; fxs.dead = pl.dead; fxs.gems = stats.gems;
}
let last = performance.now(), acc = 0;
const runtime = { mode: 'running', reason: 'Running', raf: 0, autoPaused: false };
function drawRuntimeOverlay(){
  ctx.save();
  ctx.fillStyle='rgba(6,8,14,.62)'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.textAlign='center';
  ctx.fillStyle='#eef3ff'; ctx.font='700 18px Silkscreen';
  ctx.fillText(runtime.mode==='paused'?'PAUSED':'STOPPED', cv.width/2, cv.height/2 - 6);
  ctx.font='12px IBM Plex Sans, sans-serif'; ctx.fillStyle='#c2cee2';
  ctx.fillText(runtime.mode==='paused' ? 'Press Resume to continue.' : 'Game loop stopped to save resources.', cv.width/2, cv.height/2 + 16);
  ctx.restore();
}
function updateRuntimeUI(msg=''){
  runtime.reason = msg || runtime.reason;
  setRuntimeBadge(runtime.mode, runtime.reason);
  const bp=$('b-pause'), br=$('b-resume'), bs=$('b-stop'), bre=$('b-restart');
  if(bp) bp.disabled = runtime.mode!=='running';
  if(br) br.disabled = runtime.mode==='running';
  if(bs) bs.disabled = runtime.mode==='stopped';
  if(bre) bre.disabled = false;
}
function requestFrame(){ if(runtime.mode==='running' && !window.poisonEditorOpen && !runtime.raf) runtime.raf = requestAnimationFrame(frame); }
function setRuntimeMode(mode,msg=''){
  if(mode==='running' && window.poisonEditorOpen) return; // Studio always owns runtime while open.
  if(runtime.raf){ cancelAnimationFrame(runtime.raf); runtime.raf=0; } // No pending game frame.
  runtime.mode=mode; runtime.reason=msg || runtime.reason;
  last=performance.now(); acc=0;
  if(mode==='running'){
    runtime.autoPaused=false;
    customRuntime.activate();
    SFX.resume();
    requestFrame();
  }else{
    releaseAll(); I.jumpPress=false; I.dashPress=false;
    customRuntime.halt(); // Stop script iframe and any per-object audio.
    SFX.suspend(); // Stop music, suspend AudioContext and all SFX.
    if(!window.poisonEditorOpen){render();hud();drawRuntimeOverlay();} // One static frame only.
  }
  updateRuntimeUI(msg);
}
window.poisonRuntime={
  get mode(){return runtime.mode;},
  get frameScheduled(){return !!runtime.raf;},
  pause(msg='Paused'){if(runtime.mode==='running')setRuntimeMode('paused',msg);else updateRuntimeUI(msg);},
  resume(msg='Running'){setRuntimeMode('running',msg);},
  stop(msg='Stopped'){setRuntimeMode('stopped',msg);},
  restart(msg='Level restarted'){if(window.poisonEditorOpen)return;buildLevel(V.seed,msg);setRuntimeMode('running','Running');}
};
$('b-pause').addEventListener('click', e => { window.poisonRuntime.pause('Paused manually'); e.target.blur(); });
$('b-resume').addEventListener('click', e => { window.poisonRuntime.resume('Running'); e.target.blur(); });
$('b-stop').addEventListener('click', e => { window.poisonRuntime.stop('Stopped manually'); e.target.blur(); });
$('b-restart').addEventListener('click', e => { window.poisonRuntime.restart('Restarted current level.'); e.target.blur(); });
document.addEventListener('visibilitychange', () => {
  if(document.hidden && runtime.mode==='running'){ runtime.autoPaused = true; window.poisonRuntime.pause('Auto paused in background'); }
  else if(!document.hidden && runtime.autoPaused && runtime.mode==='paused'){ runtime.autoPaused = false; window.poisonRuntime.resume('Running'); }
});
function frame(now) {
  runtime.raf = 0;
  if (runtime.mode !== 'running' || window.poisonEditorOpen) return; // No idle redraw or updates while editing.
  const raw = Math.min(0.1, (now - last) / 1000); last = now;
  const scaled = raw * P.timeScale;
  acc += scaled;
  while (acc >= DT) { update(DT); acc -= DT; }
  updateFx(scaled); fxTick(raw);
  updateCam(raw, false);
  musicTick(raw);
  render(); hud();
  requestFrame();
}
updateRuntimeUI('Running');
requestFrame();
})();

