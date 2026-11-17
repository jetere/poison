/* Shared procedural controls and generated-map overview. The custom draft stays intact. */
(function () {
  window.procOn=false;window.procLen=768;window.procLayout='auto';
  const studio=$('poison-studio'),bar=studio.querySelector('.ps-bar');
  const tg=document.createElement('button');tg.className='btn';tg.id='pg-toggle';$('b-apply').after(tg);
  const st=document.createElement('button');st.id='ps-procedural';bar.append(st);
  const settings=document.createElement('button');settings.textContent='Procedural settings';settings.id='ps-procedural-settings';bar.append(settings);
  const preview=document.createElement('div');preview.id='ps-procedural-preview';preview.style.cssText='display:none;flex:1;min-height:0;overflow:auto;padding:16px;background:#080b15';
  preview.innerHTML='<p id="pg-summary"></p><p>Generated map overview. Turn procedural mode off to return to your editable scene. Your custom scene is preserved.</p><canvas id="pg-map" style="display:block;image-rendering:pixelated;max-width:100%"></canvas><p>White: spawn/checkpoints · Yellow: gems · Pink: hazards · Cyan: moving platforms and environment · Green: finish</p>';
  studio.append(preview);
  const w=document.createElement('div');w.id='pg-settings';w.style.cssText='position:fixed;right:16px;top:90px;z-index:20000;width:290px;display:none;background:var(--panel);border:1px solid var(--line);padding:14px;font:13px var(--font-body);color:var(--fg)';
  w.innerHTML='<h3>Procedural map</h3><label>Seed <input id="pg-seed" type="number" min="1" max="999999" step="1" value="1" style="width:130px"></label><button id="pg-rnd" class="btn">Random seed</button><p><label>Layout <select id="pg-lay"><option value="auto">Auto (by seed)</option>'+Object.entries(LAYOUTS).filter(([k])=>k!=='custom').map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label></p><p><label>Length <select id="pg-len"><option value="320">Short (320)</option><option value="512">Medium (512)</option><option value="768">Long (768)</option><option value="1024">Epic (1024)</option></select></label></p><button class="btn primary" id="pg-go">Generate map</button> <button class="btn" id="pg-off">Turn off</button> <button class="btn" id="pg-x">Close</button>';
  document.body.append(w);
  let snapshot=null;
  const draw=()=>{
    if(!snapshot)return;const L=snapshot,c=$('pg-map');c.width=L.cols*2;c.height=L.rows*2;const g=c.getContext('2d');g.fillStyle='#11192c';g.fillRect(0,0,c.width,c.height);
    const colors={1:'#7395b8',2:'#ff6670',4:'#ddbe79',5:'#b9bfc9',6:'#ff9bf0',8:'#918bff',9:'#6fc8ff'};
    L.grid.forEach((row,y)=>row.forEach((v,x)=>{if(v){g.fillStyle=colors[v]||'#7395b8';g.fillRect(x*2,y*2,2,2);}}));
    const mark=(x,y,color,w=8,h=8)=>{if(!Number.isFinite(x)||!Number.isFinite(y))return;g.fillStyle=color;g.fillRect(x/4,y/4,Math.max(2,w/4),Math.max(2,h/4));};
    for(const key of ['cps','gems','springs','saws','fans','belts','winds','moons','crushers','lasers','drips','levers','keys','portals','turrets','crystals'])for(const o of L[key]||[]){mark(o.tx!==undefined?o.tx*8:o.x??o.cx??o.px??o.x0??o.x1,o.ty!==undefined?o.ty*8:o.y??o.cy??o.py??o.ground??o.y0??o.y1,key==='cps'?'#ffffff':key==='gems'?'#ffd86b':['saws','crushers','lasers','drips','turrets'].includes(key)?'#ff6670':'#82f5d6');}
    for(const o of L.movers||[])mark(o.axis==='x'?o.c+Math.sin(o.ph)*o.range:o.x,o.axis==='x'?o.y:o.c+Math.sin(o.ph)*o.range,'#6fc8ff',o.w,8);
    mark(L.goal.x,L.goal.y,'#8bff8b');
    $('pg-summary').textContent='Seed '+V.seed+' · '+LAYOUTS[L.layout]+' · '+window.procLen+' tiles';
  };
  const refresh=()=>{
    tg.textContent=st.textContent='Procedural: '+(window.procOn?'on':'off');
    tg.classList.toggle('primary',window.procOn);st.classList.toggle('ps-primary',window.procOn);
    $('pg-seed').value=V.seed;$('pg-lay').value=window.procLayout;$('pg-len').value=window.procLen;
    preview.style.display=window.procOn?'block':'none';
    for(const selector of ['.ps-work','#ps-toolbar'])studio.querySelector(selector).style.display=window.procOn?'none':'';
    for(const id of ['ps-name','ps-save','ps-export','ps-undo','ps-redo'])$(id).disabled=window.procOn;
    if(window.procOn)draw();
  };
  const set=on=>{window.procOn=!!on;buildLevel(V.seed);refresh();if(!on)w.style.display='none';};
  const open=()=>{refresh();w.style.display='block';};
  window.poisonSetProcedural=set;
  window.poisonProcedural={open,refresh,capture:L=>{snapshot=JSON.parse(JSON.stringify(L));refresh();},get snapshot(){return snapshot&&JSON.parse(JSON.stringify(snapshot));}};
  tg.onclick=()=>{set(!window.procOn);if(window.procOn)open();};st.onclick=tg.onclick;settings.onclick=open;
  $('pg-rnd').onclick=()=>{$('pg-seed').value=1+Math.floor(Math.random()*999999);};
  $('pg-go').onclick=()=>{const input=$('pg-seed');if(!input.value||!input.reportValidity())return;window.procLen=Number($('pg-len').value);window.procLayout=$('pg-lay').value;window.procOn=true;buildLevel(Number(input.value),'Generated.');refresh();w.style.display='none';};
  $('pg-off').onclick=()=>set(false);$('pg-x').onclick=()=>{w.style.display='none';};
  // Disable custom-scene keyboard edits while its workspace is hidden.
  studio.addEventListener('keydown',e=>{if(window.procOn&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&e.key!=='Tab'&&e.key!=='Enter'&&e.key!==' '){e.stopPropagation();e.preventDefault();}},true);
  refresh();
})();
buildLevel(V.seed);
if (window.__DBG) window.__DBG({ pl, cam, P, V, stats, fx, world, get phase() { return phase; }, get levers() { return levers; }, get keys() { return keys; }, get gates() { return gates; }, get portals() { return portals; }, buildLevel, music: SFX.music, get lvl() { return lvl; }, get movers() { return movers; }, get grid() { return grid; }, get gems() { return gemList; } });

