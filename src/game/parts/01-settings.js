/* ---------- tunable values ---------- */
const GROUPS = [
  { title: 'Run', items: [
    { k: 'maxRun', label: 'Top speed', min: 40, max: 220, step: 1, def: 90, unit: 'px/s' },
    { k: 'runAccel', label: 'Acceleration', min: 100, max: 3000, step: 10, def: 1000, unit: 'px/s²' },
    { k: 'runReduce', label: 'Overspeed decay', min: 50, max: 2000, step: 10, def: 400, unit: 'px/s²' },
    { k: 'airMult', label: 'Air control', min: 0.1, max: 1.5, step: 0.01, def: 0.65, unit: '×' }
  ]},
  { title: 'Jump and gravity', items: [
    { k: 'gravity', label: 'Gravity', min: 200, max: 2000, step: 10, def: 900, unit: 'px/s²' },
    { k: 'maxFall', label: 'Max fall speed', min: 60, max: 400, step: 5, def: 160, unit: 'px/s' },
    { k: 'fastMaxFall', label: 'Fast fall speed', min: 100, max: 500, step: 5, def: 240, unit: 'px/s' },
    { k: 'jumpSpeed', label: 'Jump speed', min: 50, max: 220, step: 1, def: 105, unit: 'px/s' },
    { k: 'varJumpTime', label: 'Jump hold time', min: 0.05, max: 0.5, step: 0.01, def: 0.2, unit: 's' },
    { k: 'jumpHBoost', label: 'Jump horizontal boost', min: 0, max: 100, step: 1, def: 40, unit: 'px/s' },
    { k: 'halfGravThreshold', label: 'Apex float threshold', min: 0, max: 100, step: 1, def: 40, unit: 'px/s' },
    { k: 'coyote', label: 'Coyote time', min: 0, max: 0.3, step: 0.01, def: 0.1, unit: 's' },
    { k: 'jumpBuffer', label: 'Jump buffer', min: 0, max: 0.3, step: 0.01, def: 0.1, unit: 's' },
    { k: 'cornerCorrection', label: 'Corner correction', min: 0, max: 8, step: 1, def: 4, unit: 'px' }
  ]},
  { title: 'Dash', items: [
    { k: 'maxDashes', label: 'Dashes available', min: 0, max: 3, step: 1, def: 1, unit: '' },
    { k: 'dashSpeed', label: 'Dash speed', min: 100, max: 500, step: 5, def: 240, unit: 'px/s' },
    { k: 'dashTime', label: 'Dash duration', min: 0.05, max: 0.4, step: 0.01, def: 0.15, unit: 's' },
    { k: 'endDashSpeed', label: 'Speed after dash', min: 40, max: 300, step: 5, def: 160, unit: 'px/s' },
    { k: 'dashCooldown', label: 'Dash cooldown', min: 0, max: 0.6, step: 0.01, def: 0.2, unit: 's' },
    { k: 'dashFreeze', label: 'Dash freeze frame', min: 0, max: 0.15, step: 0.005, def: 0.05, unit: 's' },
    { k: 'superJumpSpeed', label: 'Super jump speed', min: 100, max: 450, step: 5, def: 260, unit: 'px/s' },
    { k: 'hyperJumpSpeed', label: 'Hyper jump speed', min: 150, max: 550, step: 5, def: 325, unit: 'px/s' }
  ]},
  { title: 'Wall and climb', items: [
    { k: 'wallJumpCheck', label: 'Wall jump reach', min: 1, max: 8, step: 1, def: 3, unit: 'px' },
    { k: 'wallJumpHSpeed', label: 'Wall jump push', min: 50, max: 250, step: 1, def: 130, unit: 'px/s' },
    { k: 'wallJumpForceTime', label: 'Wall jump lockout', min: 0, max: 0.4, step: 0.01, def: 0.16, unit: 's' },
    { k: 'wallSlideStart', label: 'Wall slide start speed', min: 0, max: 80, step: 1, def: 20, unit: 'px/s' },
    { k: 'wallSlideTime', label: 'Wall slide ramp time', min: 0.2, max: 4, step: 0.1, def: 1.2, unit: 's' },
    { k: 'maxStamina', label: 'Max stamina', min: 20, max: 400, step: 1, def: 110, unit: '' },
    { k: 'climbUpSpeed', label: 'Climb up speed', min: 10, max: 120, step: 1, def: 45, unit: 'px/s' },
    { k: 'climbDownSpeed', label: 'Climb down speed', min: 10, max: 160, step: 1, def: 80, unit: 'px/s' },
    { k: 'climbUpCost', label: 'Climbing cost', min: 0, max: 150, step: 0.5, def: 45.5, unit: '/s' },
    { k: 'climbStillCost', label: 'Hanging cost', min: 0, max: 60, step: 0.5, def: 10, unit: '/s' },
    { k: 'climbJumpCost', label: 'Climb jump cost', min: 0, max: 110, step: 0.5, def: 27.5, unit: '' }
  ]},
  { title: 'Box wobble', items: [
    { k: 'wobble', label: 'Squash and stretch', min: 0, max: 3, step: 0.1, def: 1.8, unit: '\u00d7' },
    { k: 'wobbleDamp', label: 'Wobble damping', min: 2, max: 30, step: 1, def: 8, unit: '' }
  ]},
  { title: 'Level objects', items: [
    { k: 'springSpeed', label: 'Spring launch speed', min: 150, max: 500, step: 5, def: 300, unit: 'px/s' },
    { k: 'crumbleDelay', label: 'Crumble delay', min: 0.1, max: 1.5, step: 0.05, def: 0.4, unit: 's' },
    { k: 'crumbleRespawn', label: 'Crumble respawn', min: 0.5, max: 6, step: 0.1, def: 2.5, unit: 's' }
  ]},
  { title: 'Camera', items: [
    { k: 'camDepth', label: 'Block thickness', min: 4, max: 64, step: 2, def: 24, unit: 'px' },
    { k: 'camSwing', label: '3D orbit amount', min: 0, max: 3, step: 0.1, def: 1.2, unit: '\u00d7' },
    { k: 'camDist', label: 'Camera distance', min: 90, max: 360, step: 5, def: 175, unit: 'px' },
    { k: 'camSmooth', label: 'Follow smoothing', min: 0.02, max: 1, step: 0.01, def: 0.25, unit: 's' },
    { k: 'camLook', label: 'Look-ahead distance', min: 0, max: 80, step: 1, def: 28, unit: 'px' },
    { k: 'shakeDash', label: 'Dash shake strength', min: 0, max: 12, step: 0.5, def: 4, unit: 'px' },
    { k: 'shakeDecay', label: 'Shake fade speed', min: 4, max: 60, step: 1, def: 18, unit: '/s' }
  ]},
  { title: 'World', items: [
    { k: 'timeScale', label: 'Game speed', min: 0.2, max: 1.5, step: 0.05, def: 1, unit: '×' }
  ]}
];
const DEF = {};
GROUPS.forEach(g => g.items.forEach(i => { DEF[i.k] = i.def; }));
const P = Object.assign({}, DEF);
const V = { shape: 'virus', trail: true, shake: true, hit: false, map: true, cam: true, sound: true, volume: 0.6, music: true, musicVol: 0.5, bloom: 0.7, seed: 49, len: 768, theme: 'auto' };
const SHAPES = ['virus', 'square', 'circle', 'triangle', 'diamond'];
const STORE = 'dash-climb-lab-v4';
try {
  const s = JSON.parse(localStorage.getItem(STORE) || '{}');
  if (s.p) for (const k in DEF) if (typeof s.p[k] === 'number' && isFinite(s.p[k])) P[k] = s.p[k];
  if (s.v) {
    if (SHAPES.indexOf(s.v.shape) >= 0 && s.v.shape !== 'square') V.shape = s.v.shape;
    ['trail', 'shake', 'hit', 'cam', 'sound', 'music'].forEach(k => { if (typeof s.v[k] === 'boolean') V[k] = s.v[k]; });
    if (typeof s.v.musicVol === 'number' && s.v.musicVol >= 0 && s.v.musicVol <= 1) V.musicVol = s.v.musicVol;
    if (typeof s.v.volume === 'number' && s.v.volume >= 0 && s.v.volume <= 1) V.volume = s.v.volume;
    if (typeof s.v.bloom === 'number' && s.v.bloom >= 0 && s.v.bloom <= 2) V.bloom = s.v.bloom;
    if (s.v.theme === 'auto' || (Number.isInteger(s.v.theme) && s.v.theme >= 0 && s.v.theme <= 5) || (typeof s.v.theme === 'string' && /^custom:[a-z0-9_-]{3,48}$/i.test(s.v.theme))) V.theme = s.v.theme;
    if (typeof s.v.len === 'number' && s.v.len >= 96 && s.v.len <= 2000) V.len = s.v.len === 320 ? 768 : Math.floor(s.v.len);
    if (typeof s.v.seed === 'number' && s.v.seed >= 1 && s.v.seed <= 999999) V.seed = Math.floor(s.v.seed);
  }
} catch (e) {}
function save() { try { localStorage.setItem(STORE, JSON.stringify({ p: P, v: V })); } catch (e) {} }

