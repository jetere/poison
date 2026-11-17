/* Shared procedural controls; generated maps become editable scenes. */
(function () {
  window.procOn=false;window.procLen=768;window.procLayout='auto';
  const studio=$('poison-studio'),bar=studio.querySelector('.ps-bar');
  const gameSettings=document.createElement('button');gameSettings.id='pg-settings-button';gameSettings.className='btn';$('b-apply').after(gameSettings);
  const settings=document.createElement('button');settings.id='ps-procedural-settings';bar.append(settings);
  for(const button of [settings,gameSettings]){button.textContent='PGM';button.title='Procedural map generator';button.setAttribute('aria-label','PGM: procedural map generator');button.setAttribute('aria-controls','pg-settings');button.setAttribute('aria-expanded','false');}
  const w=document.createElement('div');w.id='pg-settings';w.style.cssText='position:fixed;right:16px;top:90px;z-index:20000;width:290px;display:none;background:var(--panel);border:1px solid var(--line);padding:14px;font:13px var(--font-body);color:var(--fg)';
  w.innerHTML='<h3>PGM</h3><p>Generate replaces the current scene. Save or export edits you want to keep first.</p><label>Seed <input id="pg-seed" type="number" min="1" max="999999" step="1" value="1" style="width:130px"></label><button id="pg-rnd" class="btn">Random seed</button><p><label>Layout <select id="pg-lay"><option value="auto">Auto (by seed)</option>'+Object.entries(LAYOUTS).filter(([k])=>k!=='custom').map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label></p><p><label>Length <select id="pg-len"><option value="320">Short (320)</option><option value="512">Medium (512)</option><option value="768">Long (768)</option><option value="1024">Epic (1024)</option></select></label></p><button class="btn primary" id="pg-go">Generate map</button> <button class="btn" id="pg-x">Close</button>';
  document.body.append(w);
  let snapshot=null;
  const refresh=()=>{
    $('pg-seed').value=V.seed;$('pg-lay').value=window.procLayout;$('pg-len').value=window.procLen;
  };
  const close=()=>{w.style.display='none';for(const b of [settings,gameSettings])b.setAttribute('aria-expanded','false');};
  const set=on=>{window.procOn=!!on;if(on)buildLevel(V.seed);else if(!window.poisonEditorOpen)buildLevel(V.seed);refresh();if(!on)close();};
  const open=()=>{refresh();w.style.display=w.style.display==='block'?'none':'block';for(const b of [settings,gameSettings])b.setAttribute('aria-expanded',String(w.style.display==='block'));};
  window.poisonSetProcedural=set;
  window.poisonProcedural={open,refresh,detach:()=>{window.procOn=false;refresh();},capture:L=>{snapshot=JSON.parse(JSON.stringify(L));window.poisonStudio.importGenerated(snapshot);refresh();},get snapshot(){return snapshot&&JSON.parse(JSON.stringify(snapshot));}};
  settings.onclick=gameSettings.onclick=open;
  $('pg-rnd').onclick=()=>{$('pg-seed').value=1+Math.floor(Math.random()*999999);};
  $('pg-go').onclick=()=>{const input=$('pg-seed');if(!input.value||!input.reportValidity())return;window.procLen=Number($('pg-len').value);window.procLayout=$('pg-lay').value;window.procOn=true;buildLevel(Number(input.value),'Generated.');refresh();close();};
  $('pg-x').onclick=close;
  refresh();
})();
buildLevel(V.seed);
if (window.__DBG) window.__DBG({ pl, cam, P, V, stats, fx, world, get phase() { return phase; }, get levers() { return levers; }, get keys() { return keys; }, get gates() { return gates; }, get portals() { return portals; }, buildLevel, music: SFX.music, get lvl() { return lvl; }, get movers() { return movers; }, get grid() { return grid; }, get gems() { return gemList; } });

