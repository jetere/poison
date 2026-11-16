/* ---------- state ---------- */
const fx = { vig: 0, sawT: 0, fanT: 0, windT: 0, moonT: 0, beltT: 0, humT: 0, wasMoon: false };
const world = { freeze: 0, shake: 0, shakeX: 1, shakeY: 1, time: 0 };
const cam = { x: W / 2, y: H / 2, z: 1, vx: 0, vy: 0, vz: 0, punch: 0, roll: 0, kx: 0, ky: 0, yaw: 0, pitch: 0.14, dist: 175, fov: 50 };
const pl = {
  x: 0, y: 0, rx: 0, ry: 0, vx: 0, vy: 0, preVy: 0, facing: 1, state: NORMAL,
  dashes: 1, stamina: 110, coyote: 0, jumpBuf: 0, dashBuf: 0, dashCD: 0, refillCD: 0,
  varT: 0, varSpeed: 0, forceT: 0, forceX: 0, slideT: 1.2, dashT: 0, dashDir: { x: 1, y: 0 }, trailT: 0,
  curMaxFall: 160, sfxT: 0, onGround: false, wallL: false, wallR: false, dead: false, deadT: 0,
  sx: 1, sy: 1, q: 0, qv: 0, moveX: 0, moveY: 0
};
let particles = [], ghosts = [];

function spawn() {
  pl.x = cp.x; pl.y = cp.y; pl.rx = pl.ry = 0; pl.vx = pl.vy = 0; pl.preVy = 0;
  pl.facing = 1; pl.state = NORMAL; pl.dashes = P.maxDashes; pl.stamina = P.maxStamina;
  pl.coyote = pl.jumpBuf = pl.dashBuf = pl.dashCD = pl.refillCD = pl.varT = pl.forceT = 0;
  pl.slideT = P.wallSlideTime; pl.curMaxFall = P.maxFall; pl.dead = false; pl.sx = pl.sy = 1; pl.q = pl.qv = 0;
  pl.onGround = true;
  crystals.forEach(c => { c.t = 0; });
}

