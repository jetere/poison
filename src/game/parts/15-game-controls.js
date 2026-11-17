/* ---------- panel UI ---------- */
const ctrl = {};
const decimals = s => { const t = String(s).split('.')[1]; return t ? t.length : 0; };
function fmt(it, v) { return v.toFixed(decimals(it.step)) + (it.unit ? ' ' + it.unit : ''); }
function refreshRow(k) {
  const c = ctrl[k]; c.input.value = P[k]; c.out.textContent = fmt(c.it, P[k]);
  c.row.classList.toggle('changed', P[k] !== DEF[k]);
}
GROUPS.forEach((g, gi) => {
  const d = document.createElement('details'); d.open = gi < 3;
  const s = document.createElement('summary'); s.textContent = g.title; d.appendChild(s);
  const rows = document.createElement('div'); rows.className = 'rows';
  g.items.forEach(it => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<label for="p_' + it.k + '">' + it.label + '</label><output for="p_' + it.k + '"></output>' +
      '<input type="range" id="p_' + it.k + '" min="' + it.min + '" max="' + it.max + '" step="' + it.step + '">';
    const input = row.querySelector('input'), out = row.querySelector('output'), label = row.querySelector('label');
    ctrl[it.k] = { it, row, input, out };
    input.addEventListener('input', () => { P[it.k] = parseFloat(input.value); refreshRow(it.k); save(); });
    input.addEventListener('pointerup', () => input.blur());
    label.addEventListener('dblclick', () => { P[it.k] = DEF[it.k]; refreshRow(it.k); save(); });
    rows.appendChild(row);
  });
  d.appendChild(rows); $('groups').appendChild(d);
});
Object.keys(ctrl).forEach(refreshRow);
function setAll(diff) { for (const k in DEF) P[k] = (diff && k in diff) ? diff[k] : DEF[k]; Object.keys(ctrl).forEach(refreshRow); save(); }

const PRESETS = [
  ['Default', {}],
  ['Floaty', { gravity: 600, maxFall: 120, jumpSpeed: 110, varJumpTime: 0.28, halfGravThreshold: 70, airMult: 0.95 }],
  ['Snappy', { runAccel: 2400, runReduce: 1000, gravity: 1400, jumpSpeed: 130, maxFall: 220, fastMaxFall: 320, varJumpTime: 0.16, airMult: 0.9 }],
  ['Icy', { runAccel: 220, runReduce: 120, airMult: 1 }],
  ['Triple dash', { maxDashes: 3, dashCooldown: 0.1 }],
  ['Endless climb', { maxStamina: 400, climbUpCost: 20, climbStillCost: 0 }]
];
PRESETS.forEach(p => {
  const b = document.createElement('button'); b.className = 'chip'; b.textContent = p[0];
  b.addEventListener('click', () => { setAll(p[1]); spawn(); b.blur(); });
  $('presets').appendChild(b);
});

$('v_shape').value = V.shape; $('v_trail').checked = V.trail; $('v_shake').checked = V.shake; $('v_hit').checked = V.hit; $('v_cam').checked = V.cam; $('v_sound').checked = V.sound; $('v_music').checked = V.music;
const mvIn = $('v_mvol'), mvOut = $('o_mvol');
$('v_mfile').addEventListener('change', e => { const fl = e.target.files[0]; if (fl) { SFX.music.load(URL.createObjectURL(fl), fl.name); } });
$('v_murl').addEventListener('change', e => { const u = e.target.value.trim(); if (u) { SFX.music.load(u, u.split('/').pop() || 'track'); } });
mvIn.value = V.musicVol; mvOut.textContent = Math.round(V.musicVol * 100) + '%';
mvIn.addEventListener('input', () => { V.musicVol = parseFloat(mvIn.value); mvOut.textContent = Math.round(V.musicVol * 100) + '%'; SFX.music.setVol(); save(); });
mvIn.addEventListener('pointerup', () => { SFX.resume(); mvIn.blur(); });
const vIn = $('v_vol'), vOut = $('o_vol');
vIn.value = V.volume; vOut.textContent = Math.round(V.volume * 100) + '%';
vIn.addEventListener('input', () => { V.volume = parseFloat(vIn.value); vOut.textContent = Math.round(V.volume * 100) + '%'; SFX.setVol(); save(); });
vIn.addEventListener('pointerup', () => { SFX.resume(); SFX.play('refill'); vIn.blur(); });
const bIn = $('v_bloom'), bOut = $('o_bloom');
bIn.value = V.bloom; bOut.textContent = V.bloom.toFixed(2);
bIn.addEventListener('input', () => { V.bloom = parseFloat(bIn.value); bOut.textContent = V.bloom.toFixed(2); save(); });
bIn.addEventListener('pointerup', () => bIn.blur());

cv.addEventListener('wheel', e => {
  e.preventDefault();
  P.camDist = Math.max(90, Math.min(360, Math.round((P.camDist + e.deltaY * 0.15) / 5) * 5));
  refreshRow('camDist'); save();
}, { passive: false });
const themeSel = $('themeSel');
function syncThemeSelector(){
  themeSel.querySelectorAll('[data-custom-theme]').forEach(n=>n.remove());
  if(CUSTOM_THEMES.size){const group=document.createElement('optgroup');group.label='Custom palettes';group.dataset.customTheme='1';
    for(const [id,t] of CUSTOM_THEMES){const option=document.createElement('option');option.value=id;option.textContent=t.name;group.append(option);}themeSel.append(group);}
  themeSel.value=String(V.theme);
  if(themeSel.selectedIndex<0)themeSel.value='auto';
}
syncThemeSelector();
themeSel.addEventListener('change', () => {const k=themeSel.value;V.theme = k==='auto'||k.startsWith('custom:')?k:parseInt(k,10);applyTheme(V.seed);save();themeSel.blur();});
function applyTheme(seed){
  let picked=V.theme === 'auto' ? seed % BASE_THEME_COUNT : V.theme;
  if(typeof picked==='string' && !CUSTOM_THEMES.has(picked)){picked=0;V.theme=0;}
  setTheme(picked);SFX.music.setMood(themeIdx);syncThemeSelector();
}
const seedIn = { value: 1 };
const FEATNAME = { turret: 'turrets', lever: 'lever gate', key: 'key gate', phase: 'blinking platforms', order: 'numbered levers', portal: 'portals', laser: 'lasers', saws: 'saw blades', fan: 'updraft shafts', mover: 'moving platforms', lift: 'lifts', brk: 'breakable walls', belt: 'conveyors', wind: 'wind', moon: 'low gravity', crush: 'crushers', bounce: 'springs', float: 'crumbling platforms', spikes: 'spike runs', stairs: 'crumble stairs', hop: 'spring hops' };
function buildLevel(seed, msg) {
  seed = Math.max(1, Math.min(999999, Math.floor(Number(seed)) || 1));
  V.seed = seed; seedIn.value = seed;
  applyTheme(seed);
  const L = window.procOn ? generateWorld(seed, window.procLen, window.procLayout) : customBuild(); if (window.procOn) L.name = LAYOUTS[L.layout]; COLS = L.cols; ROWS = L.rows; W = COLS * T; H = ROWS * T;
  if(window.procOn)window.poisonProcedural?.capture(L);
  grid = L.grid; lvl = L;
  phase = 0; gateOf = new Map();
  gates = L.gates.map((g, i) => ({ ...g, open: false, next: 1 })); gates.forEach((g, i) => g.tiles.forEach(([tx, ty]) => gateOf.set(ty * COLS + tx, g.ci)));
  levers = L.levers.map(l => ({ ...l, on: false, cd: 0 })); keys = L.keys.map(k => ({ ...k, got: false })); portals = L.portals.map(p => ({ ...p }));
  crystals.length = 0;
  turrets = L.turrets.map(t => ({ ...t })); shots = []; seen = new Uint8Array(COLS * ROWS);
  drips = L.drips.map(d => ({ x: d.x, y0: d.y0, ground: d.ground, y: d.y0, st: 0, t: 0, vy: 0 }));
  movers = L.movers.map(m => ({ axis: m.axis, c: m.c, range: m.range, spd: m.spd, ph: m.ph, w: m.w, x: m.axis === 'x' ? Math.round(m.c + Math.sin(m.ph) * m.range) : m.x, y: m.axis === 'x' ? m.y : Math.round(m.c + Math.sin(m.ph) * m.range) }));
  gemList = L.gems.map(q => ({ x: q.x, y: q.y, got: false }));
  stats.time = 0; stats.deaths = 0; stats.gems = 0; stats.total = gemList.length;
  springs = L.springs.map(sp => ({ tx: sp.tx, ty: sp.ty, comp: 0 }));
  crumbs = L.crumbles.map(c => ({ tx: c.tx, ty: c.ty, st: 0, t: 0, fall: 0 }));
  cp = L.cps[0]; particles = []; ghosts = []; buildProps(seed);
  spawn(); customRuntime.load(L); updateCam(0, true); SFX.music.setSeed(seed); save();
  $('lvl-info').textContent = (msg ? msg + ' ' : '') + (L.name || 'Custom level') + ', ' + COLS + ' tiles, ' + activeThemeName + '.';
}
const fmtT = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !(e.target && e.target.tagName === 'INPUT')) V.map = !V.map; });
function nextLevel() { SFX.play('goal'); if (window.edNext) window.edNext(); buildLevel(V.seed % 999999 + 1, 'Cleared in ' + fmtT(stats.time) + ' with ' + stats.deaths + ' deaths and ' + stats.gems + ' of ' + stats.total + ' gems.'); }
$('b-apply').addEventListener('click', e => { buildLevel(seedIn.value); e.target.blur(); });
$('v_shape').addEventListener('change', e => { V.shape = e.target.value; save(); e.target.blur(); });
[['v_music', 'music'], ['v_sound', 'sound'], ['v_cam', 'cam'], ['v_trail', 'trail'], ['v_shake', 'shake'], ['v_hit', 'hit']].forEach(a => $(a[0]).addEventListener('change', e => { V[a[1]] = e.target.checked; save(); e.target.blur(); SFX.setVol(); SFX.music.setVol(); if (a[1] === 'music' && V.music) SFX.resume(); if (a[1] === 'sound' && V.sound) { SFX.resume(); SFX.play('crystal'); } }));

$('b-respawn').addEventListener('click', e => { spawn(); e.target.blur(); });
$('b-reset').addEventListener('click', e => { setAll(null); spawn(); e.target.blur(); });
const rtStateEl = $('rt-state');
function setRuntimeBadge(mode,msg){ if(!rtStateEl) return; rtStateEl.textContent = mode === 'running' ? 'Running' : (mode === 'paused' ? 'Paused' : 'Stopped'); rtStateEl.className = 'state ' + mode; rtStateEl.title = msg || ''; }

$('b-copy').addEventListener('click', e => {
  const txt = JSON.stringify(P, null, 2), ta = $('exp'); e.target.blur();
  const fallback = () => { ta.value = txt; ta.hidden = false; ta.focus(); ta.select(); };
  try { navigator.clipboard.writeText(txt).then(() => { e.target.textContent = 'Copied'; setTimeout(() => { e.target.textContent = 'Copy values'; }, 1400); }, fallback); }
  catch (x) { fallback(); }
});

function tab(which) {
  const tune = which === 'tune';
  $('tab-tune').setAttribute('aria-selected', tune); $('tab-mech').setAttribute('aria-selected', !tune);
  $('pane-tune').hidden = !tune; $('pane-mech').hidden = tune;
}
$('tab-tune').addEventListener('click', () => tab('tune'));
$('tab-mech').addEventListener('click', () => tab('mech'));

