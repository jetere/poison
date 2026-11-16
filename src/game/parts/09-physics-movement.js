/* ---------- movement ---------- */
function moveX(a) {
  pl.rx += a; let m = Math.round(pl.rx); pl.rx -= m;
  const s = Math.sign(m);
  while (m !== 0) {
    if (!hits(pl.x + s, pl.y)) { pl.x += s; m -= s; continue; }
    let done = false;
    if (pl.vy <= 0 && pl.state !== CLIMB) {
      for (let k = 1; k <= P.cornerCorrection; k++) {
        if (!hits(pl.x, pl.y - k) && !hits(pl.x + s, pl.y - k)) { pl.y -= k; done = true; break; }
      }
    }
    if (!done) { pl.vx = 0; pl.rx = 0; break; }
  }
}
function moveY(a) {
  pl.ry += a; let m = Math.round(pl.ry); pl.ry -= m;
  const s = Math.sign(m);
  while (m !== 0) {
    if (!hits(pl.x, pl.y + s)) { pl.y += s; m -= s; continue; }
    let done = false;
    if (s < 0) {
      for (let k = 1; k <= P.cornerCorrection && !done; k++) {
        for (const d of [k, -k]) {
          if (!hits(pl.x + d, pl.y + s) && !hits(pl.x + d, pl.y)) { pl.x += d; done = true; break; }
        }
      }
    }
    if (!done) { pl.vy = 0; pl.ry = 0; if (s < 0) pl.varT = 0; break; }
  }
}
function wobble(a, b) { pl.q = Math.max(-0.75, Math.min(0.85, (b - a) / 2 * P.wobble)); pl.qv = 0; }
function canDash() { return pl.dashes > 0 && pl.dashCD <= 0; }
function startDash() {
  pl.dashes--; pl.dashBuf = 0; pl.dashCD = P.dashCooldown; pl.refillCD = 0.12;
  let dx = pl.moveX, dy = pl.moveY;
  if (dx === 0 && dy === 0) dx = pl.facing;
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
  pl.dashDir = { x: dx, y: dy };
  pl.state = DASH; pl.dashT = P.dashTime; pl.trailT = 0; pl.varT = 0; pl.forceT = 0;
  pl.vx = dx * P.dashSpeed; pl.vy = dy * P.dashSpeed;
  if (dx) pl.facing = Math.sign(dx);
  world.freeze = P.dashFreeze; world.shake = Math.max(world.shake, P.shakeDash); world.shakeX = Math.abs(dx); world.shakeY = Math.abs(dy); cam.punch = 1; SFX.play('dash'); wobble(1 + Math.abs(dx) * 0.5, 1 + Math.abs(dy) * 0.5); cam.kx = -dx * 60; cam.ky = -dy * 45;
  emit(pl.x + 4, pl.y + 4, 8, C.spent, 70, 0.35);
}
function jump() {
  pl.vx += P.jumpHBoost * pl.moveX; pl.vy = -P.jumpSpeed; pl.varT = P.varJumpTime; pl.varSpeed = pl.vy;
  pl.jumpBuf = 0; pl.coyote = 0; wobble(0.75, 1.25); SFX.play('jump');
  emit(pl.x + 4, pl.y + 8, 5, C.top, 40, 0.3);
}
function wallJump(dir) {
  pl.vx = P.wallJumpHSpeed * dir; pl.vy = -P.jumpSpeed; pl.varT = P.varJumpTime; pl.varSpeed = pl.vy;
  pl.forceX = dir; pl.forceT = P.wallJumpForceTime; pl.facing = dir; pl.jumpBuf = 0; pl.coyote = 0;
  pl.slideT = P.wallSlideTime; wobble(0.8, 1.2); SFX.play('wall');
  emit(pl.x + (dir > 0 ? 0 : 8), pl.y + 4, 5, C.top, 40, 0.3);
}
function tryWallJump() {
  const L = hits(pl.x - P.wallJumpCheck, pl.y), R = hits(pl.x + P.wallJumpCheck, pl.y);
  if (!L && !R) return false;
  wallJump(L && R ? -pl.facing : (R ? -1 : 1));
  return true;
}

function updateNormal(dt) {
  const fm = pl.forceT > 0 ? pl.forceX : pl.moveX;
  if (fm !== 0) pl.facing = fm;
  const wallF = pl.facing > 0 ? pl.wallR : pl.wallL;
  if (pl.dashBuf > 0 && canDash()) { startDash(); return; }
  if (false && I.grab && wallF && pl.vy >= 0 && pl.stamina > 0 && pl.moveX !== -pl.facing && pl.forceT <= 0) {
    pl.state = CLIMB; pl.vx = 0; pl.vy = 0; SFX.play('grab'); return;
  }
  const mult = pl.onGround ? 1 : P.airMult;
  if (Math.abs(pl.vx) > P.maxRun && Math.sign(pl.vx) === fm) pl.vx = approach(pl.vx, P.maxRun * fm, P.runReduce * mult * dt);
  else pl.vx = approach(pl.vx, P.maxRun * fm, P.runAccel * mult * dt);

  if (pl.moveY > 0 && pl.vy >= P.maxFall) pl.curMaxFall = approach(pl.curMaxFall, P.fastMaxFall, 300 * dt);
  else pl.curMaxFall = P.maxFall;
  let mf = pl.curMaxFall;
  const sliding = !pl.onGround && pl.moveX === pl.facing && wallF && pl.vy >= 0;
  if (sliding) {
    pl.slideT = Math.max(0, pl.slideT - dt);
    if (pl.sfxT <= 0) { SFX.play('slide'); pl.sfxT = 0.09; }
    mf = lerp(mf, P.wallSlideStart, pl.slideT / P.wallSlideTime);
    if (Math.random() < 0.25) emit(pl.x + (pl.facing > 0 ? 8 : 0), pl.y + 6, 1, C.top, 15, 0.25);
  }
  if (pl.moon) mf = Math.min(mf, 60);
  const gm = ((Math.abs(pl.vy) <= P.halfGravThreshold && I.jump) ? 0.5 : 1) * (pl.moon ? 0.4 : 1);
  pl.vy = approach(pl.vy, mf, P.gravity * gm * dt);
  if (pl.varT > 0) {
    if (I.jump) pl.vy = Math.min(pl.vy, pl.varSpeed); else pl.varT = 0;
    pl.varT = Math.max(0, pl.varT - dt);
  }
  if (pl.jumpBuf > 0) {
    if (pl.coyote > 0) jump(); else tryWallJump();
  }
  moveX(pl.vx * dt); moveY(pl.vy * dt);
}

function updateClimb(dt) {
  if (pl.dashBuf > 0 && canDash()) { startDash(); return; }
  const wallF = pl.facing > 0 ? pl.wallR : pl.wallL;
  if (!I.grab || pl.stamina <= 0) { pl.state = NORMAL; return; }
  if (!wallF) {
    pl.state = NORMAL;
    if (pl.moveY < 0) { pl.vx = pl.facing * 60; pl.vy = -40; }   // hop onto the ledge
    return;
  }
  if (pl.jumpBuf > 0) {
    if (pl.moveX === -pl.facing) { wallJump(-pl.facing); }
    else {
      pl.stamina = Math.max(0, pl.stamina - P.climbJumpCost);
      pl.vx = 0; pl.vy = -P.jumpSpeed; pl.varT = P.varJumpTime; pl.varSpeed = pl.vy; pl.jumpBuf = 0; wobble(0.8, 1.2); SFX.play('jump');
    }
    pl.state = NORMAL; return;
  }
  const target = pl.moveY < 0 ? -P.climbUpSpeed : (pl.moveY > 0 ? P.climbDownSpeed : 0);
  pl.vy = approach(pl.vy, target, 900 * dt); pl.vx = 0;
  pl.stamina -= (pl.moveY < 0 ? P.climbUpCost : (pl.moveY === 0 ? P.climbStillCost : 0)) * dt;
  if (pl.onGround && pl.moveY > 0) { pl.state = NORMAL; return; }
  moveY(pl.vy * dt);
}

function breakNear() {
  const d = pl.dashDir, ex = 5;
  const x0 = Math.floor((pl.x - (d.x < 0 ? ex : 1)) / T), x1 = Math.floor((pl.x + PW - 1 + (d.x > 0 ? ex : 1)) / T);
  const y0 = Math.floor((pl.y - (d.y < 0 ? ex : 1)) / T), y1 = Math.floor((pl.y + PH - 1 + (d.y > 0 ? ex : 1)) / T);
  let n = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (grid[ty] && grid[ty][tx] === 5) { grid[ty][tx] = 0; n++; emit(tx * T + 4, ty * T + 4, 7, C.spent, 110, 0.5); }
  }
  if (n) { SFX.play('break'); world.shake = Math.max(world.shake, 4); world.shakeX = world.shakeY = 1; world.freeze = Math.max(world.freeze, 0.03); wobble(0.8, 1.25); }
}
function updateDash(dt) {
  pl.dashT -= dt; breakNear();
  if (V.trail && (pl.trailT -= dt) <= 0) { pl.trailT = 0.03; ghosts.push({ x: pl.x, y: pl.y, life: 0.25, c: bodyColor() }); }
  if (Math.random() < 0.6) emit(pl.x + 4, pl.y + 4, 1, C.spent, 25, 0.3);
  if (pl.jumpBuf > 0) {
    const d = pl.dashDir;
    if (pl.onGround || pl.coyote > 0) {
      pl.state = NORMAL; pl.jumpBuf = 0; pl.coyote = 0;
      if (d.y > 0 && d.x !== 0) {
        pl.facing = Math.sign(d.x); pl.vx = pl.facing * P.hyperJumpSpeed; pl.vy = -P.jumpSpeed * 0.5; pl.varT = 0;
        wobble(1.4, 0.7); world.shake = Math.max(world.shake, 3); world.shakeX = world.shakeY = 1; SFX.play('super', 1.5); emit(pl.x + 4, pl.y + 8, 10, C.ready, 90, 0.35);
      } else if (d.x !== 0 && d.y === 0) {
        pl.facing = Math.sign(d.x); pl.vx = pl.facing * P.superJumpSpeed; pl.vy = -P.jumpSpeed; pl.varT = P.varJumpTime; pl.varSpeed = pl.vy;
        wobble(0.8, 1.3); emit(pl.x + 4, pl.y + 8, 8, C.ready, 70, 0.35); SFX.play('super', 1);
      } else { jump(); }
      moveX(pl.vx * dt); moveY(pl.vy * dt); return;
    }
    if (tryWallJump()) { pl.state = NORMAL; moveX(pl.vx * dt); moveY(pl.vy * dt); return; }
  }
  if (pl.dashT <= 0) {
    const d = pl.dashDir;
    pl.state = NORMAL; pl.vx = d.x * P.endDashSpeed; pl.vy = d.y * P.endDashSpeed;
    wobble(1 - Math.abs(d.x) * 0.25, 1 - Math.abs(d.y) * 0.25);
    if (d.y < 0) pl.vy *= 0.75;
  }
  moveX(pl.vx * dt); moveY(pl.vy * dt);
}

function hazard() {
  const x0 = Math.floor(pl.x / T), x1 = Math.floor((pl.x + PW - 1) / T), y0 = Math.floor(pl.y / T), y1 = Math.floor((pl.y + PH - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (grid[ty] && grid[ty][tx] === 2) {
      const sx = tx * T, sy = ty * T + 4;
      if (pl.x < sx + T && pl.x + PW > sx && pl.y < sy + 4 && pl.y + PH > sy) return true;
    }
  }
  return pl.y > H + 16;
}
function die() {
  if (pl.dead) return;
  stats.deaths++; pl.dead = true; pl.deadT = 0.5; SFX.play('death'); SFX.music.duck(); world.freeze = 0.06; world.shake = 5; world.shakeX = world.shakeY = 1;
  emit(pl.x + 4, pl.y + 4, 22, bodyColor(), 130, 0.6);
}

const prox = (x, y, r) => Math.max(0, 1 - Math.hypot(x - (pl.x + 4), y - (pl.y + 4)) / r);
const crossed = (a, b, th) => a <= b ? (a < th && b >= th) : (a < th || b >= th);
function obstacleFx(dt) {
  let vt = 0;
  fx.sawT -= dt; fx.fanT -= dt; fx.windT -= dt; fx.moonT -= dt; fx.beltT -= dt; fx.humT -= dt;
  // crushers: warning tick, slam with shake and dust, servo on the way up
  for (const c of lvl.crushers) {
    const p = ((world.time + c.ph) / c.per) % 1, q = c._p === undefined ? p : c._p; c._p = p;
    const k = prox(c.x + c.w / 2, c.ground - 14, 150);
    if (crossed(q, p, 0.45)) SFX.play('warnTick', k);
    if (crossed(q, p, 0.55) && k > 0.05) { SFX.play('whoosh', k * 0.7); }
    if (crossed(q, p, 0.6)) {
      SFX.play('slam', k); if (k > 0.03) { world.shake = Math.max(world.shake, 8 * k); world.shakeX = 0.4; world.shakeY = 1; }
      for (let i = 0; i < 7; i++) emit(c.x + Math.random() * c.w, c.ground - 1, 1, C.spent, 55, 0.45);
      if (k > 0.35) vt = Math.max(vt, 0.35 * k);
    }
    if (crossed(q, p, 0.72)) SFX.play('servo', k * 0.6);
    if (p > 0.45 && p < 0.55 && k > 0.2) vt = Math.max(vt, 0.18 * k);
  }
  // lasers: warning beeps, zap and red vignette while on
  for (const l of lvl.lasers) {
    const p = laserPh(l), q = l._p === undefined ? p : l._p; l._p = p;
    const k = prox(l.cx, l.cy, 120), on = p >= 0.55 && p < 0.8;
    if (crossed(q, p, 0.4)) SFX.play('laserWarn', k);
    if (crossed(q, p, 0.55)) { SFX.play('zap', k); if (k > 0.05) { world.shake = Math.max(world.shake, 2.5 * k); fx.vig = Math.max(fx.vig, 0.95 * k + 0.05); for (let i = 0; i < 6; i++) emit(l.x2, l.y2, 1, C.hazard, 60, 0.3); } }
    if (on) { if (k > 0.02) vt = Math.max(vt, 0.25 + 0.75 * k); if (fx.humT <= 0 && k > 0.03) { SFX.play('laserHum', k); fx.humT = 0.13; } if (k > 0.3 && Math.random() < 0.15) { const u = Math.random(); emit(l.x1 + (l.x2 - l.x1) * u, l.y1 + (l.y2 - l.y1) * u, 1, C.hazard, 25, 0.2); } }
    else if (p >= 0.4 && p < 0.55 && Math.floor(world.time * 16) % 2 === 0) vt = Math.max(vt, 0.3 * k);
  }
  // saws: buzz that scales with distance, sparks and a faint red edge when very close
  let sk = 0, near = 1e9;
  for (const sw of lvl.saws) {
    const [sx, sy] = sawPos(sw), d = Math.hypot(sx - pl.x - 4, sy - pl.y - 4);
    sk = Math.max(sk, Math.max(0, 1 - d / 95)); near = Math.min(near, d);
    if (sw.axis === 'p') { const v = Math.sin(world.time * sw.spd + sw.ph), pv = sw._s === undefined ? v : sw._s; sw._s = v; if ((pv < 0) !== (v < 0)) SFX.play('whoosh', Math.max(0, 1 - Math.hypot(sx - pl.x - 4, sy - pl.y - 4) / 120)); }
  }
  if (sk > 0.04 && fx.sawT <= 0) { SFX.play('saw', sk); fx.sawT = 0.11; }
  if (near < 24) { vt = Math.max(vt, 0.3 * (1 - near / 24)); if (Math.random() < 0.5) emit(pl.x + 4, pl.y + 4, 1, C.star, 70, 0.25); }
  // falling stalactites: dripping chime and thud with a little shake
  for (const dr of drips) {
    const k = prox(dr.x, dr.ground - 20, 120);
    if (dr._s !== dr.st) {
      if (dr.st === 1) SFX.play('drip', k);
      if (dr.st === 3) { SFX.play('thud', k); if (k > 0.03) world.shake = Math.max(world.shake, 3.5 * k); }
      dr._s = dr.st;
    }
  }
  // updraft shafts
  for (const fn of lvl.fans) {
    const inside = pl.x + PW > fn.x0 && pl.x < fn.x1 && pl.y + PH > fn.y0 && pl.y < fn.y1;
    const k = inside ? 1 : prox((fn.x0 + fn.x1) / 2, (fn.y0 + fn.y1) / 2, 110) * 0.6;
    if (k > 0.04 && fx.fanT <= 0) { SFX.play('fan', k); fx.fanT = 0.3; }
  }
  // wind
  for (const w of lvl.winds) {
    const inside = pl.x + PW > w.x0 && pl.x < w.x1 && pl.y + PH > w.y0 && pl.y < w.y1;
    const k = inside ? 1 : prox((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, 130) * 0.7;
    if (k > 0.04 && fx.windT <= 0) { SFX.play('wind', k); fx.windT = 0.4; }
  }
  // low gravity bubbles
  if (pl.moon !== fx.wasMoon) { SFX.play(pl.moon ? 'moonIn' : 'moonOut', 1); fx.wasMoon = pl.moon; }
  if (pl.moon && fx.moonT <= 0) { SFX.play('bubble', 0.8); fx.moonT = 0.45; }
  // conveyors
  for (const b of lvl.belts) {
    if (Math.abs(pl.y + PH - b.y) < 0.01 && pl.x + PW > b.x0 && pl.x < b.x1 && fx.beltT <= 0) { SFX.play('belt', 0.8); fx.beltT = 0.14; }
  }
  fx.vig = Math.max(fx.vig, vt);
}
function update(dt) {
  if (I.jumpPress) { pl.jumpBuf = P.jumpBuffer; I.jumpPress = false; }
  if (I.dashPress) { pl.dashBuf = 0.1; I.dashPress = false; }
  if (world.freeze > 0) { world.freeze -= dt; return; }
  if (pl.dead) { pl.deadT -= dt; if (pl.deadT <= 0) { spawn(); SFX.play('respawn'); } return; }
  world.time += dt; stats.time += dt;
  if (lvl.weather) pl.vx += lvl.weather.dir * lvl.weather.str * (0.6 + 0.4 * Math.sin(world.time * 0.6)) * dt;
  for (const m of movers) {
    const standing = Math.abs(pl.y + PH - m.y) < 0.01 && pl.x + PW > m.x && pl.x < m.x + m.w;
    const p = Math.sin(world.time * m.spd + m.ph), ox = m.x, oy = m.y;
    if (m.axis === 'x') m.x = Math.round(m.c + p * m.range); else m.y = Math.round(m.c + p * m.range);
    if (standing !== !!m._on) { m._on = standing; if (standing) { SFX.play('clunk', 0.8); world.shake = Math.max(world.shake, 1); } }
    if (standing && m.axis === 'y' && Math.random() < 0.05) SFX.play('servo', 0.5);
    if (standing) {
      const dx = m.x - ox, dy = m.y - oy;
      if (dx && !hits(pl.x + dx, pl.y)) pl.x += dx;
      if (dy) pl.y += dy;
    }
  }
  for (const b of lvl.belts) {
    if (Math.abs(pl.y + PH - b.y) < 0.01 && pl.x + PW > b.x0 && pl.x < b.x1 && pl.state !== DASH) {
      pl.bx = (pl.bx || 0) + b.dir * b.sp * dt; const m = Math.trunc(pl.bx); pl.bx -= m;
      if (m && !hits(pl.x + m, pl.y)) pl.x += m;
      if (Math.random() < 0.08) emit(pl.x + 4, pl.y + 8, 1, C.spent, 20, 0.25);
    }
  }
  pl.moon = false;
  for (const w of lvl.winds) {
    if (pl.state !== DASH && !pl.onGround && pl.x + PW > w.x0 && pl.x < w.x1 && pl.y + PH > w.y0 && pl.y < w.y1) {
      pl.wx = (pl.wx || 0) + w.dir * 48 * dt; const m = Math.trunc(pl.wx); pl.wx -= m;
      if (m && !hits(pl.x + m, pl.y)) pl.x += m;
      if (Math.random() < 0.15) emit(pl.x - w.dir * 6, pl.y + 4, 1, C.crystal, 30, 0.25);
    }
  }
  for (const m of lvl.moons) {
    if (pl.x + PW > m.x0 && pl.x < m.x1 && pl.y + PH > m.y0 && pl.y < m.y1) { pl.moon = true; if (Math.random() < 0.1) emit(pl.x + 4, pl.y + 8, 1, C.star, 18, 0.5); }
  }
  obstacleFx(dt); puzzleUpdate(dt); turretUpdate(dt); markSeen();
  pl.moveX = I.right - I.left; pl.moveY = I.down - I.up; pl.preVy = pl.vy;
  pl.jumpBuf = Math.max(0, pl.jumpBuf - dt); pl.dashBuf = Math.max(0, pl.dashBuf - dt);
  pl.coyote = Math.max(0, pl.coyote - dt); pl.dashCD = Math.max(0, pl.dashCD - dt);
  pl.refillCD = Math.max(0, pl.refillCD - dt); pl.forceT = Math.max(0, pl.forceT - dt); pl.sfxT -= dt;

  const was = pl.onGround;
  pl.onGround = hits(pl.x, pl.y + 1);
  pl.wallL = hits(pl.x - 1, pl.y); pl.wallR = hits(pl.x + 1, pl.y);
  if (!was && pl.onGround && pl.preVy > 70) { cam.ky = -Math.min(40, pl.preVy * 0.16); SFX.play('land', Math.min(1, pl.preVy / 220)); wobble(1.3, 0.7); emit(pl.x + 4, pl.y + 8, 5, C.top, 35, 0.3); }
  if (pl.onGround) { pl.coyote = P.coyote; pl.slideT = P.wallSlideTime; }
  if (pl.onGround && pl.state !== DASH && pl.refillCD <= 0) { if (pl.dashes < P.maxDashes) SFX.play('refill'); pl.dashes = P.maxDashes; pl.stamina = P.maxStamina; }
  pl.dashes = Math.min(pl.dashes, P.maxDashes); pl.stamina = Math.min(pl.stamina, P.maxStamina);

  for (const sp of springs) {
    sp.comp = Math.max(0, sp.comp - dt * 5);
    const sx = sp.tx * T, sy = sp.ty * T + 3;
    if (pl.x + PW > sx + 1 && pl.x < sx + T - 1 && pl.y + PH > sy && pl.y + PH < sy + 7 && pl.vy >= 0 && sp.comp <= 0.2) {
      pl.state = NORMAL; pl.vy = -P.springSpeed; pl.vx *= 0.9; pl.varT = 0; pl.jumpBuf = 0; pl.coyote = 0;
      pl.dashes = P.maxDashes; wobble(0.7, 1.4); sp.comp = 1; world.shake = Math.max(world.shake, 1.5);
      emit(sx + 4, sy + 2, 8, C.spring, 60, 0.35); SFX.play('spring');
    }
  }
  const fy = Math.floor((pl.y + PH) / T);
  for (const cb of crumbs) {
    if (cb.st === 0) {
      if (pl.onGround && cb.ty === fy && pl.x + PW > cb.tx * T && pl.x < cb.tx * T + T) { cb.st = 1; cb.t = P.crumbleDelay; SFX.play('tick'); }
    } else if (cb.st === 1) {
      cb.t -= dt;
      if (Math.random() < 0.3) emit(cb.tx * T + Math.random() * T, cb.ty * T + T, 1, C.top, 20, 0.3);
      if (cb.t <= 0) { cb.st = 2; cb.t = P.crumbleRespawn; cb.fall = 0; grid[cb.ty][cb.tx] = 0; emit(cb.tx * T + 4, cb.ty * T + 4, 6, C.top, 50, 0.4); SFX.play('crumble'); }
    } else {
      cb.t -= dt; cb.fall += dt;
      if (cb.t <= 0 && !(pl.x + PW > cb.tx * T && pl.x < cb.tx * T + T && pl.y + PH > cb.ty * T && pl.y < cb.ty * T + T)) { cb.st = 0; grid[cb.ty][cb.tx] = 4; }
    }
  }
  for (const q of gemList) {
    if (!q.got && Math.abs(pl.x + 4 - q.x) < 9 && Math.abs(pl.y + 4 - q.y) < 9) { q.got = true; stats.gems++; emit(q.x, q.y, 12, C.gem, 80, 0.5); SFX.play('gem'); }
  }
  for (const fn of lvl.fans) {
    if (pl.state !== DASH && pl.x + PW > fn.x0 && pl.x < fn.x1 && pl.y + PH > fn.y0 && pl.y < fn.y1) {
      if (pl.vy > -85) pl.vy = Math.max(-85, pl.vy - 2300 * dt);
      pl.onGround = false;
      if (Math.random() < 0.25) emit(fn.x0 + Math.random() * (fn.x1 - fn.x0), pl.y + 6, 1, C.crystal, 25, 0.3);
    }
  }
  if (!pl.dead) for (const sw of lvl.saws) {
    const [sx, sy] = sawPos(sw);
    if (Math.abs(pl.x + 4 - sx) < 8 && Math.abs(pl.y + 4 - sy) < 8) { die(); break; }
  }
  if (!pl.dead) for (const l of lvl.lasers) {
    const p = laserPh(l);
    if (p >= 0.55 && p < 0.8 && segDist(pl.x + 4, pl.y + 4, l) < 5.2) { die(); break; }
  }
  if (!pl.dead) for (const dr of drips) {
    if (dr.st === 0) { if (Math.abs(pl.x + 4 - dr.x) < 10 && pl.y > dr.y0 && pl.y < dr.ground) { dr.st = 1; dr.t = 0.45; } }
    else if (dr.st === 1) { dr.t -= dt; if (dr.t <= 0) { dr.st = 2; dr.vy = 0; } }
    else if (dr.st === 2) {
      dr.vy += 700 * dt; dr.y += dr.vy * dt;
      if (pl.x + PW > dr.x - 3 && pl.x < dr.x + 3 && pl.y < dr.y + 8 && pl.y + PH > dr.y) { die(); break; }
      if (dr.y + 8 >= dr.ground) { dr.st = 3; dr.t = 2.5; emit(dr.x, dr.ground - 2, 8, C.spent, 80, 0.4); SFX.play('crumble'); }
    } else { dr.t -= dt; if (dr.t <= 0) { dr.st = 0; dr.y = dr.y0; } }
  }
  if (!pl.dead) for (const c of lvl.crushers) {
    const bot = c.ground - crushLift(c);
    if (pl.x + PW > c.x + 1 && pl.x < c.x + c.w - 1 && pl.y < bot && pl.y + PH > bot - 20) { die(); break; }
  }

  if (pl.onGround) {
    for (const c of lvl.cps) {
      if (c !== cp && Math.abs(pl.x - c.x) < 12 && Math.abs(pl.y - c.y) <= 12) { cp = c; SFX.play('checkpoint'); emit(c.x + 4, c.y + 6, 8, C.crystal, 50, 0.4); }
    }
  }
  if (lvl.goal && Math.abs(pl.x + 4 - lvl.goal.x) < 9 && Math.abs(pl.y + 4 - (lvl.goal.y + 10)) < 14) { nextLevel(); return; }

  if (pl.state === DASH) updateDash(dt);
  else if (pl.state === CLIMB) updateClimb(dt);
  else updateNormal(dt);
  if (pl.state === NORMAL && pl.onGround && Math.abs(pl.vx) > 40 && pl.sfxT <= 0) { SFX.play('step'); pl.sfxT = 0.3 - Math.min(1, Math.abs(pl.vx) / 130) * 0.12; }
  else if (pl.state === CLIMB && Math.abs(pl.vy) > 10 && pl.sfxT <= 0) { SFX.play('tick'); pl.sfxT = 0.24; }

  pl.qv += (-420 * pl.q - P.wobbleDamp * pl.qv) * dt; pl.q += pl.qv * dt;
  pl.sx = Math.max(0.45, Math.min(1.7, 1 - pl.q)); pl.sy = Math.max(0.45, Math.min(1.7, 1 + pl.q));
  customRuntime.step(dt);
  if (hazard()) die();
}

function updateFx(dt) {
  for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.nd) { p.vx *= 0.94; p.vy *= 0.94; } }
  particles = particles.filter(p => p.life > 0);
  for (const g of ghosts) g.life -= dt;
  ghosts = ghosts.filter(g => g.life > 0);
  world.shake = Math.max(0, world.shake - P.shakeDecay * dt);
  fx.vig = Math.max(0, fx.vig - 2.4 * dt);
}

