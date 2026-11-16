/* ---------- drawing: fixed 320x180 pixel canvas, nearest-neighbour upscale ---------- */
const CW = VW, CH = VH;
const SKY_N = 14, skyBands = [];
const stars = []; for (let i = 0; i < 250; i++) stars.push([hash2(i, 21) * CW, hash2(i, 22) * CH * 0.75, 0.3 + (i % 4) * 0.2]);
const glow1 = document.createElement('canvas'); glow1.width = CW / 2; glow1.height = CH / 2;
const glow2 = document.createElement('canvas'); glow2.width = CW / 4; glow2.height = CH / 4;
const glow3 = document.createElement('canvas'); glow3.width = CW / 8; glow3.height = CH / 8;
const g1c = glow1.getContext('2d'), g2c = glow2.getContext('2d'), g3c = glow3.getContext('2d');
/* pixel-exact filled shapes, no anti-aliasing */
function pxShape(shape, x, y, w, h) {
  const X = Math.round(x), Y = Math.round(y), Wp = Math.max(1, Math.round(w)), Hp = Math.max(1, Math.round(h));
  if (shape === 'square') { ctx.fillRect(X, Y, Wp, Hp); return; }
  for (let r = 0; r < Hp; r++) {
    const dy = (r + 0.5 - Hp / 2) / (Hp / 2);
    let half;
    if (shape === 'circle') half = Math.sqrt(Math.max(0, 1 - dy * dy)) * Wp / 2;
    else if (shape === 'triangle') half = Wp * (r + 1) / Hp / 2;
    else half = (1 - Math.abs(dy)) * Wp / 2;
    const x0 = Math.round(X + Wp / 2 - half), x1 = Math.round(X + Wp / 2 + half);
    ctx.fillRect(x0, Y + r, Math.max(1, x1 - x0), 1);
  }
}
const SPIRES = []; for (let i = 0; i < 12; i++) SPIRES.push({ x: i * 90 + hash2(i, 1) * 60, h: 26 + hash2(i, 2) * 50, w: 4 + hash2(i, 3) * 7, tint: hash2(i, 4) });
const motes = []; for (let i = 0; i < 100; i++) motes.push({ x: hash2(i, 11), y: hash2(i, 12), pf: [0.3, 0.8, 1.5][i % 3], ph: hash2(i, 14) * 6.28 });
const mod = (a, b) => ((a % b) + b) % b;
const RIDGES = [
  { base: 112, amp: 46, step: 36, seed: 5, par: 0.12, pary: 0.1, col: C.mtn1 },
  { base: 138, amp: 34, step: 28, seed: 9, par: 0.25, pary: 0.18, col: C.mtn2 },
  { base: 162, amp: 22, step: 20, seed: 13, par: 0.4, pary: 0.3, col: C.mtn2, dark: true }
];
function ridgeY(L, wx) {
  const u = wx / L.step, i = Math.floor(u), f = u - i, sm = f * f * (3 - 2 * f);
  const a = hash2(mod(i, 48), L.seed), b = hash2(mod(i + 1, 48), L.seed);
  return L.base - (a + (b - a) * sm) * L.amp;
}
function drawMotes(front) {
  ctx.globalCompositeOperation = 'lighter';
  for (const m of motes) {
    if ((m.pf > 1) !== front) continue;
    const wz = lvl.weather, wt = wz ? wz.dir * (world.time * 0.85 + Math.sin(world.time * 0.6) * 0.25) * 70 * m.pf : 0, wy = Math.abs(wt) * 0.5;
    const px = mod(m.x * CW - cam.x * cam.z * m.pf + Math.sin(world.time * 0.4 + m.ph) * 10 + wt, CW);
    const py = mod(m.y * CH - cam.y * cam.z * m.pf - world.time * 4 * m.pf + (wz ? wy : 0), CH);
    ctx.globalAlpha = 0.25 + 0.3 * (Math.sin(world.time * 1.3 + m.ph * 3) > 0 ? 1 : 0.3);
    ctx.fillStyle = m.ph > 3.4 ? C.crystal : C.spent;
    const sz = m.pf > 1 ? 2 : 1;
    ctx.fillRect(Math.round(px), Math.round(py), sz, sz);
    if (wz) { ctx.fillRect(Math.round(px) - wz.dir * 2, Math.round(py) - 1, sz, sz); ctx.fillRect(Math.round(px) - wz.dir * 4, Math.round(py) - 2, sz, sz); }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

/* SKY WORKSHOP: pixel celestial objects and full-frame galaxy.  Cached textures keep gameplay cheap. */
let galaxyTexture=null;
function skyPixCircle(g,cx,cy,diam,color,alpha=1){
  const r=Math.max(1,diam/2),left=Math.floor(cx-r),right=Math.ceil(cx+r);
  g.fillStyle=color;g.globalAlpha=alpha;
  for(let y=Math.floor(cy-r);y<Math.ceil(cy+r);y++){
    const dy=(y+0.5-cy)/r;if(Math.abs(dy)>=1)continue;
    const half=Math.sqrt(1-dy*dy)*r;
    g.fillRect(Math.round(cx-half),y,Math.max(1,Math.round(2*half)),1);
  }
  g.globalAlpha=1;
}
function galaxyNoise(x,y,seed){
  // Repeatable, soft multi-octave value noise; never uses Math.random per frame.
  const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy;
  const sx=u*u*(3-2*u),sy=v*v*(3-2*v);
  const a=hash2(ix+seed*197,iy),b=hash2(ix+1+seed*197,iy);
  const c=hash2(ix+seed*197,iy+1),d=hash2(ix+1+seed*197,iy+1);
  return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
}
function createGalaxyTexture(w,h,opts){
  const low=document.createElement('canvas');low.width=Math.ceil(w/2);low.height=Math.ceil(h/2);
  const g=low.getContext('2d'),img=g.createImageData(low.width,low.height),p=img.data;
  const a=opts.angle*Math.PI/180,co=Math.cos(a),si=Math.sin(a);
  const cx=low.width*(opts.x/100),cy=low.height*(opts.y/100),sw=opts.galaxyWidth/100,sh=opts.galaxyHeight/100;
  const colors=[opts.primary,opts.secondary,opts.tertiary].map(hexRgb);
  for(let y=0;y<low.height;y++)for(let x=0;x<low.width;x++){
    const nx=(x-cx)/low.width,ny=(y-cy)/low.height;
    const u=nx*co+ny*si,v=-nx*si+ny*co;
    const n1=galaxyNoise(x/14,y/14,2),n2=galaxyNoise(x/31,y/25,3),n3=galaxyNoise(x/5,y/8,7);
    // A wide, sweeping star-cloud across the WHOLE SKY. Width/height control its brighter lane.
    const ripple=Math.sin(u*17+n2*5.1)*0.042+Math.sin(u*29+n1*3.2)*0.018;
    const lane=Math.exp(-Math.pow((v-ripple)/(0.20*sh+0.02),2));
    const wide=Math.exp(-Math.pow((v+0.13)/(0.43*sh+0.03),2));
    const along=Math.exp(-Math.pow(u/(0.58*sw+0.03),4));
    const dust=0.10 + 0.19*n2 + 0.12*n3;
    const detail=Math.max(0,(n1*0.73+n2*0.27)-0.34);
    const density=Math.min(1,(dust+lane*along*(0.34+0.68*detail)+wide*0.14)*(0.83+opts.glow/165));
    const t=Math.max(0,Math.min(1,(u+0.4)*0.9+n2*0.3));
    const c1=t<0.55?colors[0]:colors[1],c2=t<0.55?colors[1]:colors[2],m=t<0.55?t/0.55:(t-0.55)/0.45;
    const i=(y*low.width+x)*4;
    p[i]=Math.round(c1[0]*(1-m)+c2[0]*m);
    p[i+1]=Math.round(c1[1]*(1-m)+c2[1]*m);
    p[i+2]=Math.round(c1[2]*(1-m)+c2[2]*m);
    p[i+3]=Math.round(255*Math.min(.86,density));
  }
  g.putImageData(img,0,0);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const out=canvas.getContext('2d');out.imageSmoothingEnabled=false;
  out.drawImage(low,0,0,w,h);
  return canvas;
}
function renderCelestial(g,w,h,mode,opts,parx=0,pary=0){
  if(mode==='none'||mode==='galaxy')return;
  const x=w*opts.x/100-parx,y=h*opts.y/100-pary,size=opts.size;
  const primary=opts.primary,secondary=opts.secondary,tertiary=opts.tertiary;
  const glow=opts.glow/100;
  function orb(ox,oy,diam,col,halo){
    if(glow){skyPixCircle(g,ox,oy,diam*2.8,halo,glow*.07);skyPixCircle(g,ox,oy,diam*1.8,halo,glow*.14);}
    skyPixCircle(g,ox,oy,diam,col,1);
    skyPixCircle(g,ox-diam*.2,oy-diam*.25,diam*.25,secondary,.20);
  }
  if(mode==='sun'){
    orb(x,y,size,primary,tertiary);
    if(size>=10){g.fillStyle=secondary;g.globalAlpha=.7;g.fillRect(Math.round(x-size*.18),Math.round(y-size*.22),Math.max(1,Math.round(size*.26)),Math.max(1,Math.round(size*.16)));g.globalAlpha=1;}
  }else if(mode==='moon')orb(x,y,size,primary,secondary);
  else if(mode==='multimoon'){
    orb(x,y,size,primary,secondary);
    const count=Math.max(2,Math.min(8,opts.count)),spread=opts.spread;
    for(let i=1;i<count;i++){
      const angle=(i-1)/(count-1)*Math.PI*1.38-Math.PI*.14;
      const dist=spread*(.5+.25*(i%3));
      const ox=x+Math.cos(angle)*dist,oy=y+Math.sin(angle)*dist*.45;
      orb(ox,oy,Math.max(3,size*(.48+.14*(i%3))),i%2?secondary:tertiary,tertiary);
    }
  }
}
function drawGalaxyBackdrop(g,w,h,opts,vx0,vy0,preview=false){
  if(preview){const texture=createGalaxyTexture(w,h,opts);g.drawImage(texture,0,0);return;}
  if(!galaxyTexture)galaxyTexture=createGalaxyTexture(w+72,h+48,opts);
  const srcX=Math.round(36+Math.sin(vx0*.002)*13),srcY=Math.round(24+Math.sin(vy0*.002)*8);
  g.drawImage(galaxyTexture,srcX,srcY,w,h,0,0,w,h);
}

function drawBackdrop(vx0, vy0) {
  if (!skyBands.length) for (let i = 0; i < SKY_N; i++) skyBands.push(mixHex(C.sky1, C.sky2, i / (SKY_N - 1)));
  const bh = Math.ceil(CH / SKY_N);
  for (let i = 0; i < SKY_N; i++) { ctx.fillStyle = skyBands[i]; ctx.fillRect(0, i * bh, CW, bh); }
  if(SKY_FX==='galaxy')drawGalaxyBackdrop(ctx,CW,CH,SKY_CELESTIAL,vx0,vy0);
  ctx.fillStyle = C.star;
  const limit=SKY_FX==='sun'?Math.round(SKY_CELESTIAL.starDensity*.12):SKY_CELESTIAL.starDensity;
  for(let i=0;i<Math.min(stars.length,limit);i++){
    const s=stars[i];
    ctx.globalAlpha=s[2]*(Math.sin(world.time*1.35+s[0])>0.6?0.38:1);
    ctx.fillRect(Math.round(mod(s[0]-vx0*.05,CW)),Math.round(s[1]-vy0*.03),1,1);
  }
  ctx.globalAlpha=1;
  renderCelestial(ctx,CW,CH,SKY_FX,SKY_CELESTIAL,vx0*.04,vy0*.03);
  for (let li = 0; li < RIDGES.length; li++) {
    const L = RIDGES[li];
    if (li === 2) {
      const span = SPIRES.length * 90, base = Math.round(CH * 0.8 - vy0 * 0.3);
      for (const sp of SPIRES) {
        const x = Math.round(mod(sp.x - vx0 * 0.32 + 40, span) - 60);
        if (x < -20 || x > CW + 20) continue;
        ctx.fillStyle = mixHex(C.mtn2, C.sky1, 0.45);
        const top = base - Math.round(sp.h);
        for (let r = top; r < CH; r++) { const half = Math.min(sp.w, 1 + Math.floor((r - top) * sp.w / sp.h)); ctx.fillRect(x - half, r, half * 2, 1); }
        ctx.globalAlpha = Math.sin(world.time * 1.4 + sp.x) > 0 ? 0.9 : 0.35;
        ctx.fillStyle = sp.tint > 0.5 ? C.spring : C.spent; ctx.fillRect(x - 1, top - 2, 2, 2); ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = L.dark ? mixHex(C.mtn2, C.sky1, 0.5) : L.col;
    for (let sx = 0; sx < CW; sx += 2) {
      let y = Math.round(ridgeY(L, sx + vx0 * L.par) - vy0 * L.pary); y -= mod(y, 2);
      ctx.fillRect(sx, y, 2, CH - y);
    }
  }
  ctx.fillStyle = 'rgb(70,45,150)';
  for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.07; ctx.fillRect(0, Math.round(CH * (0.6 + 0.1 * i)), CW, CH); }
  ctx.globalAlpha = 1;
}
