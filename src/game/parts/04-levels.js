/* ---------- level ---------- */
let grid = [];
let lvl = { cps: [], crystals: [], spikes: [], springs: [], crumbles: [], goal: null, saws: [], fans: [], movers: [], belts: [], winds: [], moons: [], crushers: [], lasers: [], drips: [], ceil: [], gates: [], levers: [], keys: [], portals: [], phs: [], turrets: [], feats: [] };
let springs = [], crumbs = [], gemList = [];
const stats = { time: 0, deaths: 0, gems: 0, total: 0 };
let cp = { x: 16, y: 0 };
const crystals = [];
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
/*GEN_START*/
function generateLevel(seed, COLS, ROWS, o) {
  o = o || { d0: 0, d1: 1, y0: ROWS * 0.6, y1: ROWS * 0.6, amp: (ROWS - 34) / 2, k: 1 };
  const rnd = mulberry32((seed * 2654435761) >>> 0);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const top = new Array(COLS).fill(ROWS - 2);
  const platforms = [], spikes = [], cry = [], cps = [], springs = [], gems = [], saws = [], fans = [], movers = [], brks = [], belts = [], winds = [], moons = [], crushers = [], lasers = [], gates = [], levers = [], keys = [], portals = [], phs = [], walls = [], reqs = [], turrets = [], bgT = [];
  let gy = Math.round(o.y0), x = 1, nextRest = 56, actEnd = 0, motif = [], seq = 0, last = '', lastCp = -99;
  const FEATS = ['saws', 'fan', 'mover', 'lift', 'brk', 'belt', 'wind', 'moon', 'crush', 'laser', 'turret', 'lever', 'key', 'phase', 'order', 'portal', 'bounce', 'float', 'spikes', 'stairs', 'hop'];
  const pool = FEATS.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const on = new Set(pool.slice(0, ri(6, 8)));
  const waves = ri(2, 4), wph = rnd() * 6.28, mid = ROWS / 2, amp = (ROWS - 34) / 2;
  const tgtAt = px => o.y0 + (o.y1 - o.y0) * px / COLS + o.amp * Math.sin(6.2832 * waves * px / COLS + wph);
  /* difficulty: global ramp for this lane, with a sawtooth so every 96-tile act eases in, builds, then rests */
  const dd = () => Math.min(1, (o.d0 + (o.d1 - o.d0) * x / COLS) * (0.7 + 0.3 * ((x % 96) / 96)));
  const ground = (x0, x1, row) => { for (let i = x0; i <= x1; i++) top[i] = row; };
  const addCp = (cx, row) => { if (cx - lastCp < 90) return; cps.push({ x: cx * 8, y: row * 8 - 8 }); lastCp = cx; };
  const gem = (tx, row) => gems.push({ x: tx * 8 + 4, y: row * 8 + 4 });
  const fits = n => x + n < COLS - 9;
  const pit = (x0, x1) => {
    const bed = Math.min(gy + 4, ROWS - 2);
    for (let i = x0; i <= x1; i++) { top[i] = bed; spikes.push({ tx: i, ty: bed - 1 }); }
  };
  ground(1, 7, gy); addCp(2, gy); x = 8;
  const HARD = { big: 1, turret: 1, lever: 1, key: 1, phase: 1, order: 1, portal: 1, laser: 1, wind: 1, moon: 1, crush: 1, brk: 1, belt: 1, fan: 1, mover: 1, lift: 1, saws: 1, stairs: 1, hop: 1 };
  const weights = d => {
    const nd = (gy - tgtAt(x)) / 6, upK = 1 + Math.max(0, nd) * 1.2 * o.k, dnK = 1 + Math.max(0, -nd) * 2 * o.k;
    const base = [['flat', 2 - 1.2 * d], ['gap', 2], ['big', 0.5 + 1.5 * d], ['float', 0.8 + 1.2 * d], ['up', 1 * upK], ['drop', 1 * dnK], ['ramp', 1.8], ['dropbig', 0.4 * dnK * dnK],
      ['spikes', 1.2 + 0.6 * d], ['bounce', (0.8 + 1.2 * d) * upK], ['fan', d < 0.1 ? 0 : 1.2 * upK], ['mover', d < 0.1 ? 0 : 1.6], ['brk', d < 0.06 ? 0 : 1.5], ['belt', d < 0.05 ? 0 : 1.4],
      ['lift', d < 0.15 ? 0 : 1.2 * upK], ['saws', d < 0.06 ? 0 : 1.8 + 0.8 * d], ['wind', d < 0.1 ? 0 : 1.5], ['moon', d < 0.12 ? 0 : 1.3], ['crush', d < 0.15 ? 0 : 1.5], ['laser', d < 0.12 ? 0 : 1.5], ['turret', d < 0.1 ? 0 : 1.4], ['lever', d < 0.04 ? 0 : 1.3], ['key', d < 0.06 ? 0 : 1.3], ['phase', d < 0.1 ? 0 : 1.4], ['order', d < 0.15 ? 0 : 1.2], ['portal', d < 0.08 ? 0 : 1.3],
      ['stairs', d < 0.2 ? 0 : 1.2 * upK], ['hop', d < 0.35 ? 0 : 1.1]];
    return base.map(k => !FEATS.includes(k[0]) ? k : on.has(k[0]) ? [k[0], k[1] * 2] : [k[0], 0]);
  };
  const pick = () => {
    /* each ~85-tile act gets a motif of two mechanics, woven between terrain fillers: teach, vary, rest */
    const w = weights(dd()), FILL = ['flat', 'gap', 'up', 'drop', 'ramp', 'float', 'spikes', 'bounce', 'big', 'dropbig'];
    if (x >= actEnd) { actEnd = x + ri(70, 100); motif = []; seq = 0; const fe = w.filter(k => FEATS.includes(k[0]) && !FILL.includes(k[0]) && k[1] > 0); for (let a = 0; a < 12 && motif.length < 2 && fe.length; a++) { const m = fe[Math.floor(rnd() * fe.length)][0]; if (!motif.includes(m)) motif.push(m); } }
    seq++;
    if (seq % 2 === 0 && motif.length) { const m = motif[(seq >> 1) % motif.length]; if (m !== last) return m; }
    const c = w.filter(k => FILL.includes(k[0]) && k[0] !== last && k[1] > 0);
    let t = c.reduce((s, k) => s + k[1], 0) * rnd();
    for (const k of c) { t -= k[1]; if (t <= 0) return k[0]; }
    return 'flat';
  };
  let guard = 0;
  while (x < COLS - 14 && guard++ < 2000) {
    if (x >= nextRest && fits(14)) { const w = ri(8, 10); ground(x, x + w - 1, gy); addCp(x + 2, gy); for (let i = 0; i < 3; i++) gem(x + 3 + i * 2, gy - 2); x += w; nextRest = x + Math.round(70 - 25 * dd()); last = 'rest'; continue; }
    const k = pick(), d = dd();
    if (k === 'flat') {
      const w = ri(4, 8 - Math.floor(d * 3)); if (!fits(w)) continue;
      ground(x, x + w - 1, gy); if (w >= 6) addCp(x + 1, gy); x += w;
    } else if (k === 'gap') {
      const w = ri(3, 4 + (d > 0.5 ? 1 : 0)); if (!fits(w + 4)) continue;
      pit(x, x + w - 1); x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'big') {
      const w = ri(6, 7); if (!fits(w + 4)) continue;
      pit(x, x + w - 1);
            if (rnd() < 0.5) gem(x + (w >> 1), gy - 6);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'float') {
      const n = ri(1, 2), gaps = [];
      for (let i = 0; i <= n; i++) gaps.push(ri(4, 5));
      const total = gaps.reduce((a, b) => a + b, 0) + 3 * n + 4;
      if (!fits(total)) continue;
      const pr = gy - ri(0, 1);
      if (rnd() < 0.45) gem(x + gaps[0] + 1, pr - 3);
      let cx = x;
      for (let i = 0; i < n; i++) {
        pit(cx, cx + gaps[i] - 1); cx += gaps[i];
        pit(cx, cx + 2); platforms.push({ x0: cx, x1: cx + 2, row: pr, crumble: rnd() < 0.15 + 0.6 * d }); cx += 3;
      }
      pit(cx, cx + gaps[n] - 1); cx += gaps[n];
      ground(cx, cx + 3, gy); x = cx + 4;
    } else if (k === 'bounce') {
      if (gy - 4 < 7 || !fits(14)) continue;
      ground(x, x + 3, gy); springs.push({ tx: x + 2, ty: gy - 1 });
      pit(x + 4, x + 5);
      gy -= 4; ground(x + 6, x + 11, gy); addCp(x + 7, gy); x += 12;
    } else if (k === 'climb') {
      const maxH = Math.min(11, gy - 7); if (maxH < 7 || !fits(10)) continue;
      const h = ri(7, maxH);
      gy -= h; ground(x, x + 5, gy); addCp(x + 1, gy); x += 6;
    } else if (k === 'up') {
      const h = ri(1, 3); if (gy - h < 7 || !fits(5)) continue;
      gy -= h; ground(x, x + 3, gy); x += 4;
    } else if (k === 'drop') {
      const dd = ri(2, 9); if (gy + dd > ROWS - 4 || !fits(6)) continue;
      gy += dd; ground(x, x + 4, gy); addCp(x + 1, gy); x += 5;
    } else if (k === 'spikes') {
      const w = ri(2, 3 + (d > 0.6 ? 1 : 0)); if (!fits(w + 8)) continue;
      ground(x, x + 3, gy); x += 4;
      ground(x, x + w - 1, gy);
      for (let i = 0; i < w; i++) spikes.push({ tx: x + i, ty: gy - 1 });
      if (rnd() < 0.5) gem(x + (w >> 1), gy - 2);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'fan') {
      /* updraft shaft: a very tall wall with a lift column at its foot */
      const h = ri(10, Math.min(15, gy - 8)); if (gy - 8 < 10 || !fits(16)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      fans.push({ x0: x * 8, x1: (x + 3) * 8, y0: (gy - h - 3) * 8, y1: gy * 8 });
      ground(x, x + 2, gy);
      for (let i = 0; i < 3; i++) if (rnd() < 0.5) gem(x + 1, gy - 3 - i * 3);
      x += 3; gy -= h; ground(x, x + 5, gy); addCp(x + 2, gy); x += 6;
    } else if (k === 'mover') {
      const w = 14; if (!fits(w + 10)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      pit(x, x + w - 1);
      movers.push({ axis: 'x', c: (x + (w - 3) / 2) * 8, y: gy * 8, range: (w - 3) * 4, spd: 0.9 + 0.5 * d, ph: 0, w: 24 });
      if (rnd() < 0.7) gem(x + (w >> 1), gy - 4);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'lift') {
      const h = ri(7, Math.min(10, gy - 8)); if (gy - 8 < 7 || !fits(16)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      pit(x, x + 2);
      movers.push({ axis: 'y', c: (gy - h / 2) * 8, x: x * 8, range: h * 4, spd: 0.8 + 0.3 * d, ph: -1.2, w: 24 });
      x += 3; gy -= h; ground(x, x + 5, gy); addCp(x + 2, gy); x += 6;
    } else if (k === 'lever' || k === 'key' || k === 'order') {
      /* only the gate is built here: its trigger is hidden in an underground chamber earlier in the level */
      if (gy < 20 || !fits(32)) continue;
      const w = 22; ground(x, x + w - 1, gy); if (x - lastCp > 8) addCp(x + 1, gy);
      const gi = gates.length, need = k === 'order' ? 3 : 1; gates.push({ col: x + 14, y0: gy - 16, y1: gy - 1, ci: gi, need, next: 1 });
      if (k === 'order') { const o = [1, 2, 3]; for (let i = 2; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } o.forEach(n => reqs.push({ kind: 'order', gate: gi, ord: n, bx: x + 14 })); }
      else reqs.push({ kind: k, gate: gi, bx: x + 14 });
      x += w; ground(x, x + 1, gy); x += 2;
    } else if (k === 'phase') {
      /* platforms that blink in and out on a rhythm: hop across in time */
      if (gy < 12 || !fits(40)) continue;
      ground(x, x + 1, gy); if (x - lastCp > 8) addCp(x, gy); x += 2;
      const w = 22; pit(x, x + w - 1);
      [[2, 8], [7, 9], [12, 8], [17, 9]].forEach(([o, t], i) => { for (let c = 0; c < 3; c++) phs.push({ tx: x + o + c, ty: gy, t }); if (rnd() < 0.6) gem(x + o + 1, gy - 3); });
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'portal') {
      /* an uncrossable wall: the portal that leads through it is hidden in a chamber earlier on */
      if (gy < 22 || !fits(36)) continue;
      const w = 24, pr = portals.length; ground(x, x + w - 1, gy); if (x - lastCp > 8) addCp(x + 1, gy);
      for (let r = gy - 18; r < gy; r++) { walls.push({ tx: x + 12, ty: r, pair: pr }); walls.push({ tx: x + 13, ty: r, pair: pr }); }
      portals.push({ x: (x + 17) * 8 + 4, y: gy * 8 - 14, pair: pr, b: true });
      reqs.push({ kind: 'portal', pair: pr, bx: x + 12 });
      if (rnd() < 0.6) gem(x + 20, gy - 4);
      x += w; ground(x, x + 1, gy); x += 2;
    } else if (k === 'turret') {
      if (gy < 12 || !fits(30)) continue;
      const w = 20; ground(x, x + w - 1, gy); if (x - lastCp > 8) addCp(x + 1, gy);
      const px = x + 16; for (let r = gy - 3; r < gy; r++) walls.push({ tx: px, ty: r, pair: -1 });
      turrets.push({ x: px * 8, y: (gy - 2) * 8 + 4, dir: -1, per: 2.2 - d * 0.5, ph: rnd() * 2, sp: 70 + d * 30 });
      if (rnd() < 0.5) { const qx = x + 8; for (let r = gy - 3; r < gy; r++) walls.push({ tx: qx, ty: r, pair: -1 }); turrets.push({ x: qx * 8 + 8, y: (gy - 2) * 8 + 4, dir: 1, per: 2.4 - d * 0.5, ph: rnd() * 2, sp: 70 + d * 30 }); }
      if (rnd() < 0.5) gem(x + 12, gy - 4);
      x += w; ground(x, x + 1, gy); x += 2;
    } else if (k === 'ramp') {
      const nd = gy - tgtAt(x), up = nd > 4 ? true : nd < -4 ? false : rnd() < 0.5;
      const n = Math.min(ri(6, 14), up ? gy - 10 : ROWS - 9 - gy); if (n < 4 || !fits(n * 3 + 10)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      for (let i = 0; i < n; i++) { gy += up ? -1 : 1; ground(x, x + 2, gy); if (i % 5 === 2 && rnd() < 0.5) gem(x + 1, gy - 3); x += 3; }
      addCp(x - 2, gy);
    } else if (k === 'dropbig') {
      const dd = ri(10, 20); if (gy + dd > ROWS - 9 || !fits(16)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      for (let i = 1; i <= 3; i++) gem(x + 1, gy + Math.round(dd * i / 4) - 1);
      gy += dd; ground(x, x + 7, gy); addCp(x + 2, gy); x += 8;
    } else if (k === 'wind') {
      if (gy < 13 || !fits(24)) continue;
      const tail = rnd() < 0.7, w = tail ? 10 : 6;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      pit(x, x + w - 1); winds.push({ x0: x * 8, x1: (x + w) * 8, y0: (gy - 9) * 8, y1: (gy + 4) * 8, dir: tail ? 1 : -1 });
      if (rnd() < 0.6) gem(x + (w >> 1), gy - 4);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'moon') {
      if (gy < 17 || !fits(24)) continue;
      const w = 10;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      pit(x, x + w - 1); moons.push({ x0: x * 8, x1: (x + w) * 8, y0: (gy - 14) * 8, y1: (gy + 4) * 8 });
      for (let i = 0; i < 3; i++) if (rnd() < 0.6) gem(x + 2 + i * 3, gy - 6 - (i % 2) * 4);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'crush') {
      if (gy < 13 || !fits(24)) continue;
      const w = 15;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      ground(x, x + w - 1, gy);
      for (let i = 0; i < 2; i++) crushers.push({ x: (x + 3 + i * 6) * 8, w: 24, ground: gy * 8, per: 2.6 + rnd() * 0.5 - d * 0.5, ph: rnd() * 2.6 });
      if (rnd() < 0.6) gem(x + (w >> 1), gy - 3);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'laser') {
      if (gy < 14 || !fits(24)) continue;
      const w = 15;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      ground(x, x + w - 1, gy);
      for (let i = 0; i < 2; i++) {
        const bx = (x + 4 + i * 6) * 8 + 4, gr = gy * 8, t = rnd(), sg = rnd() < 0.5 ? -1 : 1;
        const Lz = t < 0.35 ? { x1: bx, y1: gr, x2: bx, y2: gr - 56 } : t < 0.8 ? { x1: bx - sg * 18, y1: gr, x2: bx + sg * 18, y2: gr - 56 } : { x1: bx - 22, y1: gr - 22, x2: bx + 22, y2: gr - 22 };
        Lz.cx = (Lz.x1 + Lz.x2) / 2; Lz.cy = (Lz.y1 + Lz.y2) / 2; Lz.per = 3.4 - d * 0.8; Lz.ph = rnd() * 3.4; lasers.push(Lz);
      }
      if (rnd() < 0.6) gem(x + (w >> 1), gy - 4);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'brk') {
      /* a tall wall of cracked blocks: dash into it to smash through */
      if (gy < 11 || !fits(20)) continue;
      const w = 12; ground(x, x + w - 1, gy); if (x - lastCp > 8) addCp(x + 1, gy);
      const bx = x + 6; for (let r = gy - 8; r < gy; r++) brks.push({ tx: bx, ty: r });
      gem(bx + 2, gy - 2); if (rnd() < 0.6) gem(bx + 3, gy - 2);
      x += w; ground(x, x + 1, gy); x += 2;
    } else if (k === 'belt') {
      const dir = rnd() < 0.55 ? -1 : 1, w = 9 + ri(0, 3); if (!fits(w + 14)) continue;
      ground(x, x + 2, gy); x += 3;
      ground(x, x + w - 1, gy); belts.push({ x0: x * 8, x1: (x + w) * 8, y: gy * 8, dir, sp: 40 + d * 25 });
      x += w;
      if (dir === 1) { pit(x, x + 5); x += 6; ground(x, x + 3, gy); x += 4; }
      else { pit(x, x + 2); x += 3; ground(x, x + 3, gy); x += 4; }
    } else if (k === 'saws') {
      const n = d > 0.5 ? 2 : 1, w = 9 + n * 7; if (!fits(w + 8)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      ground(x, x + w - 1, gy);
      for (let i0 = 0; i0 < n; i0++) { const i = i0 * 1.5, pd = d > 0.3 && rnd() < 0.3, v = !pd && d > 0.2 && rnd() < 0.45; saws.push(pd ? { axis: 'p', cx: (x + 3 + i * 6) * 8 + 4, px: (x + 3 + i * 6) * 8 + 4, py: gy * 8 - 52, r: 40, amp: 1.0, spd: 1.4 + rnd() * 0.8 + d * 0.5, ph: rnd() * 6.28 } : v ? { axis: 'y', cx: (x + 3 + i * 6) * 8 + 4, cy: gy * 8 - 18, range: 12, spd: 1.8 + rnd() * 0.8 + d * 0.6, ph: rnd() * 6.28 } : { axis: 'x', cx: (x + 3 + i * 6) * 8 + 4, y: gy * 8 - 6, range: 16 + ri(0, 8), spd: 1.6 + rnd() * 1.2 + d * 0.8, ph: rnd() * 6.28 }); }
      if (rnd() < 0.6) gem(x + (w >> 1), gy - 5);
      x += w; ground(x, x + 3, gy); x += 4;
    } else if (k === 'stairs') {
      const n = ri(5, 7); if (gy - n < 9 || !fits(n * 5 + 12)) continue;
      ground(x, x + 3, gy); if (x - lastCp > 8) addCp(x + 1, gy); x += 4;
      let row = gy, lastX = x;
      for (let i = 0; i < n; i++) {
        pit(x, x + 1); x += 2; row -= 1;
        pit(x, x + 2); platforms.push({ x0: x, x1: x + 2, row, crumble: true }); lastX = x; x += 3;
      }
      if (rnd() < 0.7) gem(lastX + 1, row - 2);
      pit(x, x + 1); x += 2; gy -= n; ground(x, x + 3, gy); x += 4;
    } else if (k === 'hop') {
      const w = ri(4, 5); if (!fits(w + 12)) continue;
      ground(x, x + 3, gy); springs.push({ tx: x + 2, ty: gy - 1 }); if (x - lastCp > 8) addCp(x, gy); x += 4;
      ground(x, x + w - 1, gy);
      for (let i = 0; i < w; i++) spikes.push({ tx: x + i, ty: gy - 1 });
      if (rnd() < 0.6) gem(x + (w >> 1), gy - 6);
      x += w; ground(x, x + 4, gy); x += 5;
    }
    if (HARD[k] && rnd() < 0.6 && fits(16)) { const w = ri(8, 12); ground(x, x + w - 1, gy); addCp(x + 2, gy); x += w; }
    else if (x - lastCp > 26) addCp(x - 3, gy);
    last = k;
  }
  ground(x, COLS - 2, gy);
  let goal = { x: (COLS - 5) * 8 + 4, y: gy * 8 - 16 };
  /* caves: stretches with a rocky ceiling that follows the terrain, with stalactites */
  const ceil = new Array(COLS).fill(0), cave = new Array(COLS).fill(false), eff = top.slice();
  platforms.forEach(p => { for (let c = p.x0; c <= p.x1; c++) eff[c] = Math.min(eff[c], p.row); });
  brks.forEach(b => { eff[b.tx] = Math.min(eff[b.tx], b.ty); });
  { let p = ri(14, 24), isCave = true;
    while (p < COLS - 24) { const len = isCave ? ri(90, 150) : ri(16, 30); if (isCave) for (let c = p; c < Math.min(COLS - 20, p + len); c++) cave[c] = true; p += len; isCave = !isCave; }
    const raw = new Array(COLS).fill(0); let head = 10;
    for (let c = 1; c < COLS - 1; c++) {
      if (!cave[c]) continue;
      head = Math.max(9, Math.min(15, Math.round(12 + 3 * Math.sin(c * 0.045 + wph) + 1.5 * Math.sin(c * 0.13 + wph * 2))));
      let mt = 1e9; for (let k = Math.max(1, c - 8); k <= Math.min(COLS - 2, c + 8); k++) mt = Math.min(mt, eff[k]);
      raw[c] = Math.max(1, mt - head);
    }
    for (let pass = 0; pass < 2; pass++) { const src = raw.slice(); for (let c = 1; c < COLS - 1; c++) if (cave[c]) { let sum = 0, n = 0; for (let k = c - 4; k <= c + 4; k++) if (cave[k]) { sum += src[k]; n++; } raw[c] = Math.round(sum / n); } }
    for (let c = 1; c < COLS - 1; c++) if (cave[c]) {
      let v = Math.min(raw[c], eff[c] - 9);
      if (rnd() < 0.2 && v + 4 <= eff[c] - 9) v += ri(1, 4);
      ceil[c] = Math.max(1, v);
    }
  }
  const g = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  for (let c = 0; c < COLS; c++) g[0][c] = 1;
  for (let r = 0; r < ROWS; r++) { g[r][0] = 1; g[r][COLS - 1] = 1; }
  for (let c = 1; c < COLS - 1; c++) for (let r = top[c]; r < ROWS; r++) g[r][c] = 1;
  for (let c = 1; c < COLS - 1; c++) for (let r = 1; r <= ceil[c]; r++) g[r][c] = 1;
  const crumbles = [];
  platforms.forEach(p => { for (let c = p.x0; c <= p.x1; c++) { g[p.row][c] = p.crumble ? 4 : 1; if (p.crumble) crumbles.push({ tx: c, ty: p.row }); } });
  /* hidden chambers under flat ground: a shaft with an updraft leads down to a room holding a lever, key, switch or portal */
  const busy = new Uint8Array(COLS), mk = (a, b) => { for (let c = Math.max(0, Math.floor(a)); c <= Math.min(COLS - 1, Math.ceil(b)); c++) busy[c] = 1; };
  spikes.forEach(q => mk(q.tx - 1, q.tx + 1)); platforms.forEach(q => mk(q.x0 - 1, q.x1 + 1)); springs.forEach(q => mk(q.tx - 2, q.tx + 2));
  saws.forEach(q => { const c0 = q.cx !== undefined ? q.cx : q.px; mk((c0 - (q.range || 40)) / 8 - 3, (c0 + (q.range || 40)) / 8 + 3); });
  crushers.forEach(q => mk(q.x / 8 - 2, q.x / 8 + 5)); lasers.forEach(q => mk(q.cx / 8 - 5, q.cx / 8 + 5)); fans.forEach(q => mk(q.x0 / 8 - 3, q.x1 / 8 + 3));
  winds.forEach(q => mk(q.x0 / 8 - 2, q.x1 / 8 + 2)); moons.forEach(q => mk(q.x0 / 8 - 2, q.x1 / 8 + 2)); belts.forEach(q => mk(q.x0 / 8 - 2, q.x1 / 8 + 2));
  movers.forEach(q => q.axis === 'x' ? mk((q.c - q.range) / 8 - 3, (q.c + q.range) / 8 + 6) : mk(q.x / 8 - 3, q.x / 8 + 6));
  brks.forEach(q => mk(q.tx - 3, q.tx + 3)); gates.forEach(q => mk(q.col - 2, q.col + 2)); walls.forEach(q => mk(q.tx - 3, q.tx + 3)); portals.forEach(q => mk(q.x / 8 - 3, q.x / 8 + 3));
  phs.forEach(q => mk(q.tx - 2, q.tx + 2)); cps.forEach(q => mk(q.x / 8 - 2, q.x / 8 + 3)); turrets.forEach(q => mk(q.x / 8 - 4, q.x / 8 + 4)); mk(goal.x / 8 - 3, goal.x / 8 + 3);
  const used = [];
  const findSite = bx => {
    const cs = [];
    for (let sx = 20; sx < bx - 30 && sx < COLS - 14; sx++) {
      const t = top[sx]; if (t + 15 >= ROWS || t < 4 || top[sx + 1] !== t || top[sx + 2] !== t) continue;
      let ok = true;
      for (let k2 = sx - 2; k2 <= sx + 5 && ok; k2++) if (busy[k2]) ok = false;
      for (let k2 = sx - 5; k2 <= sx + 8 && ok; k2++) if (top[k2] > t + 6) ok = false;
      if (ok && !used.some(u => Math.abs(u - sx) < 18)) cs.push(sx);
    }
    return cs.length ? cs[Math.floor(rnd() * cs.length)] : -1;
  };
  const carve = (sx, t) => {
    for (let r = t; r <= t + 13; r++) for (let c = sx; c <= sx + 2; c++) { g[r][c] = 0; bgT.push([c, r]); }
    for (let r = t + 8; r <= t + 13; r++) for (let c = sx - 5; c <= sx + 8; c++) { g[r][c] = 0; bgT.push([c, r]); }
    movers.push({ axis: 'y', c: (t + 7) * 8, x: sx * 8, range: 56, spd: 0.75, ph: rnd() * 6.28, w: 24 });
    spikes.push({ tx: sx + 4, ty: t + 13 }, { tx: sx + 5, ty: t + 13 });
    if (rnd() < 0.4) saws.push({ axis: 'x', cx: (sx - 3) * 8 + 4, y: (t + 14) * 8 - 6, range: 8, spd: 2, ph: 0 });
    used.push(sx);
  };
  const dead = new Set();
  const placeReq = rq => {
    const sx = findSite(rq.bx); if (sx < 0) return false;
    const t = top[sx]; carve(sx, t);
    const fy = (t + 14) * 8, ix = (sx + 7) * 8 + 4;
    if (rq.kind === 'lever') levers.push({ x: ix, y: fy, gate: rq.gate, ord: 0 });
    else if (rq.kind === 'key') keys.push({ x: ix, y: fy - 8, gate: rq.gate });
    else if (rq.kind === 'order') levers.push({ x: ix, y: fy, gate: rq.gate, ord: rq.ord });
    else if (rq.kind === 'portal') portals.push({ x: ix, y: fy - 14, pair: rq.pair });
    return true;
  };
  reqs.forEach(rq => {
    if (rq.kind === 'portal') { if (dead.has('p' + rq.pair) || !placeReq(rq)) dead.add('p' + rq.pair); }
    else if (dead.has('g' + rq.gate) || !placeReq(rq)) dead.add('g' + rq.gate);
  });
  gates.forEach((gt, i) => { if (dead.has('g' + i)) gt.skip = true; });
  for (let i = levers.length - 1; i >= 0; i--) if (dead.has('g' + levers[i].gate)) levers.splice(i, 1);
  for (let i = keys.length - 1; i >= 0; i--) if (dead.has('g' + keys[i].gate)) keys.splice(i, 1);
  for (let i = portals.length - 1; i >= 0; i--) if (dead.has('p' + portals[i].pair)) portals.splice(i, 1);
  for (let i = walls.length - 1; i >= 0; i--) if (walls[i].pair >= 0 && dead.has('p' + walls[i].pair)) walls.splice(i, 1);
  for (let n = Math.max(1, Math.round(COLS / 160)); n > 0; n--) {
    const sx = findSite(COLS - 30); if (sx < 0) break;
    const t = top[sx]; carve(sx, t); for (let i = 0; i < 4; i++) gem(sx + 6 + (i >> 1) * 1, t + 12 - (i % 2));
  }
  spikes.forEach(sp => { if (g[sp.ty][sp.tx] === 0) g[sp.ty][sp.tx] = 2; });
  brks.forEach(b => { if (g[b.ty][b.tx] === 0) g[b.ty][b.tx] = 5; });
  walls.forEach(w => { if (g[w.ty] && g[w.ty][w.tx] === 0) g[w.ty][w.tx] = 1; });
  phs.forEach(p => { if (g[p.ty][p.tx] === 0) g[p.ty][p.tx] = p.t; });
  gates.forEach(gt => { gt.tiles = []; if (gt.skip) return; for (let r = Math.max(1, gt.y0); r <= gt.y1; r++) if (g[r][gt.col] === 0) { g[r][gt.col] = 6; gt.tiles.push([gt.col, r]); } });
  const drips = []; let lastDrip = -99;
  for (let c = 6; c < COLS - 8; c++) {
    if (!cave[c] || ceil[c] < 2 || c - lastDrip < 14 || rnd() > 0.06) continue;
    if (top[c] !== top[c - 1] || top[c] !== top[c + 1] || g[top[c] - 1][c] !== 0 || g[ceil[c] + 1][c] !== 0) continue;
    const px = c * 8 + 4;
    if (saws.some(q => Math.abs((q.cx || 0) - px) < 60) || crushers.some(q => Math.abs(q.x - px) < 40) || lasers.some(q => Math.abs(q.cx - px) < 40) || fans.some(q => px > q.x0 - 16 && px < q.x1 + 16) || movers.some(q => Math.abs((q.x || q.c) - px) < 60) || springs.some(q => Math.abs(q.tx * 8 - px) < 24)) continue;
    drips.push({ x: px, y0: (ceil[c] + 1) * 8, ground: top[c] * 8 }); lastDrip = c;
  }
  const RES = { grid: g, cps, crystals: cry, gems: gems.filter(q => g[Math.floor(q.y / 8)][Math.floor(q.x / 8)] === 0), spikes: spikes.filter(sp => g[sp.ty][sp.tx] === 2), springs, crumbles, goal, startGy: Math.round(o.y0), endGy: gy, saws, fans, movers, belts, winds, moons, crushers, lasers, drips, ceil, gates, levers, keys, portals, phs, turrets, feats: [...on] };
  bgT.forEach(([c, r]) => { if (g[r][c] === 0) g[r][c] = 7; });
  return RES;
}
/*GEN_END*/
