/* ---- scene props generated per level ---- */
let propsBack = [], propsFg = [];
function buildProps(seed) {
  const r = mulberry32(seed * 31 + 7);
  propsBack = []; propsFg = [];
  for (let x = -160; x < W + 160; x += 50 + r() * 60) propsBack.push({ x, z: -(70 + r() * 170), w: 8 + r() * 16, h: 1600 + 130 + r() * 330 + H * 0.25, tint: r() });
  for (let x = 40; x < W; x += 110 + r() * 110) propsFg.push({ x, z: 48 + r() * 26, w: 4 + r() * 6, h: 50 + r() * 110 });
}
function drawProps() {
  const R = RC, base = -(H + 60) - 1600;
  for (const p of propsBack) {
    if (Math.abs(p.x - cam.x) > (R.dist - p.z) * 1.5 + 80) continue;
    const zn = zoneOf(Math.max(0, p.x), W), col = mixRgb(mixRgb(PAL.prop, p.tint > 0.5 ? PAL.spring : PAL.spent, 0.1), ZT[zn], zn ? 0.45 : 0), hw = p.w / 2;
    drawBox(p.x - hw, base, p.z - hw, p.x + hw, base + p.h, p.z + hw, col, false, 1, 1 | 4 | 8 | 16);
    if (Math.sin(world.time * 1.4 + p.x) > -0.3) drawBox(p.x - 2, base + p.h, p.z - 2, p.x + 2, base + p.h + 4, p.z + 2, p.tint > 0.5 ? PAL.spring : PAL.spent, true, 1, 1 | 4 | 8 | 16);
  }
  for (const p of propsFg) {
    if (Math.abs(p.x - cam.x) > 260) continue;
    drawBox(p.x - p.w / 2, -H - 1600, p.z - p.w / 2, p.x + p.w / 2, -H + p.h, p.z + p.w / 2, PAL.fg, false, 1, 1 | 4 | 8 | 16);
  }
}
const FRONTC = {};
function drawTerrain() {
  const D2 = P.camDepth / 2, R = RC;
  const ext = Math.tan(R.fov / 2) * R.dist * 1.35 + 20;
  const extx = ext * (CW / CH) + R.dist * Math.abs(cam.yaw) * 1.1, exty = ext + R.dist * Math.abs(cam.pitch - 0.14) * 1.1 + 10;
  const tx0 = Math.max(0, Math.floor((cam.x - extx) / T)), tx1 = Math.min(COLS - 1, Math.ceil((cam.x + extx) / T));
  const ty0 = Math.max(0, Math.floor((cam.y - exty) / T)), ty1 = Math.min(ROWS - 1, Math.ceil((cam.y + exty) / T));
  const cTop = shadeCol(PAL.top, LIT.front, 0), cSpeck = shadeCol(PAL.speck, LIT.front, 0), cGrass = shadeCol(PAL.grass, LIT.top, 0);
  const px = pl.x + 4, pyb = pl.y + PH;
  for (let ty = ty0; ty <= ty1; ty++) {
    const row = grid[ty];
    for (let tx = tx0; tx <= tx1; tx++) {
      if (row[tx] === 7) {
        const bx = tx * T, by = -ty * T;
        drawBox(bx, by - T, -D2 - 7, bx + T, by, -D2 - 1, mixRgb(PAL.solid, PAL.ink, 0.6), false, 1, 63 & ~2);
        continue;
      }
      if (row[tx] === 6) {
        const bx = tx * T, by = -ty * T, gc = gcol(gateOf.get(ty * COLS + tx) || 0);
        drawBox(bx + 1, by - T, -2, bx + T - 1, by, 2, gc, true, 0.45, 63 & ~2);
        drawBox(bx + 2, by - T, -2.5, bx + 3.2, by, 2.5, gc, true, 1, 63 & ~2); drawBox(bx + T - 3.2, by - T, -2.5, bx + T - 2, by, 2.5, gc, true, 1, 63 & ~2);
        continue;
      }
      if (row[tx] === 8 || row[tx] === 9) {
        const bx = tx * T, by = -ty * T, act = (row[tx] === 8) === (phase === 0), soon = act && (PHASE_T - (world.time % PHASE_T)) < 0.4 && Math.floor(world.time * 14) % 2 === 0;
        const pc = row[tx] === 8 ? PAL.spring : PAL.crystal;
        if (act && !soon) { drawBox(bx, by - T, -D2, bx + T, by, D2, PAL.solid, false, 1, 63 & ~2, pc); drawBox(bx, by - 1.6, -D2 - 0.3, bx + T, by, D2 + 0.3, pc, true, 1, 63 & ~2); }
        else drawBox(bx, by - T, -D2, bx + T, by, D2, pc, true, soon ? 0.7 : 0.16, 63 & ~2);
        continue;
      }
      if (row[tx] === 5) {
        const bx = tx * T, by = -ty * T;
        drawBox(bx, by - T, -D2, bx + T, by, D2, PAL.crumb, false, 1, 63 & ~2, PAL.top);
        for (let n = 0; n < 4; n++) drawBox(bx + 1 + n * 1.6, by - 1.6 - n * 1.6, D2, bx + 2.6 + n * 1.6, by - 0.2 - n * 1.6, D2 + 0.6, PAL.enemy, true, 0.9, 63 & ~2);
        continue;
      }
      if (row[tx] !== 1) continue;
      const X0 = tx * T, X1 = X0 + T, Yhi = -ty * T, Ylo = Yhi - T, h = hash2(tx, ty), Z = ZP[zoneOf(tx, COLS)];
      let m = 1; const topExp = !solidAt(tx, ty - 1);
      if (!solidAt(tx - 1, ty)) m |= 4; if (!solidAt(tx + 1, ty)) m |= 8; if (topExp) m |= 16; if (!solidAt(tx, ty + 1)) m |= 32;
      drawBox(X0, Ylo, -D2, X1, Yhi, D2, h < 0.5 ? Z.solid : Z.solid2, false, 1, m, topExp ? Z.topFace : null);
      if (topExp) {
        quad(X0, Yhi, D2 + 0.05, X1, Yhi, D2 + 0.05, X1, Yhi - 1.3, D2 + 0.05, X0, Yhi - 1.3, D2 + 0.05, cTop, false, 1);
        for (let n = 0; n < 3; n++) {
          const h0 = hash2(tx * 7 + n, ty * 13), bx = Math.floor(X0 + 1 + n * 3 + h0 * 1.5), hh = 2 + Math.floor(h0 * 3), z = (hash2(tx + n, ty * 3) * 2 - 1) * (D2 - 1);
          let bend = Math.sin(world.time * 1.7 + bx * 0.35) * 0.8; const pdx = bx - px;
          if (Math.abs(pdx) < 14 && Math.abs(pyb - ty * T) < 12) { const w = 1 - Math.abs(pdx) / 14; bend += (pdx >= 0 ? 1 : -1) * w * 3 + pl.vx * 0.012 * w; }
          quad(bx, Yhi, z, bx + 1.2, Yhi, z, bx + 1.2 + bend, Yhi + hh, z, bx + bend, Yhi + hh, z, Z.cGrass, false, 1);
        }
      }
      if (!solidAt(tx, ty + 1) && ty < ROWS - 2 && h > 0.86 && !solidAt(tx, ty - 1) === false) drawBox(X0 + 3, Ylo - 3, -1, X0 + 5, Ylo, 1, PAL.crystal, true, 0.9, 63 & ~2);
      if (h < 0.4) { const sx = X0 + 1 + ((h * 977) % 5 | 0), sy = Yhi - 2 - ((h * 313) % 5 | 0); quad(sx, sy, D2 + 0.05, sx + 1, sy, D2 + 0.05, sx + 1, sy - 1, D2 + 0.05, sx, sy - 1, D2 + 0.05, cSpeck, false, 1); }
    }
  }
  for (const cb of crumbs) {
    const X0 = cb.tx * T, Yhi = -cb.ty * T;
    if (Math.abs(X0 - cam.x) > extx) continue;
    if (cb.st === 2) {
      if (cb.fall < 0.5) { const f = cb.fall; drawBox(X0, Yhi - T - f * f * 260, -D2, X0 + T, Yhi - f * f * 260, D2, PAL.crumb, false, 1 - f * 2, 63 & ~2); }
      continue;
    }
    const jx = cb.st === 1 ? (Math.random() - 0.5) * 1.2 : 0, jy = cb.st === 1 ? (Math.random() - 0.5) * 0.8 : 0;
    drawBox(X0 + jx, Yhi - T + jy, -D2, X0 + T + jx, Yhi + jy, D2, PAL.crumb, false, 1, 63 & ~2, PAL.top);
  }
}
function drawObjects() {
  const R = RC;
  for (const c of lvl.cps) {
    const on = c === cp, g = -(c.y + 8), col = on ? PAL.crystal : PAL.spent;
    drawBox(c.x + 3, g, -1, c.x + 5, g + 5, 1, PAL.top, false, 1, 1 | 4 | 8 | 16);
    drawBox(c.x + 2, g + 5, -2, c.x + 6, g + 8 + (on && Math.sin(world.time * 4) > 0 ? 1 : 0), 2, col, true, on ? 1 : 0.5, 63 & ~2);
  }
  for (const sp of springs) {
    const g = -(sp.ty + 1) * T, x = sp.tx * T, h = 3 + Math.round(3 * sp.comp);
    drawBox(x + 1, g, -3, x + 7, g + 1, 3, PAL.spring, true, 1, 63 & ~2);
    for (let i = 0; i < h; i++) drawBox(x + 2 + (i % 2 ? 3 : 0), g + 1 + i, -2, x + 4 + (i % 2 ? 3 : 0), g + 2 + i, 2, PAL.spring, true, 1, 63 & ~2);
    drawBox(x, g + 1 + h, -4, x + 8, g + 3 + h, 4, PAL.spring, true, 1, 63 & ~2);
  }
  const cH = shadeCol(PAL.hazard, emLit(LIT.front), 0), cH2 = shadeCol(PAL.hazard, emLit(LIT.left), 0), cH3 = shadeCol(PAL.hazard, emLit(LIT.top), 0);
  for (const sp of lvl.spikes) {
    if (Math.abs(sp.tx * T - cam.x) > 300) continue;
    const g = -(sp.ty + 1) * T;
    for (let i = 0; i < 2; i++) {
      const x0 = sp.tx * T + i * 4, xa = x0 + 2, x1 = x0 + 4, ya = g + 5;
      tri(x0, g, 5, x1, g, 5, xa, ya, 5, cH, true, 1);
      quad(x0, g, -5, xa, ya, -5, xa, ya, 5, x0, g, 5, cH2, true, 1);
      quad(x1, g, 5, xa, ya, 5, xa, ya, -5, x1, g, -5, cH3, true, 1);
    }
  }
  if (lvl.goal) {
    const g = lvl.goal, wv = Math.round(Math.sin(world.time * 5));
    drawBox(g.x, -(g.y + 16), -1, g.x + 1, -g.y, 1, PAL.star, true, 1, 1 | 4 | 8 | 16);
    const cf = shadeCol(PAL.ready, 1, 0);
    tri(g.x + 1, -g.y, 0, g.x + 9 + wv, -(g.y + 3), 0, g.x + 1, -(g.y + 6), 0, cf, true, 1);
  }
  gemList.forEach((q, i) => {
    if (q.got) return;
    drawMesh(MESH.diamond, q.x, -q.y - Math.sin(world.time * 2.4 + i) * 1.5, 0, 3, 4.2, 3, world.time * 2.6 + i, PAL.gem, true, 1);
  });
  for (const sw of lvl.saws) {
    if (Math.abs(sw.cx - cam.x) > 300) continue;
    const [sx, sy] = sawPos(sw), spin = world.time * 12;
    if (sw.axis === 'p') { for (let k = 0; k <= 5; k++) { const rx = sw.px + (sx - sw.px) * k / 5, ry = sw.py + (sy - sw.py) * k / 5; drawBox(rx - 0.6, -ry - 0.6, -0.6, rx + 0.6, -ry + 0.6, 0.6, PAL.enemyDim, false, 1, 63); } drawBox(sw.px - 2, -sw.py - 2, -2, sw.px + 2, -sw.py + 2, 2, PAL.spent, false, 1, 63); }
    else if (sw.axis === 'y') drawBox(sw.cx - 0.5, -(sw.cy + sw.range + 6), -1, sw.cx + 0.5, -(sw.cy - sw.range - 6), 1, PAL.enemyDim, false, 1, 63 & ~2);
    else drawBox(sw.cx - sw.range - 6, -(sw.y + 0.5), -1, sw.cx + sw.range + 6, -(sw.y - 0.5), 1, PAL.enemyDim, false, 1, 63 & ~2);
    drawMesh(MESH.circle, sx, -sy, 0, 6, 6, 2.5, spin, PAL.enemy, true, 1);
    for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 2, tx = sx + Math.cos(a) * 6.4, ty = sy + Math.sin(a) * 6.4; drawBox(tx - 1, -ty - 1, -2.6, tx + 1, -ty + 1, 2.6, PAL.enemy, true, 1, 63 & ~2); }
    drawBox(sx - 1.2, -sy - 1.2, -3.2, sx + 1.2, -sy + 1.2, 3.2, PAL.star, true, 1, 63);
  }
  for (const l of lvl.lasers) {
    if (Math.abs(l.cx - cam.x) > 300) continue;
    const p = laserPh(l), on = p >= 0.55 && p < 0.8, warn = p >= 0.4 && p < 0.55 && Math.floor(world.time * 16) % 2 === 0;
    for (const [ex, ey] of [[l.x1, l.y1], [l.x2, l.y2]]) { drawBox(ex - 3, -ey - 3, -3, ex + 3, -ey + 3, 3, PAL.enemyDim, false, 1, 63 & ~2); drawBox(ex - 1, -ey - 1, -3.2, ex + 1, -ey + 1, 3.2, PAL.enemy, true, 1, 63); }
    if (on || warn) {
      const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1), n = Math.max(2, Math.ceil(len / (on ? 2 : 4)));
      for (let i = 0; i <= n; i++) { const u = i / n, bx = l.x1 + (l.x2 - l.x1) * u, by = l.y1 + (l.y2 - l.y1) * u, h = on ? 1.3 : 0.5; drawBox(bx - h, -by - h, -h, bx + h, -by + h, h, PAL.enemy, true, on ? 1 : 0.45, 63); }
    }
  }
  for (const t of turrets) {
    if (Math.abs(t.x - cam.x) > 300) continue;
    const x0 = t.dir < 0 ? t.x - 5 : t.x, x1 = t.dir < 0 ? t.x : t.x + 5;
    drawBox(x0, -(t.y + 4.5), -3.5, x1, -(t.y - 4.5), 3.5, PAL.enemyDim, false, 1, 63 & ~2);
    drawBox(t.dir < 0 ? x0 - 0.5 : x1 - 1.5, -(t.y + 1.5), -1.5, t.dir < 0 ? x0 + 1.5 : x1 + 0.5, -(t.y - 1.5), 1.5, PAL.enemy, true, t.warn && Math.floor(world.time * 18) % 2 === 0 ? 1 : 0.55, 63);
  }
  for (const sh of shots) {
    if (Math.abs(sh.x - cam.x) > 300) continue;
    drawBox(sh.x - 2.5, -(sh.y + 1.6), -1.6, sh.x + 2.5, -(sh.y - 1.6), 1.6, PAL.enemy, true, 1, 63);
    drawBox(sh.x - 1, -(sh.y + 0.8), -0.8, sh.x + 1, -(sh.y - 0.8), 0.8, PAL.star, true, 1, 63);
  }
  for (const dr of drips) {
    if (dr.st === 3 || Math.abs(dr.x - cam.x) > 300) continue;
    const jx = dr.st === 1 ? (Math.random() - 0.5) * 1.6 : 0, hot = dr.st > 0;
    drawBox(dr.x - 2.5 + jx, -(dr.y + 4), -2, dr.x + 2.5 + jx, -dr.y, 2, PAL.solid, false, 1, 63 & ~2, PAL.top);
    drawBox(dr.x - 1 + jx, -(dr.y + 8), -1, dr.x + 1 + jx, -(dr.y + 4), 1, hot ? PAL.enemy : PAL.crystal, true, 1, 63 & ~2);
  }
  for (const w of lvl.winds) {
    if (w.x1 < cam.x - 300 || w.x0 > cam.x + 300) continue;
    const ww = w.x1 - w.x0, hh = w.y1 - w.y0;
    for (let i = 0; i < 14; i++) {
      const y = w.y0 + ((i * 37.7) % (hh - 12)) + 6, xx = ((((world.time * 75 * w.dir + i * 29.3) % ww) + ww) % ww);
      drawBox(w.x0 + xx, -y - 0.5, -1, w.x0 + Math.min(ww, xx + 7), -y + 0.5, 1, PAL.crystal, true, 0.7, 63 & ~2);
    }
  }
  for (const m of lvl.moons) {
    if (m.x1 < cam.x - 300 || m.x0 > cam.x + 300) continue;
    const ww = m.x1 - m.x0, hh = m.y1 - m.y0;
    for (let i = 0; i < 12; i++) {
      const xx = m.x0 + 3 + ((i * 53.3) % (ww - 6)), y = m.y1 - ((world.time * 16 + i * hh / 12) % hh);
      drawBox(xx, -y - 1, -1, xx + 2, -y + 1, 1, PAL.star, true, 0.6, 63 & ~2);
    }
    for (const ex of [m.x0, m.x1 - 1]) drawBox(ex, -m.y1, -1, ex + 1, -m.y0, 1, PAL.spring, true, 0.25, 63 & ~2);
  }
  for (const c of lvl.crushers) {
    if (Math.abs(c.x - cam.x) > 300) continue;
    const bot = c.ground - crushLift(c), warn = crushWarn(c) && Math.floor(world.time * 14) % 2 === 0;
    drawBox(c.x + c.w / 2 - 0.6, -(bot - 20 - 120), -1, c.x + c.w / 2 + 0.6, -(bot - 20), 1, PAL.spent, false, 1, 63 & ~2);
    drawBox(c.x, -bot, -5, c.x + c.w, -(bot - 20), 5, warn ? PAL.enemy : PAL.enemyDim, warn, 1, 63 & ~2, PAL.enemy);
    for (let k = 0; k < 4; k++) drawBox(c.x + 2 + k * 6, -bot - 3, -3, c.x + 5 + k * 6, -bot, 3, PAL.enemy, true, 1, 63 & ~2);
  }
  for (const lv of levers) {
    if (Math.abs(lv.x - cam.x) > 300) continue;
    const gc = gcol(gates[lv.gate].ci), tip = lv.on ? lv.x + 3 : lv.x - 3;
    drawBox(lv.x - 4, -lv.y, -3, lv.x + 4, -(lv.y - 2), 3, PAL.spent, false, 1, 63);
    drawBox(lv.x - 0.7, -(lv.y - 8), -0.7, lv.x + 0.7, -(lv.y - 2), 0.7, PAL.spent, false, 1, 63);
    drawBox(tip - 1.6, -(lv.y - 10), -1.6, tip + 1.6, -(lv.y - 7), 1.6, lv.on ? PAL.star : gc, true, 1, 63);
    if (!lv.on) drawBox(lv.x - 5, -(lv.y - 12 + Math.sin(world.time * 4) * 1.5), -0.5, lv.x + 5, -(lv.y - 13 + Math.sin(world.time * 4) * 1.5), 0.5, gc, true, 0.35, 63 & ~2);
    for (let i = 0; i < lv.ord; i++) drawBox(lv.x - (lv.ord - 1) * 2 + i * 4 - 1, -(lv.y - 17), -1, lv.x - (lv.ord - 1) * 2 + i * 4 + 1, -(lv.y - 15), 1, lv.on ? PAL.star : gc, true, 1, 63);
  }
  for (const k of keys) {
    if (k.got || Math.abs(k.x - cam.x) > 300) continue;
    const bob = Math.sin(world.time * 3 + k.x) * 1.6, gc = gcol(gates[k.gate].ci);
    drawMesh(MESH.diamond, k.x, -(k.y + 4 + bob), 0, 4, 5, 2.5, world.time * 3, gc, true, 1);
    drawBox(k.x - 0.8, -(k.y - 1 + bob), -0.8, k.x + 0.8, -(k.y + 3 + bob), 0.8, PAL.star, true, 1, 63);
  }
  for (const p of portals) {
    if (Math.abs(p.x - cam.x) > 300) continue;
    const pc = gcol(p.pair);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + world.time * 2.2, rx = p.x + Math.cos(a) * 6, ry = p.y + Math.sin(a) * 9; drawBox(rx - 1.1, -ry - 1.1, -1.1, rx + 1.1, -ry + 1.1, 1.1, pc, true, 1, 63 & ~2); }
    drawBox(p.x - 2, -p.y - 3, -1, p.x + 2, -p.y + 3, 1, pc, true, 0.4 + 0.3 * Math.sin(world.time * 5), 63 & ~2);
  }
  for (const b of lvl.belts) {
    if (b.x1 < cam.x - 300 || b.x0 > cam.x + 300) continue;
    drawBox(b.x0, -(b.y + 0.2), -4, b.x1, -(b.y - 0.8), 4, PAL.spent, false, 1, 63 & ~2);
    const off = (((world.time * b.sp * b.dir) % 8) + 8) % 8;
    for (let x = b.x0 + off; x < b.x1 - 3; x += 8) drawBox(x, -(b.y - 0.8), -3, x + 2.5, -(b.y - 1.6), 3, PAL.spring, true, 1, 63 & ~2);
    for (const ex of [b.x0, b.x1 - 3]) drawBox(ex, -(b.y - 1.6), -4, ex + 3, -(b.y - 0.4), 4, PAL.spring, true, 1, 63 & ~2);
  }
  for (const m of movers) {
    if (Math.abs(m.x - cam.x) > 300) continue;
    drawBox(m.x, -(m.y + 4), -4, m.x + m.w, -m.y, 4, PAL.solid, false, 1, 63, PAL.top);
    drawBox(m.x + 1, -(m.y + 1), -5, m.x + m.w - 1, -m.y, 5, PAL.crystal, true, 1, 63 & ~2);
    drawBox(m.x + 3, -(m.y + 5), -1, m.x + 5, -(m.y + 4), 1, PAL.spring, true, 1, 63);
    drawBox(m.x + m.w - 5, -(m.y + 5), -1, m.x + m.w - 3, -(m.y + 4), 1, PAL.spring, true, 1, 63);
  }
  for (const fn of lvl.fans) {
    if (Math.abs(fn.x0 - cam.x) > 320) continue;
    const hgt = fn.y1 - fn.y0, nn = 9;
    drawBox(fn.x0, -(fn.y1 + 1), -2, fn.x1, -(fn.y1 - 1), 2, PAL.spring, true, 1, 63 & ~2);
    for (let i = 0; i < nn; i++) {
      const fx = fn.x0 + 3 + ((i * 7.3) % (fn.x1 - fn.x0 - 6)), ph = ((world.time * 55 + i * hgt / nn) % hgt);
      const yy = fn.y1 - ph;
      drawBox(fx, -yy - 4, -1, fx + 1, -yy, 1, PAL.crystal, true, 1 - ph / hgt * 0.8, 63 & ~2);
    }
  }
}
const VCACHE = {};
const VBODY = ["...........", "...bbbbb...", "..bbbbbbb..", ".bbbbbbbbb.", ".bbbbbbbbb.", ".bbbbbbbbb.", ".bbbbbbbbb.", ".bbbbbbbbb.", "..bbbbbbb..", "...bbbbb...", "..........."];
const SPA = [[5, 0], [1, 1], [9, 1], [0, 5], [10, 5], [1, 9], [9, 9], [5, 10]], SPB = [[3, 0], [7, 0], [0, 3], [0, 7], [10, 3], [10, 7], [3, 10], [7, 10]];
/* one animation frame: spike set, mouth, eyes, pupil position */
function virusRows(phase, mouth, eyes, pr, left, right) {
  const key = phase + '' + mouth + eyes + pr + left + right;
  if (VCACHE[key]) return VCACHE[key];
  const g = VBODY.map(r => r.split(''));
  (phase ? SPB : SPA).forEach(q => { g[q[1]][q[0]] = 's'; });
  g[2][3] = 'h'; g[2][4] = 'h'; g[3][2] = 'h';
  [[3, left], [6, right]].forEach(e => {
    const x0 = e[0];
    if (eyes === 1) { g[5][x0] = 'k'; g[5][x0 + 1] = 'k'; return; }
    if (eyes === 2) { g[4][x0 === 3 ? 4 : 6] = 'k'; g[5][x0] = 'e'; g[5][x0 + 1] = 'e'; g[5][e[1]] = 'p'; return; }
    g[4][x0] = 'e'; g[4][x0 + 1] = 'e'; g[5][x0] = 'e'; g[5][x0 + 1] = 'e'; g[pr][e[1]] = 'p';
  });
  if (mouth === 0) { g[7][4] = 'm'; g[7][5] = 'm'; g[7][6] = 'm'; }
  else if (mouth === 1) { g[7][3] = 'm'; g[7][7] = 'm'; g[8][4] = 'm'; g[8][5] = 'm'; g[8][6] = 'm'; }
  else if (mouth === 2) { for (let x = 4; x <= 6; x++) { g[7][x] = 'm'; g[8][x] = 'm'; } }
  else { for (let x = 3; x <= 7; x++) g[7][x] = x % 2 ? 'w' : 'm'; }
  return (VCACHE[key] = g.map(r => r.join('')));
}
/* camera-facing pixel sprite with depth test; every sprite pixel also glows */
function drawSprite(rows, colorOf, cx, cy, cz, ww, hh) {
  const zv = proj(cx, cy, cz); if (zv < 0) return;
  const sc = RC.F / zv, cols = rows[0].length, nr = rows.length, hw = ww * sc / 2, hh2 = hh * sc / 2, iz = 1 / zv;
  const x0 = Math.max(0, Math.floor(PX - hw)), x1 = Math.min(CW - 1, Math.ceil(PX + hw)), y0 = Math.max(0, Math.floor(PY - hh2)), y1 = Math.min(CH - 1, Math.ceil(PY + hh2));
  for (let y = y0; y <= y1; y++) {
    const v = Math.floor((y + 0.5 - (PY - hh2)) / (2 * hh2) * nr); if (v < 0 || v >= nr) continue;
    for (let x = x0; x <= x1; x++) {
      const u = Math.floor((x + 0.5 - (PX - hw)) / (2 * hw) * cols); if (u < 0 || u >= cols) continue;
      const ch = rows[v][u]; if (ch === '.') continue;
      const idx = y * CW + x; if (iz <= DB[idx]) continue;
      const col = colorOf(ch, u, v); DB[idx] = iz; FU[idx] = col; EU[idx] = col;
    }
  }
}
function drawPlayer() {
  if (pl.dead) return;
  const w = PW * pl.sx, h = PH * pl.sy, d = 8 * (pl.sx + pl.sy) / 2, cx = pl.x + PW / 2, ylo = -(pl.y + PH), cy = ylo + h / 2;
  const tired = pl.stamina < 20 && Math.floor(world.time * 10) % 2 === 0 && (pl.state === CLIMB || pl.stamina < P.maxStamina);
  const col = tired ? PAL.star : rgbOf(bodyColor());
  if (V.shape === 'virus') {
    const t = world.time, moving = pl.onGround && pl.state === NORMAL && Math.abs(pl.vx) > 30;
    const phase = Math.floor(t * (pl.state === DASH ? 18 : (moving ? 6 : 2.2))) % 2;
    let mouth = 1, eyes = (t % 3.6) < 0.12 ? 1 : 0;
    if (pl.state === DASH) { mouth = 3; eyes = 2; }
    else if (pl.state === CLIMB) { mouth = pl.stamina < 30 ? 3 : 0; }
    else if (!pl.onGround) { mouth = 2; }
    const f = pl.facing > 0, pr = pl.vy < -40 ? 4 : 5;
    const rows = virusRows(phase, mouth, eyes, pr, f ? 4 : 3, f ? 7 : 6);
    const body = pack(col[0], col[1], col[2]), bodyD = pack(col[0] * 0.8, col[1] * 0.8, col[2] * 0.8);
    const hi = mixRgb(col, PAL.star, 0.4), light = pack(hi[0], hi[1], hi[2]);
    const sp = mixRgb(col, PAL.star, 0.45), spike = pack(sp[0], sp[1], sp[2]), white = pack(PAL.star[0], PAL.star[1], PAL.star[2]), ink = pack(PAL.ink[0], PAL.ink[1], PAL.ink[2]);
    const colorOf = c => c === 'b' ? body : c === 's' ? spike : c === 'h' ? light : (c === 'e' || c === 'w') ? white : ink;
    const breathe = 1 + (moving ? 0 : 0.04 * Math.sin(t * 3.2)), bob = moving ? Math.abs(Math.sin(t * 14)) * 0.9 : 0;
    const ww = 11 * pl.sx * breathe, hh = 11 * pl.sy * breathe;
    drawSprite(rows, colorOf, cx, ylo + hh / 2 - 0.5 + bob, 0, ww, hh);
  } else {
    if (V.shape === 'square') drawBox(cx - w / 2, ylo, -d / 2, cx + w / 2, ylo + h, d / 2, col, true, 1, 63 & ~2);
    else drawMesh(MESH[V.shape], cx, cy, 0, w / 2, h / 2, d / 2, 0, col, true, 1);
    const ey = ylo + h * (V.shape === 'triangle' ? 0.38 : 0.62);
    drawBox(cx + pl.facing * 1.8 - 1, ey - 1, d / 2 - 0.6, cx + pl.facing * 1.8 + 1, ey + 1, d / 2 + 0.5, PAL.ink, false, 1, 1);
  }
  if (V.trail) for (const g of ghosts) drawBox(g.x, -(g.y + 8), -3, g.x + 8, -g.y, 3, rgbOf(g.c), true, (g.life / 0.25) * 0.45, 1 | 4 | 8 | 16);
}
function drawParticles() {
  let k = 0;
  for (const p of particles) {
    k++;
    const zv = proj(p.x, -p.y, ((k * 7) % 5 - 2) * 2); if (zv < 0) continue;
    const x0 = Math.round(PX), y0 = Math.round(PY), iz = 1 / zv, a = Math.max(0, p.life / p.max), c = rgbOf(p.c);
    for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) {
      const x = x0 + xx, y = y0 + yy; if (x < 0 || y < 0 || x >= CW || y >= CH) continue;
      const idx = y * CW + x; if (iz <= DB[idx]) continue;
      const d = FU[idx];
      FU[idx] = pack((d & 255) * (1 - a) + c[0] * a, ((d >> 8) & 255) * (1 - a) + c[1] * a, ((d >> 16) & 255) * (1 - a) + c[2] * a);
      if (a > 0.4) EU[idx] = pack(c[0], c[1], c[2]);
    }
  }
}
function drawBloom() {
  emCtx.putImageData(emImg, 0, 0);
  g1c.setTransform(1, 0, 0, 1, 0, 0); g1c.clearRect(0, 0, glow1.width, glow1.height); g1c.drawImage(emCanvas, 0, 0, glow1.width, glow1.height);
  g2c.clearRect(0, 0, glow2.width, glow2.height); g2c.drawImage(glow1, 0, 0, glow2.width, glow2.height);
  g3c.clearRect(0, 0, glow3.width, glow3.height); g3c.drawImage(glow2, 0, 0, glow3.width, glow3.height);
  ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'lighter';
  const k = V.bloom;
  ctx.globalAlpha = Math.min(1, 0.4 * k); ctx.drawImage(glow1, 0, 0, CW, CH);
  ctx.globalAlpha = Math.min(1, 0.5 * k); ctx.drawImage(glow2, 0, 0, CW, CH);
  ctx.globalAlpha = Math.min(1, 0.6 * k); ctx.drawImage(glow3, 0, 0, CW, CH);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawHit() {
  if (pl.dead) return;
  const pts = [[pl.x, pl.y], [pl.x + PW, pl.y], [pl.x + PW, pl.y + PH], [pl.x, pl.y + PH]];
  ctx.strokeStyle = C.crystal; ctx.lineWidth = 1; ctx.beginPath();
  pts.forEach((q, i) => { proj(q[0], -q[1], 0); if (i) ctx.lineTo(Math.round(PX) + 0.5, Math.round(PY) + 0.5); else ctx.moveTo(Math.round(PX) + 0.5, Math.round(PY) + 0.5); });
  ctx.closePath(); ctx.stroke();
}
let seen = new Uint8Array(1), mmC = null, mmX = null;
const MMW = 96, MMH = 48;
function markSeen() {
  const cx = Math.floor((pl.x + 4) / T), cy = Math.floor((pl.y + 4) / T);
  for (let dy = -9; dy <= 9; dy++) for (let dx = -14; dx <= 14; dx++) {
    if (dx * dx / 196 + dy * dy / 81 > 1) continue;
    const tx = cx + dx, ty = cy + dy; if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) seen[ty * COLS + tx] = 1;
  }
}
const MMC = [[90, 220, 255], [255, 120, 200], [255, 170, 60], [120, 255, 150]];
function drawMinimap() {
  if (!V.map) return;
  if (!mmC) { mmC = document.createElement('canvas'); mmC.width = MMW; mmC.height = MMH; mmX = mmC.getContext('2d'); }
  const img = mmX.createImageData(MMW, MMH), d = img.data, ox = Math.floor((pl.x + 4) / T) - (MMW >> 1), oy = Math.floor((pl.y + 4) / T) - (MMH >> 1);
  const put = (i, r, g, b, a) => { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; };
  for (let my = 0; my < MMH; my++) for (let mx = 0; mx < MMW; mx++) {
    const tx = ox + mx, ty = oy + my, i = (my * MMW + mx) * 4;
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) { put(i, 0, 0, 0, 120); continue; }
    if (!seen[ty * COLS + tx]) { put(i, 6, 8, 16, 110); continue; }
    const v = grid[ty][tx];
    if (v === 6) { const c = MMC[(gateOf.get(ty * COLS + tx) || 0) % 4]; put(i, c[0], c[1], c[2], 255); }
    else if (v === 2) put(i, 255, 90, 90, 255);
    else if (v === 7) put(i, 34, 44, 78, 215);
    else if (v === 0) put(i, 16, 20, 40, 205);
    else put(i, 120, 160, 185, 240);
  }
  const dot = (wx, wy, c, big) => {
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T); if (!seen[ty * COLS + tx]) return;
    const mx = tx - ox, my = ty - oy; for (let a = 0; a < (big ? 2 : 1); a++) for (let b = 0; b < (big ? 2 : 1); b++) { const X = mx + a, Y = my + b; if (X >= 0 && X < MMW && Y >= 0 && Y < MMH) put((Y * MMW + X) * 4, c[0], c[1], c[2], 255); }
  };
  for (const c of lvl.cps) dot(c.x + 4, c.y + 4, [255, 220, 90], false);
  for (const lv of levers) dot(lv.x, lv.y - 4, MMC[gates[lv.gate].ci % 4], true);
  for (const k of keys) if (!k.got) dot(k.x, k.y, MMC[gates[k.gate].ci % 4], true);
  for (const p of portals) dot(p.x, p.y, MMC[p.pair % 4], true);
  if (lvl.goal) dot(lvl.goal.x, lvl.goal.y + 8, Math.floor(world.time * 3) % 2 ? [255, 255, 255] : [255, 90, 140], true);
  if (Math.floor(world.time * 4) % 2 === 0) { const mx = (MMW >> 1) - 1, my = (MMH >> 1) - 1; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) put(((my + b) * MMW + mx + a) * 4, 255, 255, 255, 255); }
  mmX.putImageData(img, 0, 0);
  mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.drawImage(mmC, CW - MMW - 6, 6);
  mainCtx.strokeStyle = 'rgba(255,255,255,0.35)'; mainCtx.lineWidth = 1; mainCtx.strokeRect(CW - MMW - 5.5, 6.5, MMW - 1, MMH - 1);
}
function render() {
  ctx = mainCtx; ctx.imageSmoothingEnabled = false;
  setupRC();
  const vx0 = Math.round(cam.x - CW / 2 + cam.yaw * 160), vy0 = Math.round(cam.y - CH / 2 + (cam.pitch - 0.14) * 220);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackdrop(vx0, vy0); drawMotes(false);
  const img = ctx.getImageData(0, 0, CW, CH);
  FU = new Uint32Array(img.data.buffer); DB.fill(0); EU.fill(0);
  drawProps(); drawTerrain(); drawObjects(); customRuntime.draw(); drawPlayer(); drawParticles();
  ctx.putImageData(img, 0, 0);
  if (V.bloom > 0) drawBloom();
  drawMotes(true);
  drawMinimap();
  if (V.hit) drawHit();
}

