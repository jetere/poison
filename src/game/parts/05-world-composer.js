/* ---------- world composer: picks a layout and builds it from one or more lanes ---------- */
const LAYOUTS = { linear: 'Linear run', rise: 'Rising climb', fall: 'Falling descent', zigzag: 'Zigzag descent', zagup: 'Zigzag ascent' };
const wx = () => null;
/* declutter: anchor hazards to the ground and remove any that overlap another hazard or a gem */
function declutter(M, C, R) {
  const solid = (c, r) => c >= 0 && c < C && r >= 0 && r < R && [1, 4, 5, 6].includes(M.grid[r][c]);
  const snap = (tx, ty) => { let r = ty, k = 0; while (solid(tx, r) && r > 0) r--; while (!solid(tx, r + 1) && r < R - 2 && k++ < 40) r++; return Math.abs(r - ty) <= 3 ? r : ty; };
  M.spikes.forEach(q => { q.ty = snap(q.tx, q.ty); }); M.springs.forEach(q => { q.ty = snap(q.tx, q.ty); });
  M.crushers.forEach(q => { const r = snap((q.x >> 3) + 1, (q.ground >> 3) - 1) + 1; if (Math.abs(r * 8 - q.ground) <= 24) q.ground = r * 8; });
  M.saws = M.saws.filter(q => { const h = q.axis === 'x' ? (q.range || 0) + 9 : q.axis === 'p' ? 38 : 9, y = q.axis === 'p' ? q.py + 40 : (q.cy ?? q.y); return !M.spikes.some(s => s.tx * 8 + 8 > q.cx - h && s.tx * 8 < q.cx + h && Math.abs(s.ty * 8 + 4 - y) < 22); });
  const kept = [], hit = b => kept.some(k => b.x1 > k.x0 && b.x0 < k.x1 && Math.abs(b.y - k.y) < 64);
  const filt = (arr, box) => { for (let i = 0; i < arr.length; i++) { const b = box(arr[i]); if (hit(b)) arr.splice(i--, 1); else kept.push(b); } };
  filt(M.saws, q => ({ x0: q.cx - 32, x1: q.cx + 32, y: q.cy ?? q.y ?? q.py }));
  filt(M.lasers, q => ({ x0: Math.min(q.x1, q.x2) - 6, x1: Math.max(q.x1, q.x2) + 6, y: q.cy }));
  filt(M.crushers, q => ({ x0: q.x - 4, x1: q.x + q.w + 4, y: q.ground }));
  filt(M.turrets, q => ({ x0: q.x - 8, x1: q.x + 16, y: q.y }));
  M.gems = M.gems.filter(q => !solid(q.x >> 3, q.y >> 3) && !kept.some(k => q.x > k.x0 + 10 && q.x < k.x1 - 10 && Math.abs(q.y - k.y) < 22));
}
function generateWorld(seed, total, layout) {
  const rr = mulberry32((seed * 40503 + 7) >>> 0), keys = Object.keys(LAYOUTS).filter(key=>key!=='custom');
  let m = keys.includes(layout) ? layout : keys[Math.floor(rr() * keys.length)];
  if ((m === 'zigzag' || m === 'zagup') && total < 320) m = 'linear';
  const up = m === 'zagup';
  if (m !== 'zigzag' && !up) {
    const R = 96, pr = { linear: [R * .55, R * .55, 8, 1], rise: [R - 16, 16, 6, 2], fall: [16, R - 16, 6, 2] }[m];
    const L = generateLevel(seed, total, R, { d0: 0, d1: 1, y0: pr[0], y1: pr[1], amp: pr[2], k: pr[3] });
    L.cols = total; L.rows = R; L.layout = m; L.weather = wx(seed); declutter(L, total, R); return L;
  }
  const n = total >= 1024 ? 4 : total >= 512 ? 3 : 2, C = Math.round(total / n), LH = 64, R = n * LH, Wl = C * 8;
  const M = { grid: Array.from({ length: R }, () => new Array(C).fill(0)), ceil: new Array(C).fill(0), feats: new Set(), goal: null };
  const LISTS = ['cps', 'gems', 'springs', 'crumbles', 'spikes', 'saws', 'fans', 'movers', 'belts', 'winds', 'moons', 'crushers', 'lasers', 'drips', 'gates', 'levers', 'keys', 'portals', 'phs', 'turrets', 'crystals'];
  LISTS.forEach(k => M[k] = []);
  const lanes = [];
  for (let i = 0; i < n; i++) {
    const L = generateLevel(seed * 31 + i + 1, C, LH, { d0: i / n, d1: (i + 1) / n, y0: LH * (up ? .8 : .22), y1: LH * (up ? .3 : .62), amp: 4, k: 1.5 });
    const flip = i % 2 === 1, dy = (up ? n - 1 - i : i) * LH, dpx = dy * 8, fx = v => Wl - v, ft = t => C - 1 - t;
    const X = (a, ks) => a.forEach(q => ks.forEach(k => { if (q[k] !== undefined) q[k] = fx(q[k]); }));
    const Tl = (a, ks) => a.forEach(q => ks.forEach(k => { if (q[k] !== undefined) q[k] = ft(q[k]); }));
    const Yp = (a, ks) => a.forEach(q => ks.forEach(k => { if (q[k] !== undefined) q[k] += dpx; }));
    const Yt = (a, ks) => a.forEach(q => ks.forEach(k => { if (q[k] !== undefined) q[k] += dy; }));
    const goal = { ...L.goal };
    if (flip) {
      L.grid.forEach(r => r.reverse());
      X(L.cps, ['x']); L.cps.forEach(q => q.x -= 8); X(L.gems, ['x']); X(L.drips, ['x']); Tl(L.springs, ['tx']); Tl(L.crumbles, ['tx']); Tl(L.spikes, ['tx']); Tl(L.phs, ['tx']);
      X(L.saws, ['cx', 'px']); [L.fans, L.winds, L.moons, L.belts].forEach(a => a.forEach(q => { const a0 = fx(q.x1), a1 = fx(q.x0); q.x0 = a0; q.x1 = a1; if (q.dir) q.dir = -q.dir; }));
      L.movers.forEach(q => { if (q.axis === 'x') q.c = fx(q.c); else q.x = Wl - q.x - q.w; }); L.crushers.forEach(q => q.x = Wl - q.x - q.w);
      L.lasers.forEach(q => { q.x1 = fx(q.x1); q.x2 = fx(q.x2); q.cx = fx(q.cx); });
      L.gates.forEach(q => { q.col = ft(q.col); }); X(L.levers, ['x']); X(L.keys, ['x']); X(L.portals, ['x']); X(L.turrets, ['x']); L.turrets.forEach(q => q.dir = -q.dir); goal.x = fx(goal.x);
    }
    L.gates.forEach(q => { if (q.tiles) q.tiles = q.tiles.map(([tx, ty]) => [flip ? ft(tx) : tx, ty + dy]); });
    Yp(L.cps, ['y']); Yp(L.gems, ['y']); Yt(L.springs, ['ty']); Yt(L.crumbles, ['ty']); Yt(L.spikes, ['ty']); Yt(L.phs, ['ty']);
    Yp(L.saws, ['y', 'cy', 'py']); Yp(L.fans, ['y0', 'y1']); Yp(L.winds, ['y0', 'y1']); Yp(L.moons, ['y0', 'y1']); Yp(L.belts, ['y']);
    L.movers.forEach(q => { if (q.axis === 'x') q.y += dpx; else q.c += dpx; }); Yp(L.crushers, ['ground']); Yp(L.lasers, ['y1', 'y2', 'cy']); Yp(L.drips, ['y0', 'ground']);
    Yt(L.gates, ['y0', 'y1']); Yp(L.levers, ['y']); Yp(L.keys, ['y']); Yp(L.portals, ['y']); Yp(L.turrets, ['y']); goal.y += dpx;
    const go = M.gates.length, po = M.portals.reduce((a, p) => Math.max(a, p.pair + 1), 0);
    L.gates.forEach(q => q.ci += go); L.levers.forEach(q => q.gate += go); L.keys.forEach(q => q.gate += go); L.portals.forEach(q => q.pair += po);
    LISTS.forEach(k => M[k].push(...(L[k] || []))); L.feats.forEach(f => M.feats.add(f));
    L.grid.forEach((r, ri2) => { M.grid[dy + ri2] = r; });
    lanes.push({ L, flip, dy, goal });
  }
  declutter(M, C, R);
  /* a descent shaft joins the end of each lane to the start of the next, with gems marking the fall */
  for (let i = 0; i < n - 1; i++) {
    const a = lanes[i], b = lanes[i + 1], c0 = a.flip ? 3 : C - 8, c1 = c0 + 4, r0 = a.dy + a.L.endGy, r1 = b.dy + b.L.startGy;
    if (up) {
      /* ascent: an elevator rides a carved shaft from the end of one lane to the ledge of the next */
      const cl = a.flip ? 2 : C - 7;
      for (let r = r1; r < r0; r++) for (let c = cl; c <= cl + 4; c++) M.grid[r][c] = 0;
      M.movers.push({ axis: 'y', c: (r0 + r1) * 4, x: (cl + 1) * 8, range: (r0 - r1) * 4, spd: 0.8, ph: 1.5, w: 24 });
      b.L.cps[0].x = (a.flip ? 7 : C - 8) * 8; continue;
    }
    for (let r = r0; r < r1; r++) for (let c = c0; c <= c1; c++) M.grid[r][c] = 0;
    for (let k = 1; k <= 3; k++) M.gems.push({ x: (c0 + 2) * 8 + 4, y: (r0 + (r1 - r0) * k / 4) * 8 });
  }
  M.goal = lanes[n - 1].goal; M.weather = wx(seed); M.cols = C; M.rows = R; M.layout = m; M.feats = [...M.feats];
  return M;
}

function solidTile(tx, ty) {
  if (tx < 0 || tx >= COLS || ty < 0) return true;
  if (ty >= ROWS) return false;
  const v = grid[ty][tx];
  return v === 1 || v === 4 || v === 5 || v === 6 || (v === 8 && phase === 0) || (v === 9 && phase === 1);
}
let movers = [], phase = 0, gates = [], levers = [], keys = [], portals = [], gateOf = new Map();
const PHASE_T = 1.5, GATEC = ['crystal', 'spring', 'hazard', 'ready'];
const gcol = i => PAL[GATEC[i % 4]];
function openGate(gt) {
  if (gt.open) return; gt.open = true;
  for (const [tx, ty] of gt.tiles) if (grid[ty][tx] === 6) { grid[ty][tx] = 0; emit(tx * T + 4, ty * T + 4, 2, C[GATEC[gt.ci % 4]], 60, 0.6); }
  SFX.play('gate', 1); world.shake = Math.max(world.shake, 3); world.shakeX = 0.5; world.shakeY = 1;
}
let turrets = [], shots = [];
function turretUpdate(dt) {
  for (const t of turrets) {
    if (Math.abs(t.x - pl.x) > 460) continue;
    const p = ((world.time + t.ph) / t.per) % 1, q = t._p === undefined ? p : t._p; t._p = p; t.warn = p > 0.82;
    if (p < q) { shots.push({ x: t.x + t.dir * 3, y: t.y, vx: t.dir * t.sp, life: 6 }); SFX.play('shoot', prox(t.x, t.y, 220)); }
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const sh = shots[i]; sh.x += sh.vx * dt; sh.life -= dt;
    const dead = sh.life <= 0 || solidAt(Math.floor(sh.x / T), Math.floor(sh.y / T));
    if (!pl.dead && !dead && Math.abs(sh.x - pl.x - 4) < 5 && Math.abs(sh.y - pl.y - 4) < 5.5) { die(); shots.splice(i, 1); continue; }
    if (dead) { emit(sh.x, sh.y, 4, C.hazard, 40, 0.25); SFX.play('thud', prox(sh.x, sh.y, 120) * 0.5); shots.splice(i, 1); }
    else if (Math.random() < 0.3) emit(sh.x, sh.y, 1, C.hazard, 10, 0.2);
  }
}
function puzzleUpdate(dt) {
  fx.portalT = (fx.portalT || 0) - dt;
  // blinking platforms
  const np = Math.floor(world.time / PHASE_T) % 2, left = PHASE_T - (world.time % PHASE_T);
  if (np !== phase) {
    phase = np;
    if (hits(pl.x, pl.y)) { let ok = false; for (let up = 1; up <= 12 && !ok; up++) if (!hits(pl.x, pl.y - up)) { pl.y -= up; pl.vy = Math.min(pl.vy, 0); ok = true; } if (!ok) die(); }
    if (lvl.phs.length && Math.abs(lvl.phs[0].tx * 8 - pl.x) < 400) SFX.play('phaseTick', 0.7);
  } else if (left < 0.4 && Math.floor(left * 10) !== fx.pw) { fx.pw = Math.floor(left * 10); if (lvl.phs.length) SFX.play('phaseTick', 0.25); }
  // levers
  for (const lv of levers) {
    lv.cd = (lv.cd || 0) - dt; const gt = gates[lv.gate];
    if (lv.on || lv.cd > 0 || gt.open) continue;
    if (!(pl.x + PW > lv.x - 5 && pl.x < lv.x + 5 && pl.y + PH > lv.y - 10 && pl.y < lv.y)) continue;
    if (!lv.ord) { lv.on = true; SFX.play('lever', 1); openGate(gt); }
    else if (lv.ord === gt.next) { lv.on = true; gt.next++; SFX.play('lever', 1); if (gt.next > gt.need) openGate(gt); }
    else { lv.cd = 0.8; SFX.play('wrong', 1); world.shake = Math.max(world.shake, 1.5); world.shakeX = world.shakeY = 1; }
  }
  for (const k of keys) {
    if (k.got) continue;
    if (pl.x + PW > k.x - 6 && pl.x < k.x + 6 && pl.y + PH > k.y - 6 && pl.y < k.y + 10) { k.got = true; SFX.play('key', 1); emit(k.x, k.y, 8, C[GATEC[gates[k.gate].ci % 4]], 80, 0.6); openGate(gates[k.gate]); }
  }
  for (const p of portals) {
    if (fx.portalT > 0) break;
    if (Math.hypot(p.x - pl.x - 4, p.y - pl.y - 4) < 8) {
      const q = portals.find(o => o.pair === p.pair && o !== p); if (!q) continue;
      emit(p.x, p.y, 10, C[GATEC[p.pair % 4]], 90, 0.5); pl.x = q.x - 4; pl.y = q.y - 4; emit(q.x, q.y, 10, C[GATEC[p.pair % 4]], 90, 0.5);
      fx.portalT = 0.8; SFX.play('portal', 1); world.shake = Math.max(world.shake, 2); wobble(1.3, 0.8); break;
    }
  }
}
function crushLift(c) { const p = ((world.time + c.ph) / c.per) % 1; return p < 0.55 ? 44 : p < 0.6 ? 44 * (1 - (p - 0.55) / 0.05) : p < 0.72 ? 0 : 44 * ((p - 0.72) / 0.28); }
function crushWarn(c) { const p = ((world.time + c.ph) / c.per) % 1; return p > 0.45 && p < 0.6; }
function segDist(px, py, l) { const dx = l.x2 - l.x1, dy = l.y2 - l.y1, L2 = dx * dx + dy * dy || 1; let t = ((px - l.x1) * dx + (py - l.y1) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (l.x1 + dx * t), py - (l.y1 + dy * t)); }
function laserPh(l) { return ((world.time + l.ph) / l.per) % 1; }
let drips = [];
function sawPos(sw) {
  if (sw.axis === 'p') { const a = sw.amp * Math.sin(world.time * sw.spd + sw.ph); return [sw.px + sw.r * Math.sin(a), sw.py + sw.r * Math.cos(a)]; }
  const p = Math.sin(world.time * sw.spd + sw.ph); return sw.axis === 'y' ? [sw.cx, sw.cy + p * sw.range] : [sw.cx + p * sw.range, sw.y];
}
function onMover(x, y) {
  for (const m of movers) {
    if (x + PW > m.x && x < m.x + m.w && y + PH > m.y && y + PH <= m.y + 3 && pl.y + PH <= m.y + 0.5) return true;
  }
  return false;
}
function hits(x, y) {
  if (onMover(x, y)||customRuntime.blocked(x,y)) return true;
  const x0 = Math.floor(x / T), x1 = Math.floor((x + PW - 1) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + PH - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidTile(tx, ty)) return true;
  return false;
}

