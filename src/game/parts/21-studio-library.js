  /* ---------- integrated saved-scenes access in the main game ---------- */
  const sceneBox=document.createElement('div');
  sceneBox.style.cssText='margin-top:12px;background:var(--bg);border:1px solid var(--line);padding:10px';
  sceneBox.innerHTML='<div class="sect-title">My scenes</div><div id="poison-scene-library" style="max-height:225px;overflow:auto;color:var(--muted);font-size:12px"></div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px"><button class="btn" id="poison-scene-new">Create scene</button><button class="btn" id="poison-scene-import">Import JSON</button></div>';
  $('b-apply').parentNode.after(sceneBox);
  sceneBox.querySelector('#poison-scene-new').onclick=()=>{openEditor();showNew();};
  sceneBox.querySelector('#poison-scene-import').onclick=()=>{importTarget='game';$e('#ps-file').click();};
  window.edNext=()=>{
    if(window.procOn)return;
    const lib=getLib(),names=Object.keys(lib);
    if(names.length<2)return;
    const ix=names.indexOf(name()),next=names[(ix+1+names.length)%names.length];
    try{deserialize(lib[next]);saveCurrent();refreshLibrary();}catch(e){console.warn('Could not load next custom scene',e);}
  };
  paintDemo('starter');
  try{const current=localStorage.getItem(CK);if(current)deserialize(JSON.parse(current));}
  catch(e){paintDemo('starter');}
  resetHistory();
  customBuild=()=>{const L=build();L.name=name();return L;};
  $('b-new').textContent='Open editor';
  $('b-new').onclick=()=>{if(window.poisonEditorOpen)closeEditor();else openEditor();$('b-new').blur();};
  refreshLibrary();renderAssets();updateToolButtons();updateHistoryButtons();
  window.poisonStudio={open:openEditor,close:closeEditor,serialize,deserialize,importGenerated,undo,redo,play:playScene,createCustom,enableScripts:()=>requestScriptPermission(),get state(){return{tiles:tiles.size,objects:objs.size,customObjects:[...objs.values()].filter(v=>v==='custom').length,prefabs:prefabs.size,selected:selection.size,history:history.length,name:name()};}};
})();


