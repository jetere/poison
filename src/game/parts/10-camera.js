/* ---------- camera ---------- */
function damp(key, vkey, target, st, dt) {
  const o = 2 / Math.max(0.001, st), x = o * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = cam[key] - target, tmp = (cam[vkey] + o * ch) * dt;
  cam[vkey] = (cam[vkey] - o * tmp) * e;
  cam[key] = target + (ch + tmp) * e;
}
function camTarget() {
  const lx = P.camLook * Math.max(-1, Math.min(1, pl.vx / 120));
  let ly = 0;
  if (pl.vy > 90) ly = P.camLook * 0.9 * Math.min(1, (pl.vy - 90) / 150);
  else if (pl.state === CLIMB || pl.onGround) ly = P.camLook * 0.35 * pl.moveY;
  return { x: pl.x + 4 + lx, y: pl.y + 4 + ly - 6 };
}
function updateCam(dt, snap) {
  const t = camTarget();
  const dist0 = P.camDist * (V.cam ? 1 : 2.2);
  const half = Math.tan(25 * Math.PI / 180) * dist0;
  const hw = half * (CW / CH) * 0.75, hh = half * 0.75;
  const clampX = v => Math.max(Math.min(hw, W / 2), Math.min(Math.max(W - hw, W / 2), v));
  const clampY = v => Math.max(Math.min(hh, H / 2), Math.min(Math.max(H - hh, H / 2), v));
  if (snap) { cam.x = clampX(t.x); cam.y = clampY(t.y); cam.vx = cam.vy = cam.punch = cam.kx = cam.ky = 0; cam.yaw = 0; cam.pitch = 0.14; cam.dist = dist0; cam.fov = 50; cam.roll = 0; return; }
  cam.punch *= Math.exp(-7 * dt); cam.kx *= Math.exp(-4 * dt); cam.ky *= Math.exp(-4 * dt);
  damp('x', 'vx', clampX(t.x), P.camSmooth, dt); damp('y', 'vy', clampY(t.y), P.camSmooth * 1.3, dt);
  cam.x = clampX(cam.x); cam.y = clampY(cam.y);
  /* true 3D rig: the camera orbits, tilts, rolls, dollies and changes field of view around the player */
  const sw = P.camSwing, spd = Math.max(-1, Math.min(1, cam.vx / 160)), fall = Math.max(-0.4, Math.min(1, pl.vy / 220));
  const yawT = -spd * 0.3 * sw + cam.kx * 0.004 * sw + Math.sin(world.time * 0.45) * 0.05 * sw;
  const pitchT = 0.14 + fall * 0.12 * sw + cam.ky * 0.003 * sw + Math.cos(world.time * 0.37) * 0.02 * sw;
  const distT = dist0 * (1 + 0.1 * Math.min(1, Math.hypot(pl.vx, pl.vy) / 250)) * (1 - cam.punch * 0.08);
  const k = 1 - Math.exp(-5 * dt);
  cam.yaw += (yawT - cam.yaw) * k; cam.pitch += (pitchT - cam.pitch) * k; cam.dist += (distT - cam.dist) * k;
  cam.roll += (-spd * 0.05 * sw - cam.roll) * k; cam.fov += (50 - cam.punch * 5 - cam.fov) * k;
}

