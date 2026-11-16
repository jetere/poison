/* ---------- procedural level toggle: a small settings window ---------- */
(function () {
  window.procOn = false; window.procLen = 768; window.procLayout = 'auto';
  const tg = document.createElement('button'); tg.className = 'btn'; tg.textContent = 'Procedural: off'; $('b-apply').after(tg);
  const w = document.createElement('div'); w.style.cssText = 'position:fixed;right:16px;top:70px;z-index:40;width:250px;display:none;background:var(--panel);border:1px solid var(--line);padding:10px;font:13px var(--font-body);color:var(--fg);box-shadow:0 8px 30px rgba(0,0,0,.5)';
  w.innerHTML = '<div class="sect-title" style="margin:0 0 8px">Procedural level</div>' +
    '<label style="display:block;margin-bottom:6px">Seed <input id="pg-seed" type="number" style="width:110px"> <button class="chip" id="pg-rnd">Random</button></label>' +
    '<label style="display:block;margin-bottom:6px">Layout <select id="pg-lay"><option value="auto">Auto (by seed)</option><option value="linear">Linear run</option><option value="rise">Rising climb</option><option value="fall">Falling descent</option><option value="zigzag">Zigzag descent</option><option value="zagup">Zigzag ascent</option></select></label>' +
    '<label style="display:block;margin-bottom:8px">Length <select id="pg-len"><option value="320">Short (320)</option><option value="512">Medium (512)</option><option value="768" selected>Long (768)</option><option value="1024">Epic (1024)</option></select></label>' +
    '<button class="btn primary" id="pg-go">Generate &amp; play</button> <button class="btn" id="pg-x">Close</button><p style="color:var(--muted);margin:8px 0 0">Reaching the flag generates the next seed. Turn the toggle off to return to your own level.</p>';
  document.body.appendChild(w);
  const q = s => w.querySelector(s), seedBox = q('#pg-seed');
  const go = () => { window.procLayout = q('#pg-lay').value; window.procLen = +q('#pg-len').value; const sd = Math.max(1, Math.floor(+seedBox.value) || 1); seedBox.value = sd; buildLevel(sd, 'Generated.'); };
  const set = on => { window.procOn = on; tg.textContent = 'Procedural: ' + (on ? 'on' : 'off'); tg.classList.toggle('primary', on); w.style.display = on ? 'block' : 'none'; if (on) { seedBox.value = V.seed || 1; go(); } else buildLevel(V.seed, 'Custom level.'); };
  window.poisonSetProcedural = set;
  tg.onclick = () => { set(!window.procOn); tg.blur(); };
  q('#pg-go').onclick = go; q('#pg-x').onclick = () => { w.style.display = 'none'; };
  q('#pg-rnd').onclick = () => { seedBox.value = 1 + Math.floor(Math.random() * 999998); go(); };
})();
buildLevel(V.seed);
if (window.__DBG) window.__DBG({ pl, cam, P, V, stats, fx, world, get phase() { return phase; }, get levers() { return levers; }, get keys() { return keys; }, get gates() { return gates; }, get portals() { return portals; }, buildLevel, music: SFX.music, get lvl() { return lvl; }, get movers() { return movers; }, get grid() { return grid; }, get gems() { return gemList; } });

