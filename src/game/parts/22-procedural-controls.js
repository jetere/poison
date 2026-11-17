/* Shared procedural controls; generated maps become editable scenes. */
(function () {
  window.procOn=false;window.procLen=768;window.procLayout='auto';
  const studio=$('poison-studio'),bar=studio.querySelector('.ps-bar');
  const tg=document.createElement('button');tg.className='btn';tg.id='pg-toggle';$('b-apply').after(tg);
  const st=document.createElement('button');st.id='ps-procedural';bar.append(st);
  const settings=document.createElement('button');settings.textContent='Procedural settings';settings.id='ps-procedural-settings';bar.append(settings);
  const w=document.createElement('div');w.id='pg-settings';w.style.cssText='position:fixed;right:16px;top:90px;z-index:20000;width:290px;display:none;background:var(--panel);border:1px solid var(--line);padding:14px;font:13px var(--font-body);color:var(--fg)';
  w.innerHTML='<h3>Procedural map</h3><p>Generate replaces the current scene. Save or export edits you want to keep first.</p><label>Seed <input id="pg-seed" type="number" min="1" max="999999" step="1" value="1" style="width:130px"></label><button id="pg-rnd" class="btn">Random seed</button><p><label>Layout <select id="pg-lay"><option value="auto">Auto (by seed)</option>'+Object.entries(LAYOUTS).filter(([k])=>k!=='custom').map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label></p><p><label>Length <select id="pg-len"><option value="320">Short (320)</option><option value="512">Medium (512)</option><option value="768">Long (768)</option><option value="1024">Epic (1024)</option></select></label></p><button class="btn primary" id="pg-go">Generate map</button> <button class="btn" id="pg-off">Turn off</button> <button class="btn" id="pg-x">Close</button>';
  document.body.append(w);
  let snapshot=null;
  const refresh=()=>{
    tg.textContent=st.textContent='Procedural: '+(window.procOn?'on':'off');
    tg.classList.toggle('primary',window.procOn);st.classList.toggle('ps-primary',window.procOn);
    $('pg-seed').value=V.seed;$('pg-lay').value=window.procLayout;$('pg-len').value=window.procLen;
  };
  const set=on=>{window.procOn=!!on;if(on)buildLevel(V.seed);else if(!window.poisonEditorOpen)buildLevel(V.seed);refresh();if(!on)w.style.display='none';};
  const open=()=>{refresh();w.style.display='block';};
  window.poisonSetProcedural=set;
  window.poisonProcedural={open,refresh,detach:()=>{window.procOn=false;refresh();},capture:L=>{snapshot=JSON.parse(JSON.stringify(L));window.poisonStudio.importGenerated(snapshot);refresh();},get snapshot(){return snapshot&&JSON.parse(JSON.stringify(snapshot));}};
  tg.onclick=()=>{set(!window.procOn);if(window.procOn)open();};st.onclick=tg.onclick;settings.onclick=open;
  $('pg-rnd').onclick=()=>{$('pg-seed').value=1+Math.floor(Math.random()*999999);};
  $('pg-go').onclick=()=>{const input=$('pg-seed');if(!input.value||!input.reportValidity())return;window.procLen=Number($('pg-len').value);window.procLayout=$('pg-lay').value;window.procOn=true;buildLevel(Number(input.value),'Generated.');refresh();w.style.display='none';};
  $('pg-off').onclick=()=>set(false);$('pg-x').onclick=()=>{w.style.display='none';};
  refresh();
})();
buildLevel(V.seed);
if (window.__DBG) window.__DBG({ pl, cam, P, V, stats, fx, world, get phase() { return phase; }, get levers() { return levers; }, get keys() { return keys; }, get gates() { return gates; }, get portals() { return portals; }, buildLevel, music: SFX.music, get lvl() { return lvl; }, get movers() { return movers; }, get grid() { return grid; }, get gems() { return gemList; } });

