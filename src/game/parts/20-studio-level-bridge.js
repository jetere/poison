  // Generated entities retain their original runtime data while using normal editor selection and history.
  const GENERATED_LISTS=['cps','gems','springs','saws','fans','movers','belts','winds','moons','crushers','lasers','drips','gates','levers','keys','portals','turrets','crystals'];
  for(const group of GENERATED_LISTS){const id='proc_'+group;const item={id,n:group[0].toUpperCase()+group.slice(1),glyph:'?',col:'#83dff1',grp:'Generated objects'};BY[id]=item;}
  for(const [v,n,col] of [[6,'Gate tile','#ff9bf0'],[7,'Background tile','#344762'],[8,'Phase A','#918bff'],[9,'Phase B','#6fc8ff']]){const id='proc_tile_'+v;TILE[v]=id;BY[id]={id,n,glyph:'?',tile:v,col,grp:'Terrain'};}
  function cleanGeneratedScene(s){
    if(!s)return null;
    if(!Number.isInteger(s.cols)||!Number.isInteger(s.rows)||s.cols<1||s.rows<1||s.cols>3000||s.rows>3000||s.cols*s.rows>300000)throw Error('Invalid generated map dimensions');
    return {cols:s.cols,rows:s.rows};
  }
  function cleanGenerated(v){
    if(!v||!['goal',...GENERATED_LISTS].includes(v.group)||!Array.isArray(v.anchor)||v.anchor.length!==2||!v.anchor.every(valid)||!v.data||typeof v.data!=='object')throw Error('Invalid generated object');
    const data={};
    for(const [k,n] of Object.entries(v.data)){
      if(!/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(k))continue;
      if(typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=100000)data[k]=n;
      else if(k==='axis'&&['x','y','p'].includes(n))data[k]=n;
      else if(typeof n==='boolean')data[k]=n;
      else if(k==='tiles'&&Array.isArray(n)&&n.length<=10000&&n.every(t=>Array.isArray(t)&&t.length===2&&t.every(valid)))data[k]=deep(n);
    }
    if(v.group==='gates'&&!Array.isArray(data.tiles))throw Error('Invalid gate tiles');
    return {group:v.group,anchor:[...v.anchor],data};
  }
  function importGenerated(L){
    const dimensions=cleanGeneratedScene(L);
    tiles.clear();objs.clear();params.clear();currentSelection();disableScripts();generatedScene=dimensions;
    L.grid.forEach((row,r)=>row.forEach((v,c)=>{if(v)tiles.set(K(c,r),v);}));
    const add=(group,data,id)=>{
      let c=Math.floor((data.tx!==undefined?data.tx*8:data.col!==undefined?data.col*8:data.x??data.cx??data.px??data.x0??data.x1??(data.axis==='x'?data.c:0))/8);
      let r=Math.floor((data.ty!==undefined?data.ty*8:data.y??data.cy??data.py??data.ground??(group==='gates'?data.y0*8:data.y0)??data.y1??(data.axis==='y'?data.c:0))/8);
      if(id==='flag'){c=Math.floor((data.x-4)/8);r=Math.floor((data.y+8)/8);}
      // Keep exact runtime coordinates in data when multiple objects share an editor cell.
      while(objs.has(K(c,r)))c++;
      const k=K(c,r);objs.set(k,id||'proc_'+group);params.set(k,{generated:cleanGenerated({group,anchor:[c,r],data})});
    };
    L.cps.forEach((q,i)=>add('cps',q,i===0?'player':'cp'));add('goal',L.goal,'flag');
    for(const group of GENERATED_LISTS)if(group!=='cps')for(const q of L[group]||[])add(group,q,group==='gems'?'gem':group==='springs'?'spring':undefined);
    $e('#ps-name').value='Seed '+V.seed;resetHistory();renderAssets();frameAll();refreshLibrary();saveCurrent();
  }
  function drawGeneratedProperties(k,host){
    const v=params.get(k).generated;
    for(const [key,value] of Object.entries(v.data)){
      if(typeof value!=='number')continue;
      const label=document.createElement('label');label.className='ps-editrow';label.textContent=key;
      const input=document.createElement('input');input.type='number';input.step='any';input.value=value;label.append(input);host.append(label);
      input.onchange=()=>{const n=Number(input.value);if(!input.value||!Number.isFinite(n)||Math.abs(n)>100000)return;const p=deep(params.get(k));p.generated.data[key]=n;params.set(k,p);commit('Updated '+key);};
    }
  }
  function translatedGenerated(v,dx,dy){
    const q=deep(v.data),tx=dx/8,ty=dy/8;
    for(const k of ['x','cx','px','x0','x1','x2'])if(typeof q[k]==='number')q[k]+=dx;
    for(const k of ['y','cy','py','ground','y0','y1','y2'])if(typeof q[k]==='number')q[k]+=v.group==='gates'?ty:dy;
    for(const k of ['tx','col'])if(typeof q[k]==='number')q[k]+=tx;
    if(typeof q.ty==='number')q.ty+=ty;
    if(typeof q.c==='number')q.c+=q.axis==='y'?dy:dx;
    if(q.tiles)q.tiles=q.tiles.map(([x,y])=>[x+tx,y+ty]);
    return q;
  }
  /* ---------- level conversion bridge ---------- */
  function build() {
    let a = 1e9, b = -1e9, c2 = 1e9, d2 = -1e9; const bound = k => { const [c, r] = P(k); a = Math.min(a, c); b = Math.max(b, c); c2 = Math.min(c2, r); d2 = Math.max(d2, r); };
    tiles.forEach((v, k) => bound(k)); objs.forEach((v, k) => bound(k)); if (a > b) { a = 0; b = 10; c2 = 0; d2 = 10; }
    const pad = generatedScene?0:20, ox = generatedScene?Math.max(0,-a):pad+1-a, oy = generatedScene?Math.max(0,-c2):pad+1-c2, C = generatedScene?Math.max(generatedScene.cols+ox,b+ox+1):Math.max(40,b-a+1+2*pad+2), R = generatedScene?Math.max(generatedScene.rows+oy,d2+oy+1):Math.max(40,d2-c2+1+2*pad+2);
    if (C * R > 1400000) throw new Error('Scene span is too large to play. Move distant objects closer together.');
    const g = Array.from({ length: R }, () => new Array(C).fill(0));
    /* the map edge is already an invisible solid wall (see solidTile), so no border blocks are drawn */
    const L = { grid: g, cps: [], gems: [], spikes: [], springs: [], crumbles: [], saws: [], fans: [], movers: [], belts: [], winds: [], moons: [], crushers: [], lasers: [], drips: [], gates: [], levers: [], keys: [], portals: [], phs: [], turrets: [], crystals: [], ceil: new Array(C).fill(0), feats: [], weather: null, layout: 'custom', cols: C, rows: R, goal: null, customObjects: [] };
    tiles.forEach((t, k) => { const [c0, r0] = P(k), c = c0 + ox, r = r0 + oy; g[r][c] = t; if (t === 2) L.spikes.push({ tx: c, ty: r }); if (t === 4) L.crumbles.push({ tx: c, ty: r }); });
    /* base ground runs down to the bottom of the world, so its underside never shows (floating platforms stay floating) */
    let maxR = -1e9; tiles.forEach((v, k) => { if (v === 1) maxR = Math.max(maxR, P(k)[1]); });
    const low = new Map(); tiles.forEach((v, k) => { const [c, r] = P(k), q = low.get(c); if (!q || r > q[0]) low.set(c, [r, v]); });
    if(!generatedScene)low.forEach(([r, v], c) => { if (v === 1 && r >= maxR - 3) for (let y = r + oy + 1; y < R; y++) g[y][c + ox] = 1; });
    let start = null;const gateMoves=[];
    objs.forEach((id, k) => {
      const [c0, r0] = P(k), c = c0 + ox, r = r0 + oy, X = c * 8, Y = r * 8, gr = Y + 8;
      const generated=params.get(k)?.generated;
      if(generated){const q=translatedGenerated(generated,(c-generated.anchor[0])*8,(r-generated.anchor[1])*8);if(generated.group==='gates')generated.data.tiles.forEach(([x,y],i)=>gateMoves.push({from:[x+ox,y+oy],to:q.tiles[i]}));if(id==='player')start=q;else if(generated.group==='goal')L.goal=q;else L[generated.group].push(q);return;}
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
    for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(g[r][c]===8||g[r][c]===9)L.phs.push({tx:c,ty:r,t:g[r][c]});
    const activeMoves=gateMoves.filter(m=>g[m.from[1]]?.[m.from[0]]===6);
    activeMoves.forEach(m=>{g[m.from[1]][m.from[0]]=0;});
    activeMoves.forEach(m=>{const [c,r]=m.to;if(g[r]&&c>=0&&c<C)g[r][c]=6;});
    const gateIds=new Map(L.gates.map((q,i)=>[q.ci,i]));
    L.gates.forEach((q,i)=>{q.ci=i;q.tiles=q.tiles.filter(([c,r])=>g[r]?.[c]===6);});
    for(const group of ['levers','keys'])L[group]=L[group].filter(q=>gateIds.has(q.gate)).map(q=>({...q,gate:gateIds.get(q.gate)}));
    const gateTiles=new Set(L.gates.flatMap(q=>q.tiles.map(([c,r])=>c+','+r)));
    for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(g[r][c]===6&&!gateTiles.has(c+','+r))g[r][c]=0;
    return L;
  }
