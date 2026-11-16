  /* ---------- level conversion bridge ---------- */
  function build() {
    let a = 1e9, b = -1e9, c2 = 1e9, d2 = -1e9; const bound = k => { const [c, r] = P(k); a = Math.min(a, c); b = Math.max(b, c); c2 = Math.min(c2, r); d2 = Math.max(d2, r); };
    tiles.forEach((v, k) => bound(k)); objs.forEach((v, k) => bound(k)); if (a > b) { a = 0; b = 10; c2 = 0; d2 = 10; }
    const pad = 20, ox = pad + 1 - a, oy = pad + 1 - c2, C = Math.max(40, b - a + 1 + 2 * pad + 2), R = Math.max(40, d2 - c2 + 1 + 2 * pad + 2);
    if (C * R > 1400000) throw new Error('Scene span is too large to play. Move distant objects closer together.');
    const g = Array.from({ length: R }, () => new Array(C).fill(0));
    /* the map edge is already an invisible solid wall (see solidTile), so no border blocks are drawn */
    const L = { grid: g, cps: [], gems: [], spikes: [], springs: [], crumbles: [], saws: [], fans: [], movers: [], belts: [], winds: [], moons: [], crushers: [], lasers: [], drips: [], gates: [], levers: [], keys: [], portals: [], phs: [], turrets: [], crystals: [], ceil: new Array(C).fill(0), feats: [], weather: null, layout: 'custom', cols: C, rows: R, goal: null, customObjects: [] };
    tiles.forEach((t, k) => { const [c0, r0] = P(k), c = c0 + ox, r = r0 + oy; g[r][c] = t; if (t === 2) L.spikes.push({ tx: c, ty: r }); if (t === 4) L.crumbles.push({ tx: c, ty: r }); });
    /* base ground runs down to the bottom of the world, so its underside never shows (floating platforms stay floating) */
    let maxR = -1e9; tiles.forEach((v, k) => { if (v === 1) maxR = Math.max(maxR, P(k)[1]); });
    const low = new Map(); tiles.forEach((v, k) => { const [c, r] = P(k), q = low.get(c); if (!q || r > q[0]) low.set(c, [r, v]); });
    low.forEach(([r, v], c) => { if (v === 1 && r >= maxR - 3) for (let y = r + oy + 1; y < R; y++) g[y][c + ox] = 1; });
    let start = null;
    objs.forEach((id, k) => {
      const [c0, r0] = P(k), c = c0 + ox, r = r0 + oy, X = c * 8, Y = r * 8, gr = Y + 8;
      if (id === 'custom') {const o=customFrom(k);L.customObjects.push({name:o.name,tags:o.tags,x:X,y:Y,components:deep(o.components)});}
      else if (id === 'player') start = { x: X, y: Y }; else if (id === 'spring') L.springs.push({ tx: c, ty: r }); else if (id === 'gem') L.gems.push({ x: X + 4, y: Y + 4 }); else if (id === 'cp') L.cps.push({ x: X, y: Y }); else if (id === 'flag') L.goal = { x: X + 4, y: Y - 8 };
      else if (id === 'sawv') L.saws.push({ axis: 'y', cx: X + 4, cy: Y - 10, range: prop(k,'range',12), spd: prop(k,'speed',1.8), ph: 0 }); else if (id === 'saw') L.saws.push({ axis: 'x', cx: X + 4, y: Y + 2, range: prop(k,'range',20), spd: prop(k,'speed',2), ph: 0 }); else if (id === 'crush') L.crushers.push({ x: X, w: prop(k,'width',24), ground: gr, per: prop(k,'period',2.8), ph: 0 });
      else if (id === 'laser') { const x0 = X + 4; L.lasers.push({ x1: x0, y1: gr, x2: x0, y2: gr - prop(k,'length',56), cx: x0, cy: gr - prop(k,'length',56)/2, per: prop(k,'period',3.2), ph: 0 }); }
      else if (id === 'lasera' || id === 'laserb') { const x0 = X + 4, sg = id === 'lasera' ? 1 : -1; L.lasers.push({ x1: x0 - prop(k,'length',56)*18/56 * sg, y1: gr, x2: x0 + prop(k,'length',56)*18/56 * sg, y2: gr - prop(k,'length',56), cx: x0, cy: gr - prop(k,'length',56)/2, per: prop(k,'period',3.2), ph: 0 }); } else if (id === 'laserh') L.lasers.push({ x1: X + 4 - prop(k,'length',56)/2, y1: Y + 4, x2: X + 4 + prop(k,'length',56)/2, y2: Y + 4, cx: X + 4, cy: Y + 4, per: prop(k,'period',3.2), ph: 0 });
      else if (id === 'tl' || id === 'tr') { g[r][c] = 1; L.turrets.push({ x: id === 'tl' ? X : X + 8, y: Y + 4, dir: id === 'tl' ? -1 : 1, per: prop(k,'period',2.2), ph: 0, sp: prop(k,'speed',80) }); }
      else if (id === 'mov') L.movers.push({ axis: 'x', c: X + prop(k,'range',32), y: gr, range: prop(k,'range',32), spd: prop(k,'speed',1), ph: 0, w: prop(k,'width',24) }); else if (id === 'lift') L.movers.push({ axis: 'y', c: gr - prop(k,'range',28), x: X, range: prop(k,'range',28), spd: prop(k,'speed',0.9), ph: 1.5, w: prop(k,'width',24) });
      else if (id === 'fan') L.fans.push({ x0: X, x1: X + prop(k,'width',24), y0: gr - prop(k,'height',88), y1: gr }); else if (id === 'wr' || id === 'wl') L.winds.push({ x0: X, x1: X + prop(k,'width',80), y0: Y + 32 - prop(k,'height',96), y1: Y + 32, dir: id === 'wr' ? 1 : -1 });
      else if (id === 'moon') L.moons.push({ x0: X, x1: X + prop(k,'width',80), y0: Y + 32 - prop(k,'height',144), y1: Y + 32 }); else if (id === 'br' || id === 'bl') L.belts.push({ x0: X, x1: X + prop(k,'width',72), y: gr, dir: id === 'br' ? 1 : -1, sp: prop(k,'speed',50) });
    });
    if (!L.goal) L.goal = { x: (b + ox) * 8 + 4, y: (d2 + oy) * 8 - 16 };
    L.cps.sort((p, q) => p.x - q.x); L.cps.unshift(start || L.cps[0] || { x: (a + ox) * 8, y: (c2 + oy) * 8 });
    return L;
  }
