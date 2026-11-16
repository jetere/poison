/* ---------- HUD ---------- */
const hExtra = { mus: $('h-mus'), prog: $('h-prog'), gems: $('h-gems'), run: $('h-run') };
const hEls = { state: $('h-state'), vx: $('h-vx'), vy: $('h-vy'), pips: $('h-pips'), stam: $('h-stam'), stamN: $('h-stam-n'), flags: $('h-flags') };
let pipCache = '';
let mE = 0.25;
function musicTick(dt) {
  const t = pl.dead ? 0.2 : (pl.state !== NORMAL ? 1 : ((Math.abs(pl.vx) > 30 || !pl.onGround) ? 0.8 : 0.5));
  mE += (t - mE) * Math.min(1, 1.5 * dt);
  SFX.music.setEnergy(mE);
}
function hud() {
  hEls.state.textContent = pl.dead ? 'DEAD' : STATE_NAMES[pl.state];
  hEls.vx.textContent = Math.round(pl.vx);
  hEls.vy.textContent = Math.round(pl.vy);
  let h = ''; for (let i = 0; i < P.maxDashes; i++) h += '<i class="' + (i < pl.dashes ? 'on' : '') + '"></i>';
  if (!P.maxDashes) h = '<span class="v">none</span>';
  if (h !== pipCache) { hEls.pips.innerHTML = h; pipCache = h; }
  const frac = Math.max(0, Math.min(1, pl.stamina / P.maxStamina));
    const f = [];
  if (pl.onGround) f.push('floor'); if (pl.wallL) f.push('wall L'); if (pl.wallR) f.push('wall R');
  hEls.flags.textContent = f.length ? f.join(' + ') : 'air';
  if (lvl.goal) {
    const gx = (lvl.goal.x - pl.x - 4) / 8, gyy = (lvl.goal.y + 8 - pl.y - 4) / 8, ar = ['\u2192', '\u2197', '\u2191', '\u2196', '\u2190', '\u2199', '\u2193', '\u2198'];
    const ix = ((Math.round(Math.atan2(-gyy, gx) / (Math.PI / 4)) % 8) + 8) % 8;
    hExtra.prog.textContent = ar[ix] + ' ' + Math.round(Math.hypot(gx, gyy)) + ' tiles';
  }
  hExtra.gems.textContent = stats.gems + ' / ' + stats.total;
  hExtra.run.textContent = fmtT(stats.time) + ' \u00b7 ' + stats.deaths + ' deaths';
  const mi = SFX.music.info(); if (mi !== hExtra.last) { hExtra.last = mi; hExtra.mus.textContent = mi; }
}

