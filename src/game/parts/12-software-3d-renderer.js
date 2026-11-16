/* ---------- software 3D renderer: real perspective camera, z-buffer, 320x180 pixels ---------- */
function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mixHex(a, b, t, al) {
  const A = hexRgb(a), B = hexRgb(b);
  return 'rgba(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ',' + (al === undefined ? 1 : al) + ')';
}
function hash2(a, b) { let h = Math.imul(a + 1013, 374761393) ^ Math.imul(b + 7919, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbCache = {};
const rgbOf = h => rgbCache[h] || (rgbCache[h] = hexRgb(h));
function solidAt(tx, ty) {
  if (ty >= ROWS) return false;
  if (tx < 0 || tx >= COLS || ty < 0) return true;
  const v = grid[ty][tx]; return v === 1 || v === 4 || v === 5 || v === 6;
}
const PAL = {}, FOG0 = [0, 0, 0], FOGC = [0, 0, 0], ZT = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], ZG = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
let ZGSRC = [null, null, null, null], ZONE_NAMES = ['', '', '', ''], MOON = [190, 170, 255], MOON2 = [228, 218, 255], SUN = [255, 214, 106], SUN2 = [255, 151, 69], SKY_FX = 'moon', SKY_CELESTIAL=null;
const zoneOf = (x, w) => Math.max(0, Math.min(3, Math.floor(x * 4 / w)));
const LIT = { front: 0.81, back: 0.58, left: 0.73, right: 0.58, top: 0.9, bottom: 0.58 };
const emLit = l => 0.78 + 0.22 * (l - 0.58) / 0.32;
const cl = v => v < 0 ? 0 : (v > 255 ? 255 : v | 0);
const pack = (r, g, b) => (255 << 24) | (cl(b) << 16) | (cl(g) << 8) | cl(r);
function shadeCol(b, lit, ft) {
  let r = b[0] * lit, g = b[1] * lit, bl = b[2] * lit;
  if (ft > 0) { r += (FOGC[0] - r) * ft; g += (FOGC[1] - g) * ft; bl += (FOGC[2] - bl) * ft; }
  return pack(r, g, bl);
}
const ZP = [{}, {}, {}, {}];
const THEMES = [
  { name: 'Dusk Caves', skyFx:'moon', sky1: '#03020a', sky2: '#0e0922', mtn1: '#0f0b25', mtn2: '#0a0719', solid: '#1b1740', top: '#4d45a8', grass: '#3fd9b0',
    zt: [[0, 0, 0], [8, 70, 78], [96, 26, 60], [36, 66, 130]], zg: [null, [150, 230, 90], [255, 130, 170], [190, 225, 255]], zn: ['Dusk Caves', 'Glow Marsh', 'Ember Ridge', 'Frost Spires'] },
  { name: 'Neon Forest', skyFx:'moon', sky1: '#020a06', sky2: '#06201a', mtn1: '#0a2a1d', mtn2: '#06180f', solid: '#123524', top: '#3f9a6a', grass: '#a6ff6a',
    zt: [[0, 0, 0], [70, 70, 0], [0, 80, 80], [90, 30, 100]], zg: [null, [255, 230, 90], [110, 240, 255], [255, 140, 230]], zn: ['Mossy Roots', 'Firefly Glade', 'Teal Hollow', 'Spore Canopy'] },
  { name: 'Crimson Foundry', skyFx:'sun', sky1: '#0a0203', sky2: '#2a0a0c', mtn1: '#2a0c10', mtn2: '#1a0608', solid: '#3a1418', top: '#b0503c', grass: '#ffb347',
    zt: [[0, 0, 0], [100, 45, 0], [110, 10, 50], [70, 0, 100]], zg: [null, [255, 230, 90], [255, 90, 140], [200, 140, 255]], zn: ['Ash Gate', 'Forge Row', 'Magma Walk', 'Cinder Crown'] },
  { name: 'Deep Ocean', skyFx:'moon', sky1: '#01060f', sky2: '#04203a', mtn1: '#052a46', mtn2: '#031a30', solid: '#0f3558', top: '#3f93c8', grass: '#6ff0e0',
    zt: [[0, 0, 0], [0, 80, 70], [50, 40, 130], [110, 40, 100]], zg: [null, [170, 255, 150], [200, 170, 255], [255, 170, 220]], zn: ['Shallows', 'Kelp Maze', 'Abyss Trench', 'Pearl Reef'] },
  { name: 'Candy Void', skyFx:'multimoon', sky1: '#0d0418', sky2: '#2a0f3d', mtn1: '#3a1a55', mtn2: '#25103a', solid: '#4a2a6a', top: '#d68cf0', grass: '#ffd0f0',
    zt: [[0, 0, 0], [110, 70, 0], [0, 100, 100], [130, 40, 80]], zg: [null, [255, 240, 140], [150, 255, 240], [255, 150, 190]], zn: ['Sugar Gate', 'Taffy Hills', 'Mint Void', 'Berry Peak'] },
  { name: 'Ash Monolith', skyFx:'none', sky1: '#050608', sky2: '#14171c', mtn1: '#1d2128', mtn2: '#12151a', solid: '#2a2f38', top: '#9aa6b8', grass: '#cfe0ff',
    zt: [[0, 0, 0], [40, 60, 40], [80, 50, 40], [50, 50, 100]], zg: [null, [190, 255, 170], [255, 200, 150], [190, 200, 255]], zn: ['Grey Steps', 'Moss Slabs', 'Rust Yard', 'Sky Pylons'] }
 ];
const BASE_THEME_COUNT = THEMES.length;
const THEME_STORE = 'poison_custom_palettes_v1';
const CUSTOM_THEMES = new Map();
const THEME_COLOR_KEYS = ['sky1','sky2','mtn1','mtn2','solid','top','grass','hazard','spring','gem','crystal','ready','spent'];
const THEME_SKY_FX = ['moon','sun','none','multimoon','galaxy'];
const CELESTIAL_DEF = Object.freeze({x:72,y:19,size:16,glow:55,count:3,spread:34,galaxyWidth:115,galaxyHeight:115,angle:-24,starDensity:75,primary:'#d8c5ff',secondary:'#71c7ff',tertiary:'#ff96cb'});
const CELESTIAL_RANGES = Object.freeze({x:[0,100],y:[0,100],size:[2,80],glow:[0,100],count:[2,8],spread:[4,100],galaxyWidth:[60,220],galaxyHeight:[50,180],angle:[-85,85],starDensity:[0,200]});
const CELESTIAL_PALETTES = Object.freeze({moon:{primary:'#d8c5ff',secondary:'#b9dcff',tertiary:'#ff9ecd'},sun:{primary:'#ffdb79',secondary:'#fff2b8',tertiary:'#ff9b54'},multimoon:{primary:'#d8c5ff',secondary:'#8bd8ff',tertiary:'#ff9cc8'},galaxy:{primary:'#9b63ee',secondary:'#478fea',tertiary:'#f269b2'},none:{primary:'#d8c5ff',secondary:'#8bd8ff',tertiary:'#ff9cc8'}});
function normalizeCelestial(source,mode='moon'){
  const input=source&&typeof source==='object'?source:{};
  const data={...CELESTIAL_DEF,...(CELESTIAL_PALETTES[mode]||{})};
  for(const [k,[lo,hi]] of Object.entries(CELESTIAL_RANGES))if(Number.isFinite(Number(input[k])))data[k]=Math.round(Math.max(lo,Math.min(hi,Number(input[k]))));
  for(const k of ['primary','secondary','tertiary'])if(validHex(input[k]))data[k]=input[k].toLowerCase();
  return data;
}
const EXTRA_THEME_DEFAULTS = Object.fromEntries(['hazard','spring','gem','crystal','ready','spent'].map(k=>[k,C[k]]));
const validHex = x => typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x);
const themeColor = (v,d) => validHex(v) ? v.toLowerCase() : d;
function normalizeTheme(data, fallback=THEMES[0]) {
  const source = data && typeof data === 'object' ? data : {};
  const base = fallback && typeof fallback === 'object' ? fallback : THEMES[0];
  const out = {name: String(source.name || base.name || 'My Palette').slice(0,34).trim() || 'My Palette'};
  out.skyFx = THEME_SKY_FX.includes(source.skyFx) ? source.skyFx : (THEME_SKY_FX.includes(base.skyFx) ? base.skyFx : 'moon');
  out.celestial=normalizeCelestial(source.celestial||base.celestial,out.skyFx);
  for (const k of THEME_COLOR_KEYS) out[k]=themeColor(source[k],base[k] || EXTRA_THEME_DEFAULTS[k] || '#ffffff');
  out.zt=(Array.isArray(source.zt)?source.zt:base.zt).slice(0,4).map((a,i)=>{
    const fb=base.zt[i] || [0,0,0];
    return Array.isArray(a) && a.length>=3 ? a.slice(0,3).map((n,j)=>Number.isFinite(n)?Math.round(Math.min(255,Math.max(0,n))):fb[j]):fb.slice();
  });
  while(out.zt.length<4)out.zt.push([0,0,0]);
  out.zg=(Array.isArray(source.zg)?source.zg:base.zg).slice(0,4).map((a,i)=>{
    const fb=(base.zg && base.zg[i]) || [140,180,225];
    return !i ? null : Array.isArray(a) && a.length>=3 ? a.slice(0,3).map((n,j)=>Number.isFinite(n)?Math.round(Math.min(255,Math.max(0,n))):fb[j]):fb.slice();
  });
  while(out.zg.length<4)out.zg.push([140,180,225]);
  out.zn=(Array.isArray(source.zn)?source.zn:base.zn).slice(0,4).map((n,i)=>String(n || (base.zn||[])[i] || 'Zone '+(i+1)).slice(0,32));
  while(out.zn.length<4)out.zn.push('Zone '+(out.zn.length+1));
  return out;
}
function importCustomTheme(id, data) {
  if(typeof id !== 'string' || !/^custom:[a-z0-9_-]{3,48}$/i.test(id)) return false;
  if(CUSTOM_THEMES.size >= 60 && !CUSTOM_THEMES.has(id)) return false;
  CUSTOM_THEMES.set(id, normalizeTheme(data));
  return true;
}
function saveCustomThemes() {
  try {localStorage.setItem(THEME_STORE,JSON.stringify([...CUSTOM_THEMES]));return true;} catch(e) {return false;}
}
try {
  const stored=JSON.parse(localStorage.getItem(THEME_STORE)||'[]');
  if(Array.isArray(stored))for(const ent of stored.slice(0,60))if(Array.isArray(ent))importCustomTheme(ent[0],ent[1]);
} catch(e){}
function themeFor(choice) {
  if (typeof choice==='string' && CUSTOM_THEMES.has(choice)) return CUSTOM_THEMES.get(choice);
  if(Number.isInteger(choice) && choice>=0 && choice<BASE_THEME_COUNT) return THEMES[choice];
  return THEMES[0];
}
let activeThemeName=THEMES[0].name;
let themeIdx = 0;
function rebuildPalette() {
  Object.assign(PAL, {
    solid: hexRgb(C.solid), top: hexRgb(C.top), grass: hexRgb(C.grass), spring: hexRgb(C.spring), hazard: hexRgb(C.hazard),
    crystal: hexRgb(C.crystal), enemy: hexRgb('#ff2638'), enemyDim: hexRgb('#6e1320'), star: hexRgb(C.star), ink: hexRgb(C.ink), ready: hexRgb(C.ready), spent: hexRgb(C.spent),
    sky1: hexRgb(C.sky1), sky2: hexRgb(C.sky2), gem: hexRgb(C.gem)
  });
  PAL.solid = mixRgb(PAL.solid, PAL.top, 0.2); PAL.solid2 = mixRgb(PAL.solid, PAL.top, 0.16); PAL.topFace = mixRgb(PAL.grass, PAL.solid, 0.4);
  PAL.speck = mixRgb(PAL.solid, PAL.top, 0.4); PAL.crumb = mixRgb(PAL.solid, PAL.top, 0.45);
  PAL.prop = mixRgb(PAL.sky2, [0, 0, 0], 0.2); PAL.fg = mixRgb(PAL.sky2, PAL.solid, 0.35);
  FOG0[0] = PAL.sky2[0] * 1.15 + 6; FOG0[1] = PAL.sky2[1] * 1.1 + 4; FOG0[2] = PAL.sky2[2] * 1.2 + 8;
  for (let i = 0; i < 3; i++) FOGC[i] = FOG0[i];
  for (let z = 0; z < 4; z++) {
    ZG[z] = ZGSRC[z] || PAL.grass;
    const solid = z ? mixRgb(PAL.solid, ZT[z], 0.5) : PAL.solid, solid2 = z ? mixRgb(PAL.solid2, ZT[z], 0.5) : PAL.solid2;
    ZP[z] = { solid, solid2, topFace: mixRgb(ZG[z], solid, 0.4), cGrass: shadeCol(ZG[z], LIT.top, 0) };
  }
  skyBands.length = 0; RIDGES[0].col = C.mtn1; RIDGES[1].col = C.mtn2; RIDGES[2].col = C.mtn2;
  MOON = mixRgb(PAL.top, [255, 255, 255], 0.55); MOON2 = mixRgb(PAL.top, [255, 255, 255], 0.85);
  SUN = mixRgb(PAL.gem, [255, 214, 106], 0.55); SUN2 = mixRgb(PAL.gem, [255, 120, 70], 0.28);
}
function setTheme(i) {
  const t = themeFor(i); themeIdx = Number.isInteger(i) ? i : 0; activeThemeName=t.name;
  for(const k of THEME_COLOR_KEYS) C[k]=themeColor(t[k],EXTRA_THEME_DEFAULTS[k] || C[k]);
  for (let z = 0; z < 4; z++) ZT[z] = t.zt[z];
  ZGSRC = t.zg; ZONE_NAMES = t.zn; SKY_FX = THEME_SKY_FX.includes(t.skyFx) ? t.skyFx : 'moon'; SKY_CELESTIAL=normalizeCelestial(t.celestial);
  galaxyTexture=null;
  rebuildPalette();
}
const CHW = CW / 2, CHH = CH / 2;
setTheme(0);
const DB = new Float32Array(CW * CH);
const emImg = mainCtx.createImageData(CW, CH), EU = new Uint32Array(emImg.data.buffer);
const emCanvas = document.createElement('canvas'); emCanvas.width = CW; emCanvas.height = CH;
const emCtx = emCanvas.getContext('2d');
let FU = null;
const RC = { ex: 0, ey: 0, ez: 0, rx: 0, ry: 0, rz: 0, ux: 0, uy: 0, uz: 0, fx: 0, fy: 0, fz: 1, F: 190, fov: 0.87, dist: 175, fogNear: 180, fogSpan: 330 };
function setupRC() {
  const tx = cam.x, ty = -cam.y, cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  const sh = V.shake && world.shake > 0 ? world.shake : 0;
  const jx = sh ? (Math.random() - 0.5) * 1.6 * sh * (0.35 + 0.65 * world.shakeX) : 0, jy = sh ? (Math.random() - 0.5) * 1.6 * sh * (0.35 + 0.65 * world.shakeY) : 0;
  const R = RC;
  R.ex = tx + sy * cp * cam.dist + jx; R.ey = ty + sp * cam.dist + jy; R.ez = cy * cp * cam.dist;
  let fx = tx - R.ex, fy = ty - R.ey, fz = -R.ez; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, ry = 0, rz = fx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
  let ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  const cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
  R.rx = rx * cr + ux * sr; R.ry = ry * cr + uy * sr; R.rz = rz * cr + uz * sr;
  R.ux = -rx * sr + ux * cr; R.uy = -ry * sr + uy * cr; R.uz = -rz * sr + uz * cr;
  R.fx = fx; R.fy = fy; R.fz = fz;
  R.fov = cam.fov * Math.PI / 180; R.F = CHH / Math.tan(R.fov / 2); R.dist = cam.dist;
  R.fogNear = cam.dist * 1.06 + 90 + Math.abs(cam.pitch - 0.14) * 400; R.fogSpan = 330;
  const zt = ZT[zoneOf(cam.x, W)];
  for (let i = 0; i < 3; i++) FOGC[i] += (FOG0[i] + zt[i] * 0.4 - FOGC[i]) * 0.04;
}
let PX = 0, PY = 0;
function proj(x, y, z) {
  const R = RC, dx = x - R.ex, dy = y - R.ey, dz = z - R.ez;
  const zv = dx * R.fx + dy * R.fy + dz * R.fz; if (zv < 6) return -1;
  const i = R.F / zv; PX = CHW + (dx * R.rx + dy * R.ry + dz * R.rz) * i; PY = CHH - (dx * R.ux + dy * R.uy + dz * R.uz) * i;
  return zv;
}
function tri(ax, ay, az, bx, by, bz, cx, cy, cz, col, emi, alpha) {
  const R = RC;
  let dx = ax - R.ex, dy = ay - R.ey, dz = az - R.ez;
  const za = dx * R.fx + dy * R.fy + dz * R.fz; if (za < 6) return;
  let i = R.F / za; const sxa = CHW + (dx * R.rx + dy * R.ry + dz * R.rz) * i, sya = CHH - (dx * R.ux + dy * R.uy + dz * R.uz) * i;
  dx = bx - R.ex; dy = by - R.ey; dz = bz - R.ez;
  const zb = dx * R.fx + dy * R.fy + dz * R.fz; if (zb < 6) return;
  i = R.F / zb; const sxb = CHW + (dx * R.rx + dy * R.ry + dz * R.rz) * i, syb = CHH - (dx * R.ux + dy * R.uy + dz * R.uz) * i;
  dx = cx - R.ex; dy = cy - R.ey; dz = cz - R.ez;
  const zc = dx * R.fx + dy * R.fy + dz * R.fz; if (zc < 6) return;
  i = R.F / zc; const sxc = CHW + (dx * R.rx + dy * R.ry + dz * R.rz) * i, syc = CHH - (dx * R.ux + dy * R.uy + dz * R.uz) * i;
  const minX = Math.max(0, Math.floor(Math.min(sxa, sxb, sxc))), maxX = Math.min(CW - 1, Math.ceil(Math.max(sxa, sxb, sxc)));
  const minY = Math.max(0, Math.floor(Math.min(sya, syb, syc))), maxY = Math.min(CH - 1, Math.ceil(Math.max(sya, syb, syc)));
  if (minX > maxX || minY > maxY) return;
  const area = (sxb - sxa) * (syc - sya) - (sxc - sxa) * (syb - sya); if (area > -1e-9 && area < 1e-9) return;
  const inv = 1 / area;
  const A0 = (syb - syc) * inv, B0 = (sxc - sxb) * inv, C0 = (sxb * syc - sxc * syb) * inv;
  const A1 = (syc - sya) * inv, B1 = (sxa - sxc) * inv, C1 = (sxc * sya - sxa * syc) * inv;
  const iza = 1 / za, izb = 1 / zb, izc = 1 / zc;
  let cr = 0, cg = 0, cb = 0;
  if (alpha < 1) { cr = col & 255; cg = (col >> 8) & 255; cb = (col >> 16) & 255; }
  for (let y = minY; y <= maxY; y++) {
    let w0 = A0 * (minX + 0.5) + B0 * (y + 0.5) + C0, w1 = A1 * (minX + 0.5) + B1 * (y + 0.5) + C1;
    const row = y * CW;
    for (let x = minX; x <= maxX; x++, w0 += A0, w1 += A1) {
      const w2 = 1 - w0 - w1;
      if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
      const iz = w0 * iza + w1 * izb + w2 * izc, idx = row + x;
      if (iz <= DB[idx]) continue;
      if (alpha >= 1) { DB[idx] = iz; FU[idx] = col; EU[idx] = emi ? col : 0; }
      else {
        const d = FU[idx], a = alpha, ia = 1 - alpha;
        FU[idx] = pack((d & 255) * ia + cr * a, ((d >> 8) & 255) * ia + cg * a, ((d >> 16) & 255) * ia + cb * a);
        if (emi && alpha > 0.3) EU[idx] = col;
      }
    }
  }
}
function quad(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, col, emi, alpha) {
  tri(ax, ay, az, bx, by, bz, cx, cy, cz, col, emi, alpha); tri(ax, ay, az, cx, cy, cz, dx, dy, dz, col, emi, alpha);
}
function fogOf(cx, cy, cz, emi) {
  const R = RC, zc = (cx - R.ex) * R.fx + (cy - R.ey) * R.fy + (cz - R.ez) * R.fz;
  let ft = (zc - R.fogNear) / R.fogSpan; ft = ft <= 0 ? 0 : (ft >= 1 ? 1 : Math.round(ft * 6) / 6);
  return emi ? ft * 0.6 : ft;
}
/* axis-aligned box in y-up world space; mask bits: 1 front, 2 back, 4 left, 8 right, 16 top, 32 bottom */
function drawBox(x0, y0, z0, x1, y1, z1, base, emi, alpha, mask, topCol) {
  const ft = fogOf((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, emi), R = RC;
  const L = emi ? emLit : (l => l), a = alpha === undefined ? 1 : alpha;
  if ((mask & 1) && R.ez > z1) quad(x0, y1, z1, x1, y1, z1, x1, y0, z1, x0, y0, z1, shadeCol(base, L(LIT.front), ft), emi, a);
  if ((mask & 2) && R.ez < z0) quad(x1, y1, z0, x0, y1, z0, x0, y0, z0, x1, y0, z0, shadeCol(base, L(LIT.back), ft), emi, a);
  if ((mask & 4) && R.ex < x0) quad(x0, y1, z0, x0, y1, z1, x0, y0, z1, x0, y0, z0, shadeCol(base, L(LIT.left), ft), emi, a);
  if ((mask & 8) && R.ex > x1) quad(x1, y1, z1, x1, y1, z0, x1, y0, z0, x1, y0, z1, shadeCol(base, L(LIT.right), ft), emi, a);
  if ((mask & 16) && R.ey > y1) quad(x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1, shadeCol(topCol || base, L(LIT.top), ft), emi, a);
  if ((mask & 32) && R.ey < y0) quad(x0, y0, z1, x1, y0, z1, x1, y0, z0, x0, y0, z0, shadeCol(base, L(LIT.bottom), ft), emi, a);
}
/* small convex meshes (crystals, round player shapes) */
function buildMesh(v, f) {
  const faces = f.map(t => {
    const a = v[t[0]], b = v[t[1]], c = v[t[2]];
    const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
    const m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    return (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) ? [t[0], t[2], t[1]] : t;
  });
  return { v, f: faces };
}
const MESH = {};
MESH.diamond = buildMesh([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
  [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [0, 4, 3], [4, 1, 3], [1, 5, 3], [5, 0, 3]]);
MESH.triangle = buildMesh([[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1, 0]],
  [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 3, 2], [0, 2, 1]]);
(function () {
  const v = [[0, 1, 0], [0, -1, 0]], f = [], rings = 4, seg = 8;
  for (let r = 1; r <= rings; r++) { const a = Math.PI * r / (rings + 1); for (let s = 0; s < seg; s++) { const b = 2 * Math.PI * s / seg; v.push([Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)]); } }
  const id = (r, s) => 2 + (r - 1) * seg + (s % seg);
  for (let s = 0; s < seg; s++) { f.push([0, id(1, s), id(1, s + 1)]); f.push([1, id(rings, s + 1), id(rings, s)]); }
  for (let r = 1; r < rings; r++) for (let s = 0; s < seg; s++) { f.push([id(r, s), id(r + 1, s), id(r + 1, s + 1)]); f.push([id(r, s), id(r + 1, s + 1), id(r, s + 1)]); }
  MESH.circle = buildMesh(v, f);
})();
const LD = [-0.352, 0.755, 0.553], WV = [];
function drawMesh(M, cx, cy, cz, sx, sy, sz, rot, base, emi, alpha) {
  const co = Math.cos(rot), si = Math.sin(rot), R = RC, ft = fogOf(cx, cy, cz, emi), n = M.v.length;
  for (let i = 0; i < n; i++) {
    const p = M.v[i], x = p[0] * sx, y = p[1] * sy, z = p[2] * sz, w = WV[i] || (WV[i] = [0, 0, 0]);
    w[0] = cx + x * co + z * si; w[1] = cy + y; w[2] = cz - x * si + z * co;
  }
  const a = alpha === undefined ? 1 : alpha;
  for (const t of M.f) {
    const A = WV[t[0]], B = WV[t[1]], Cc = WV[t[2]];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = Cc[0] - A[0], vy = Cc[1] - A[1], vz = Cc[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    if (nx * (R.ex - A[0]) + ny * (R.ey - A[1]) + nz * (R.ez - A[2]) <= 0) continue;
    let lit = 0.58 + 0.42 * Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]); if (emi) lit = emLit(lit);
    tri(A[0], A[1], A[2], B[0], B[1], B[2], Cc[0], Cc[1], Cc[2], shadeCol(base, lit, ft), emi, a);
  }
}

