/* ---------- main loop ---------- */
/* ---------- Poison Studio: scene editor ---------- */
(function () {
  'use strict';
  const MAXC = 3000, MAX_AREA = 36000, HISTORY_LIMIT = 70, LK = 'poison_levels', CK = 'poison_current';
  LAYOUTS.custom = 'Custom level';
  const ITEMS = [
    {id:'player', n:'Player spawn', glyph:'●', col:'#f8fbff', grp:'Setup'},
    {id:'cp', n:'Checkpoint', glyph:'⚑', col:'#ffd66f', grp:'Setup'},
    {id:'flag', n:'Finish flag', glyph:'⚑', col:'#ff7197', grp:'Setup'},
    {id:'ground', n:'Solid ground', glyph:'▦', tile:1, col:'#7395b8', grp:'Terrain'},
    {id:'spike', n:'Spikes', glyph:'▲', tile:2, col:'#ff6670', grp:'Terrain'},
    {id:'crumble', n:'Crumbling tile', glyph:'▤', tile:4, col:'#ddbe79', grp:'Terrain'},
    {id:'brk', n:'Breakable tile', glyph:'▥', tile:5, col:'#b9bfc9', grp:'Terrain'},
    {id:'gem', n:'Gem', glyph:'◆', col:'#7cebd5', grp:'Pickups'},
    {id:'spring', n:'Spring', glyph:'↥', col:'#f9a1e2', grp:'Pickups'},
    {id:'saw', n:'Saw · horizontal', glyph:'✺', col:'#ff646c', grp:'Hazards'},
    {id:'sawv', n:'Saw · vertical', glyph:'✺', col:'#ff646c', grp:'Hazards'},
    {id:'crush', n:'Crusher', glyph:'▣', col:'#ff9a5b', grp:'Hazards'},
    {id:'laser', n:'Laser · vertical', glyph:'┃', col:'#ff6bdf', grp:'Hazards'},
    {id:'lasera', n:'Laser · diagonal ↗', glyph:'╱', col:'#ff6bdf', grp:'Hazards'},
    {id:'laserb', n:'Laser · diagonal ↘', glyph:'╲', col:'#ff6bdf', grp:'Hazards'},
    {id:'laserh', n:'Laser · horizontal', glyph:'━', col:'#ff6bdf', grp:'Hazards'},
    {id:'tl', n:'Turret · left', glyph:'◀', col:'#ffa6a9', grp:'Hazards'},
    {id:'tr', n:'Turret · right', glyph:'▶', col:'#ffa6a9', grp:'Hazards'},
    {id:'mov', n:'Moving platform', glyph:'⇆', col:'#8bb7ff', grp:'Moving objects'},
    {id:'lift', n:'Vertical lift', glyph:'⇅', col:'#8bb7ff', grp:'Moving objects'},
    {id:'br', n:'Conveyor · right', glyph:'➜', col:'#d5bb77', grp:'Moving objects'},
    {id:'bl', n:'Conveyor · left', glyph:'⬅', col:'#d5bb77', grp:'Moving objects'},
    {id:'fan', n:'Updraft fan', glyph:'↑', col:'#7debea', grp:'Environment'},
    {id:'wr', n:'Wind · right', glyph:'➜', col:'#bbcdee', grp:'Environment'},
    {id:'wl', n:'Wind · left', glyph:'⬅', col:'#bbcdee', grp:'Environment'},
    {id:'moon', n:'Low-gravity zone', glyph:'◔', col:'#e5cfff', grp:'Environment'},
    {id:'custom', n:'Custom GameObject', glyph:'✦', col:'#83dff1', grp:'Creator'}
  ];
  const BY = Object.fromEntries(ITEMS.map(q => [q.id,q])), TILE = {1:'ground',2:'spike',4:'crumble',5:'brk'};
  const VAR = {saw:{r:'sawv'},sawv:{r:'saw'},mov:{r:'lift'},lift:{r:'mov'},tl:{r:'tr',f:'tr'},tr:{r:'tl',f:'tl'},wr:{r:'wl',f:'wl'},wl:{r:'wr',f:'wr'},br:{r:'bl',f:'bl'},bl:{r:'br',f:'br'},laser:{r:'lasera'},lasera:{r:'laserh',f:'laserb'},laserh:{r:'laserb'},laserb:{r:'laser',f:'lasera'}};
  const PROPERTIES = {
    saw:[['range','Travel range (pixels)',20,0,240,4],['speed','Movement speed',2,0.1,8,0.1]],
    sawv:[['range','Travel range (pixels)',12,0,240,4],['speed','Movement speed',1.8,0.1,8,0.1]],
    mov:[['range','Travel range (pixels)',32,0,400,4],['speed','Movement speed',1,0.1,8,0.1],['width','Width (pixels)',24,8,128,8]],
    lift:[['range','Travel range (pixels)',28,0,400,4],['speed','Movement speed',0.9,0.1,8,0.1],['width','Width (pixels)',24,8,128,8]],
    crush:[['width','Width (pixels)',24,8,128,8],['period','Cycle time (seconds)',2.8,0.5,12,0.1]],
    laser:[['length','Beam length (pixels)',56,8,200,8],['period','Cycle time (seconds)',3.2,0.5,12,0.1]],
    lasera:[['length','Beam length (pixels)',56,8,200,8],['period','Cycle time (seconds)',3.2,0.5,12,0.1]],
    laserb:[['length','Beam length (pixels)',56,8,200,8],['period','Cycle time (seconds)',3.2,0.5,12,0.1]],
    laserh:[['length','Beam length (pixels)',56,8,200,8],['period','Cycle time (seconds)',3.2,0.5,12,0.1]],
    tl:[['period','Fire interval (seconds)',2.2,0.4,12,0.1],['speed','Projectile speed',80,10,300,5]],
    tr:[['period','Fire interval (seconds)',2.2,0.4,12,0.1],['speed','Projectile speed',80,10,300,5]],
    fan:[['width','Width (pixels)',24,8,200,8],['height','Height (pixels)',88,8,240,8]],
    wr:[['width','Width (pixels)',80,8,240,8],['height','Height (pixels)',96,8,240,8]],
    wl:[['width','Width (pixels)',80,8,240,8],['height','Height (pixels)',96,8,240,8]],
    moon:[['width','Width (pixels)',80,8,240,8],['height','Height (pixels)',144,8,240,8]],
    br:[['width','Width (pixels)',72,8,240,8],['speed','Conveyor speed',50,0,250,5]],
    bl:[['width','Width (pixels)',72,8,240,8],['speed','Conveyor speed',50,0,250,5]]
  };
  const K = (c,r) => c+','+r, P = k => k.split(',').map(Number), valid = n => Number.isInteger(n) && Math.abs(n) <= MAXC;
  const tiles = new Map(), objs = new Map(), params = new Map(), cam = {x:-9,y:-6,z:20};
  const selection = new Set();
  let tileSelection = null, cur='ground', mode='brush', bs=1, layer='terrain', leftTab='assets', viewGrid=true, viewExt=true, visTerrain=true, visObjects=true, lockTerrain=false, lockObjects=false, space=false, hover=null, action=null, clipboard=null;
  let history=[], historyIndex=0, saveTimer=0, noticeTimer=0, miniBounds=null, importTarget='editor', openedOnce=false;
  const el = document.createElement('div'); el.id='poison-studio';
  el.innerHTML = `
    <div class="ps-bar"><div class="ps-brandwrap"><div class="ps-brand">POISON<small>CREATOR STUDIO</small></div><div class="ps-pixelbits" aria-hidden="true"><i></i><i></i><i></i></div></div><span class="ps-divider"></span><span class="ps-floating-spark" aria-hidden="true"></span>
      <input id="ps-name" class="ps-name" aria-label="Scene name" maxlength="40" value="My level" title="Scene name">
      <button id="ps-new" title="Create a new scene">New ▾</button><button id="ps-save" title="Save to browser · Ctrl+S">Save</button>
      <select id="ps-library" aria-label="Saved scenes"></select><button id="ps-load" title="Open selected scene">Open</button>
      <button id="ps-export" title="Download a portable JSON scene file">Export</button><button id="ps-import" title="Import JSON scene file">Import</button><input id="ps-file" type="file" accept=".json,application/json" hidden>
      <span class="ps-grow"></span><button id="ps-undo" title="Undo · Ctrl+Z">↶ Undo</button><button id="ps-redo" title="Redo · Ctrl+Y">↷ Redo</button>
      <button id="ps-theme-toggle" class="ps-theme-entry" aria-controls="ps-theme-window" aria-expanded="false" title="Open or close the advanced Theme Workshop">◆ Themes</button><span id="ps-runtime-off" class="ps-runtime-off" title="Game loop and audio are stopped while Studio is open">■ GAME OFF</span><button id="ps-scripts" title="Custom script permission is OFF by default">⌘ Scripts OFF</button><button id="ps-help" title="Help and keyboard shortcuts">? Help</button><button class="ps-primary" id="ps-play" title="Test the edited scene in Poison">▶ Play scene</button><button id="ps-close" title="Close scene editor">✕ Close</button>
    </div>
    <div class="ps-bar ps-sub" id="ps-toolbar">
      <button class="ps-tool" data-tool="select" title="Select objects / area · V">↖ Select <span class="ps-shortcut">V</span></button>
      <button class="ps-tool active" data-tool="brush" title="Paint tiles or place objects · B">✎ Brush <span class="ps-shortcut">B</span></button>
      <button class="ps-tool" data-tool="rect" title="Filled rectangle · U">▣ Rect <span class="ps-shortcut">U</span></button>
      <button class="ps-tool" data-tool="line" title="Draw a straight line · L">╱ Line <span class="ps-shortcut">L</span></button>
      <button class="ps-tool" data-tool="fill" title="Bucket fill connected terrain · G">▥ Fill <span class="ps-shortcut">G</span></button>
      <button class="ps-tool" data-tool="erase" title="Erase selected layer · E">⌫ Erase <span class="ps-shortcut">E</span></button>
      <button class="ps-tool" data-tool="hand" title="Pan the canvas · H or Space + drag">✥ Pan <span class="ps-shortcut">H</span></button>
      <span class="ps-divider"></span><label style="color:var(--se-muted)">Brush <select id="ps-size" title="Brush size"><option value="1">1 × 1</option><option value="2">2 × 2</option><option value="3">3 × 3</option><option value="5">5 × 5</option></select></label>
      <span class="ps-divider"></span><button id="ps-zoomout" title="Zoom out">−</button><button id="ps-fit" title="Frame all objects · Home">⌖ Frame</button><button id="ps-zoomin" title="Zoom in">+</button>
      <label class="ps-toggle" style="margin:0 5px"><input id="ps-grid" type="checkbox" checked>Grid</label><label class="ps-toggle" style="margin:0 5px"><input id="ps-guides" type="checkbox" checked>Ranges</label>
      <span class="ps-grow"></span><span style="font:11px 'IBM Plex Mono',monospace;color:var(--se-muted)" id="ps-zoomlabel">100%</span>
    </div>
    <div class="ps-work">
      <aside class="ps-sidebar"><div class="ps-tabs"><button class="ps-tab active" data-tab="assets">Add</button><button class="ps-tab" data-tab="hierarchy">Objects</button></div>
        <div id="ps-assets" class="ps-scroll"><input id="ps-search" class="ps-search" placeholder="Search objects, hazards, and prefabs…" aria-label="Find an asset"><button id="ps-create" class="ps-primary ps-createbig" style="display:block;width:100%;margin:2px 0 10px">＋ Create Custom Object</button><div class="ps-quickcard"><b>Quick start</b><span>1. Pick a tile, hazard, or prefab. 2. Click in the scene to place or paint. 3. Select an object to edit it in the Inspector. 4. Press Play Scene to test instantly.</span></div><div class="ps-toolhint"><span class="ps-chip">B Brush</span><span class="ps-chip">V Select</span><span class="ps-chip">E Erase</span><span class="ps-chip">Space Pan</span></div><div id="ps-assets-list"></div></div>
        <div id="ps-hierarchy" class="ps-scroll" hidden><input id="ps-scene-search" class="ps-search" placeholder="Filter objects…"><div id="ps-scene-list"></div></div>
        <div style="border-top:1px solid var(--se-border);padding:9px 11px">
          <div class="ps-section">Layers</div>
          <div style="display:flex;gap:5px;align-items:center;margin:7px 0"><label style="flex:1"><input type="checkbox" id="ps-show-terrain" checked> ▦ Terrain</label><button id="ps-lock-terrain" title="Lock editing terrain">🔓</button></div>
          <div style="display:flex;gap:5px;align-items:center;margin:7px 0"><label style="flex:1"><input type="checkbox" id="ps-show-objects" checked> ◉ Objects</label><button id="ps-lock-objects" title="Lock editing objects">🔓</button></div>
        </div>
      </aside>
      <div class="ps-viewport" id="ps-viewport"><canvas id="ps-canvas" tabindex="0" aria-label="Editable level scene canvas"></canvas>
        <div class="ps-float ps-viewport-label" id="ps-coordlabel" hidden>CREATOR VIEW · GRID 8px</div><canvas id="ps-minimap" class="ps-minimap" hidden width="186" height="116" title="Click to move the camera"></canvas>
        <div class="ps-float ps-hint" hidden>Click to place · Drag to paint · <kbd>Space</kbd> pan · Scroll to zoom · <kbd>Right-click</kbd> erase</div>
      </div>
      <aside class="ps-sidebar right"><div class="ps-tabs"><span style="padding:6px 5px;font-weight:700;letter-spacing:.08em">INSPECTOR</span><span class="ps-grow"></span><button id="ps-copy" title="Copy selected objects / area · Ctrl+C">Copy</button><button id="ps-paste" title="Paste copied objects / tiles · Ctrl+V">Paste</button></div><div id="ps-inspector" class="ps-scroll"></div></aside>
    </div>
    <div class="ps-status"><span id="ps-coords">X 0 · Y 0</span><span id="ps-stats">0 tiles · 0 objects</span><span class="ps-grow" id="ps-status-msg">Ready. Pick something on the left and build your Poison scene.</span><span id="ps-autosave">Autosave on</span></div>
    <div class="ps-theme-window" id="ps-theme-window" role="dialog" aria-modal="true" aria-labelledby="ps-theme-title" aria-hidden="true">
      <div class="ps-theme-shell">
        <div class="ps-theme-titlebar"><div class="ps-theme-crest" aria-hidden="true">◆</div><div><b id="ps-theme-title">THEME WORKSHOP</b><small>WORLD COLOR DESIGN / POISON</small></div><span class="ps-grow"></span><span class="ps-theme-indicator" id="ps-theme-current">DUSK CAVES</span><button id="ps-theme-close" aria-label="Close Theme Workshop">✕ CLOSE</button></div>
        <div class="ps-theme-content">
          <section class="ps-theme-left"><h3>01 / WORLD PALETTES</h3><div id="ps-theme-builtins" class="ps-theme-gallery"></div>
            <div class="ps-theme-custom-title"><h3>02 / MY CUSTOM THEMES</h3><span id="ps-theme-count">0 SAVED</span></div>
            <div id="ps-theme-custom-list" class="ps-theme-gallery"></div><p class="ps-theme-caption">Use Rename Theme to name a palette. Original themes stay unchanged; renamed copies are saved here. Save your own theme to use it in other Poison scenes. Exporting a scene also includes its custom palette.</p>
          </section>
          <section class="ps-theme-right"><div class="ps-theme-preview"><div class="ps-preview-topline"><span>PIXEL WORLD PREVIEW</span><span id="ps-theme-preview-label">DUSK CAVES</span></div><div class="ps-preview-art" id="ps-theme-preview-art" aria-label="Preview of the chosen terrain and sky colors"><canvas id="ps-theme-skycanvas" width="320" height="128" aria-hidden="true"></canvas><div class="ps-preview-mountain ps-back"></div><div class="ps-preview-mountain ps-front"></div><div class="ps-preview-gem"></div><div class="ps-preview-grass"></div><div class="ps-preview-zoneglow"><i></i><i></i><i></i></div><div class="ps-preview-floor"></div><div class="ps-preview-block"></div></div><div class="ps-theme-palette-strip" id="ps-theme-swatch-strip"></div></div>
            <label class="ps-theme-name-label">THEME NAME<input id="ps-theme-name" maxlength="34" placeholder="My Poison palette" type="text" value=""></label><label class="ps-theme-mode-label">SKY FEATURE<select id="ps-theme-skyfx"><option value="moon">Moon</option><option value="sun">Sun</option><option value="none">None / clear sky</option><option value="multimoon">Multi-moon</option><option value="galaxy">Galaxy</option></select></label>
            <section class="ps-sky-controls" id="ps-sky-controls" aria-label="Celestial settings">
              <h3>SKY / OBJECT SETTINGS</h3>
              <p class="ps-theme-caption" id="ps-sky-caption">Adjust the selected sky feature. The mountains always remain in front.</p>
              <div id="ps-sky-controls-grid" class="ps-sky-fields"></div>
            </section>
            <h3>03 / ESSENTIAL COLORS</h3><div class="ps-theme-fields" id="ps-theme-basic"></div>
            <button class="ps-theme-advanced-toggle" id="ps-theme-advanced" aria-expanded="false">＋ ADVANCED COLOR OPTIONS <span>▾</span></button>
            <div id="ps-theme-advanced-content" hidden><p class="ps-theme-caption">Fine tune mountains, hazards, pickups, dash effects, and the colors of the four world zones.</p><div class="ps-theme-fields" id="ps-theme-extra"></div><h3>ZONE ACCENTS</h3><div class="ps-theme-fields" id="ps-theme-zones"></div></div>
            <div id="ps-theme-notice" role="status">Choose a palette, then apply it to your scene.</div>
          </section>
        </div>
        <div class="ps-theme-actions"><button id="ps-theme-reset">↺ RESET COLORS</button><button id="ps-theme-delete">DELETE CUSTOM</button><span class="ps-grow"></span><button id="ps-theme-rename" title="Rename a custom theme or create a named copy of a built-in palette">✎ RENAME THEME</button><button id="ps-theme-save">＋ SAVE AS CUSTOM</button><button id="ps-theme-update">UPDATE CUSTOM</button><button id="ps-theme-apply" class="ps-primary">◆ APPLY TO SCENE</button></div>
      </div>
    </div>
    <div class="ps-modal" id="ps-modal"><div class="ps-modal-card" id="ps-modal-content"></div></div>`;
  document.body.appendChild(el);
  const $e = id => el.querySelector(id), canvas=$e('#ps-canvas'), viewport=$e('#ps-viewport'), mini=$e('#ps-minimap'), ctx=canvas.getContext('2d');
  const name = () => ($e('#ps-name').value.trim() || 'My level').slice(0,40);
  function say(msg) { $e('#ps-status-msg').textContent=msg; }

  // Theme Workshop is an independent Studio window. All color edits are drafts until applied or saved.
  const themeWindow=$e('#ps-theme-window');
  const BASIC_FIELDS=[['sky1','Deep sky'],['sky2','Horizon'],['solid','Terrain'],['top','Platform edge'],['grass','Foliage']];
  const ADV_FIELDS=[['mtn1','Far mountains'],['mtn2','Near mountains'],['hazard','Hazards'],['spring','Springs'],['gem','Gems'],['crystal','Crystals'],['ready','Dash ready'],['spent','Dash used']];
  let themeSelected=V.theme,themeDraft=normalizeTheme(themeFor(themeSelected==='auto'?V.seed%BASE_THEME_COUNT:themeSelected));
  let themeAdvanced=false,themeDirty=false;
  const themeEsc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function themeSay(msg){$e('#ps-theme-notice').textContent=msg;}
  function themeRgbToHex(c){return '#'+c.map(n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join('');}
  function themeHexToRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
  function currentThemeChoice(){return themeSelected==='auto'?'auto':themeSelected;}
  function themeSource(choice){return themeFor(choice==='auto'?V.seed%BASE_THEME_COUNT:choice);}
  function themeChanged(){themeDirty=true;$e('#ps-theme-apply').textContent='◆ APPLY TO SCENE';themeSay('Unsaved edits. Preview is live; Apply to Scene to use the changes in gameplay.');drawThemePreview();}
  function pickTheme(choice){
    themeSelected=choice;themeDraft=normalizeTheme(themeSource(choice));themeDirty=false;
    $e('#ps-theme-name').value=themeDraft.name;
    $e('#ps-theme-skyfx').value=themeDraft.skyFx;
    drawThemeGallery();drawThemeInputs();drawThemeSkyFields();drawThemePreview();
    themeSay(choice==='auto'?'Auto picks one of six original palettes based on the level seed. To name your own palette, select one and use Rename Theme.':(typeof choice==='string'?'Custom theme selected. Edit colors and sky feature, then Apply to Scene.':'Original Poison palette selected.'));
  }
  function createThemeCard(id,t,host){
    const b=document.createElement('button');b.className='ps-theme-card'+(String(id)===String(themeSelected)?' selected':'');b.dataset.themeChoice=String(id);b.type='button';
    const p=document.createElement('span');p.className='ps-theme-card-color';p.style.background=`linear-gradient(135deg,${t.sky1} 0%,${t.sky2} 50%,${t.top} 51%,${t.solid} 100%)`;
    const n=document.createElement('span');n.textContent=t.name;n.className='ps-theme-card-name';b.append(p,n);
    b.onclick=()=>pickTheme(id);host.append(b);
  }
  function drawThemeGallery(){
    const a=$e('#ps-theme-builtins'),b=$e('#ps-theme-custom-list');a.replaceChildren();b.replaceChildren();
    createThemeCard('auto',{...THEMES[V.seed%BASE_THEME_COUNT],name:'Auto (by seed)'},a);
    for(let i=0;i<BASE_THEME_COUNT;i++)createThemeCard(i,THEMES[i],a);
    for(const [id,t] of CUSTOM_THEMES)createThemeCard(id,t,b);
    if(!CUSTOM_THEMES.size){const empty=document.createElement('div');empty.className='ps-theme-empty';empty.textContent='No custom themes yet. Duplicate a palette, edit colors, then save it here.';b.append(empty);}
    $e('#ps-theme-count').textContent=CUSTOM_THEMES.size+' SAVED';
    const editable=typeof themeSelected==='string'&&themeSelected.startsWith('custom:');
    $e('#ps-theme-delete').disabled=!editable;
    $e('#ps-theme-update').disabled=!editable;
  }

  const SKY_BASIC=[['x','Horizontal position','%'],['y','Vertical position','%'],['size','Object size','px'],['glow','Glow strength','%']];
  const SKY_PALETTE=[['primary','Main color'],['secondary','Light color'],['tertiary','Accent color']];
  const SKY_GALAXY=[['galaxyWidth','Nebula width','%'],['galaxyHeight','Nebula height','%'],['angle','Band angle','°'],['glow','Nebula brightness','%'],['x','Bright core X','%'],['y','Bright core Y','%']];
  function drawThemeSkyFields(){
    const mode=themeDraft.skyFx, box=$e('#ps-sky-controls'),host=$e('#ps-sky-controls-grid');
    box.hidden=mode==='none';
    if(mode==='none'){$e('#ps-sky-caption').textContent='Clear sky. Stars are configurable below.';host.replaceChildren();return;}
    $e('#ps-sky-caption').textContent=mode==='galaxy'?'Full-sky pixel nebula behind the parallax mountains. Use angle and width to shape its luminous band.':mode==='multimoon'?'Position the primary moon and arrange the smaller moons around it.':'Place the celestial body and tune its brightness and color.';
    const fields=mode==='galaxy'?SKY_GALAXY:[...SKY_BASIC,...(mode==='multimoon'?[['count','Moon count',''],['spread','Moon spacing','px']]:[])];
    fields.push(['starDensity','Background stars','']);
    host.innerHTML=fields.map(([key,label,unit])=>{
      const [min,max]=CELESTIAL_RANGES[key],value=themeDraft.celestial[key];
      return `<label class="ps-sky-field"><span>${themeEsc(label)} <output class="ps-sky-reading" data-sky-out="${key}">${value}${unit}</output></span><input data-sky-key="${key}" type="range" min="${min}" max="${max}" step="1" value="${value}"></label>`;
    }).join('')+'<div class="ps-sky-section-title">SKY COLORS</div>'+SKY_PALETTE.map(([key,label])=>`<label class="ps-sky-field"><span>${label}</span><input type="color" data-sky-color="${key}" value="${themeDraft.celestial[key]}"></label>`).join('')+
    '<div class="ps-sky-tip">For Galaxy, colors control the nebula clouds. For moons, they control the main moon and smaller moons. The parallax mountains stay visible in front.</div>';
  }
  function drawThemeSkyPreview(t){
    const canvas=$e('#ps-theme-skycanvas'),g=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height,opts=t.celestial;
    g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
    const a=hexRgb(t.sky1),b=hexRgb(t.sky2);
    for(let y=0;y<h;y+=4){const u=y/(h-1);g.fillStyle='rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*u)).join(',')+')';g.fillRect(0,y,w,4);}
    if(t.skyFx==='galaxy')drawGalaxyBackdrop(g,w,h,opts,0,0,true);
    for(let i=0;i<Math.min(opts.starDensity,160);i++){
      const x=Math.floor(hash2(i,21)*w),y=Math.floor(hash2(i,22)*h*.8);
      g.globalAlpha=.25+hash2(i,23)*.6;g.fillStyle='#dcecff';g.fillRect(x,y,1,1);
    }
    g.globalAlpha=1;
    renderCelestial(g,w,h,t.skyFx,opts);
  }

  function drawThemeInputs(){
    function inputs(host,fields){
      host.innerHTML=fields.map(([key,label])=>`<label class="ps-theme-color-field"><span>${themeEsc(label)}</span><input type="color" data-color-key="${key}" value="${themeDraft[key]}"><output data-color-display="${key}">${themeDraft[key].toUpperCase()}</output></label>`).join('');
    }
    inputs($e('#ps-theme-basic'),BASIC_FIELDS);inputs($e('#ps-theme-extra'),ADV_FIELDS);
    const zh=$e('#ps-theme-zones');zh.innerHTML=[1,2,3].map(i=>`<label class="ps-theme-color-field"><span>Zone ${i+1} glow</span><input type="color" data-zone-color="${i}" value="${themeRgbToHex(themeDraft.zg[i])}"><output data-zone-display="${i}">${themeRgbToHex(themeDraft.zg[i]).toUpperCase()}</output></label>`).join('');
    const group=$e('#ps-theme-name');group.value=themeDraft.name;
  }
  function drawThemePreview(){
    const t=themeDraft,art=$e('#ps-theme-preview-art');
    for(const k of THEME_COLOR_KEYS)art.style.setProperty('--th-'+k,t[k]);
    for(let i=1;i<4;i++)art.style.setProperty('--th-zone'+i,themeRgbToHex(t.zg[i]));
    $e('#ps-theme-preview-label').textContent=t.name.toUpperCase();
    drawThemeSkyPreview(t);
    const strip=$e('#ps-theme-swatch-strip');strip.replaceChildren();
    for(const k of ['sky1','sky2','mtn1','mtn2','solid','top','grass','hazard','gem','spring','crystal','ready']){
      const sw=document.createElement('span');sw.style.background=t[k];sw.title=k+': '+t[k];strip.append(sw);
    }
    for(let i=1;i<=3;i++){const sw=document.createElement('span');sw.style.background=themeRgbToHex(t.zg[i]);sw.title='Zone '+(i+1)+' glow';strip.append(sw);}
    $e('#ps-theme-current').textContent=V.theme==='auto'?'AUTO (BY SEED)':activeThemeName.toUpperCase();
  }
  function toggleThemeWindow(force){
    const show=typeof force==='boolean'?force:!themeWindow.classList.contains('open');
    if(show){hideModal();pickTheme(V.theme);themeWindow.classList.add('open');themeWindow.setAttribute('aria-hidden','false');}
    else{themeWindow.classList.remove('open');themeWindow.setAttribute('aria-hidden','true');}
    $e('#ps-theme-toggle').classList.toggle('active',show);
    $e('#ps-theme-toggle').setAttribute('aria-expanded',String(show));
    if(show)$e('#ps-theme-close').focus();else $e('#ps-theme-toggle').focus();
  }
  function publishThemeSelection(choice, message){
    V.theme=choice;applyTheme(V.seed);save();commit(message);drawThemeGallery();drawThemePreview();
    themeSay(message+' Saved with this scene.');
    if(window.poisonRuntime?.mode!=='running') { // Single static render, never starts the game loop.
      // The next Play Scene will render the selected palette in the world.
    }
  }
  function createCustomTheme(){
    if(CUSTOM_THEMES.size>=60){themeSay('Custom-theme limit reached (60). Remove an unused palette first.');return null;}
    const newId='custom:'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    const t=normalizeTheme({...themeDraft,name:$e('#ps-theme-name').value.trim()||'My Poison Theme'});
    if(!importCustomTheme(newId,t)){themeSay('Could not save this theme.');return null;}
    saveCustomThemes();return newId;
  }
  function saveAsCustom(){
    const id=createCustomTheme();if(!id)return;
    pickTheme(id);publishThemeSelection(id,'Custom theme saved and applied');
  }
  function renameTheme(){
    const isCustom=typeof themeSelected==='string'&&CUSTOM_THEMES.has(themeSelected);
    const existing=themeDraft.name||'My Poison Theme';
    const entered=window.prompt(isCustom?'Rename this custom theme:':'Name a new custom copy of this theme:',existing);
    if(entered===null)return;
    const name=entered.trim().slice(0,34);
    if(!name){themeSay('Theme name cannot be empty.');return;}
    themeDraft.name=name;
    $e('#ps-theme-name').value=name;
    if(isCustom){
      importCustomTheme(themeSelected,themeDraft);
      saveCustomThemes();
      pickTheme(themeSelected);
      if(V.theme===themeSelected){applyTheme(V.seed);save();}
      drawThemeGallery();
      themeSay('Theme renamed to '+name+'.');
    }else{
      const id=createCustomTheme();
      if(id){pickTheme(id);publishThemeSelection(id,'Named custom theme created');}
    }
  }
  function updateCustom(){
    if(typeof themeSelected!=='string'||!CUSTOM_THEMES.has(themeSelected))return themeSay('Select a custom theme first.');
    importCustomTheme(themeSelected,{...themeDraft,name:$e('#ps-theme-name').value.trim()||themeDraft.name});
    saveCustomThemes();pickTheme(themeSelected);publishThemeSelection(themeSelected,'Custom theme updated');
  }
  function applySelectedTheme(){
    const typed=$e('#ps-theme-name').value.trim();
    if(typed && typed!==themeDraft.name){themeDraft.name=typed;themeDirty=true;}
    if(themeDirty){const newId=createCustomTheme();if(newId){pickTheme(newId);publishThemeSelection(newId,'Edited palette saved and applied');}}
    else publishThemeSelection(themeSelected,'Theme applied');
  }
  function deleteCustomTheme(){
    if(typeof themeSelected!=='string'||!CUSTOM_THEMES.has(themeSelected))return;
    const choice=themeSelected;if(!window.confirm('Delete the saved custom theme "'+CUSTOM_THEMES.get(choice).name+'"?'))return;
    CUSTOM_THEMES.delete(choice);saveCustomThemes();
    if(V.theme===choice){V.theme=0;applyTheme(V.seed);save();commit('Deleted active custom theme');}
    pickTheme(V.theme);themeSay('Custom theme removed.');
  }
  $e('#ps-theme-toggle').onclick=()=>toggleThemeWindow();
  $e('#ps-theme-close').onclick=()=>toggleThemeWindow(false);
  $e('#ps-theme-window').addEventListener('pointerdown',e=>{if(e.target===themeWindow)toggleThemeWindow(false);});
  $e('#ps-theme-advanced').onclick=()=>{
    themeAdvanced=!themeAdvanced;$e('#ps-theme-advanced-content').hidden=!themeAdvanced;
    $e('#ps-theme-advanced').setAttribute('aria-expanded',String(themeAdvanced));
    $e('#ps-theme-advanced').querySelector('span').textContent=themeAdvanced?'▴':'▾';
  };
  $e('#ps-theme-name').addEventListener('input',e=>{themeDraft.name=e.target.value.slice(0,34);themeChanged();});
  $e('#ps-theme-skyfx').addEventListener('change',e=>{
    const before=themeDraft.skyFx,after=e.target.value;
    const old=CELESTIAL_PALETTES[before]||{};
    const next=CELESTIAL_PALETTES[after]||{};
    if(['primary','secondary','tertiary'].every(k=>themeDraft.celestial[k]===old[k]))for(const k of ['primary','secondary','tertiary'])themeDraft.celestial[k]=next[k];
    themeDraft.skyFx=after;drawThemeSkyFields();themeChanged();
  });
  $e('#ps-sky-controls').addEventListener('input',e=>{const key=e.target.dataset.skyKey,color=e.target.dataset.skyColor;if(key&&CELESTIAL_RANGES[key]){themeDraft.celestial[key]=Number(e.target.value);const unit=key==='x'||key==='y'||key==='glow'||key==='galaxyWidth'||key==='galaxyHeight'?'%':key==='angle'?'°':key==='size'||key==='spread'?'px':'';const out=$e('#ps-sky-controls').querySelector('[data-sky-out="'+key+'"]');if(out)out.textContent=e.target.value+unit;themeChanged();}else if(color&&['primary','secondary','tertiary'].includes(color)&&validHex(e.target.value)){themeDraft.celestial[color]=e.target.value;themeChanged();}});
  themeWindow.addEventListener('input',e=>{
    const key=e.target.dataset.colorKey,zone=e.target.dataset.zoneColor;
    if(key&&THEME_COLOR_KEYS.includes(key)&&validHex(e.target.value)){
      themeDraft[key]=e.target.value.toLowerCase();
      const output=themeWindow.querySelector('[data-color-display="'+key+'"]');if(output)output.value=e.target.value.toUpperCase();
      themeChanged();
    }else if(zone){const i=Number(zone);if(i>=1&&i<=3&&validHex(e.target.value)){
      themeDraft.zg[i]=themeHexToRgb(e.target.value);
      const output=themeWindow.querySelector('[data-zone-display="'+i+'"]');if(output)output.value=e.target.value.toUpperCase();
      themeChanged();
    }}
  });
  $e('#ps-theme-reset').onclick=()=>pickTheme(themeSelected);
  $e('#ps-theme-rename').onclick=renameTheme;
  $e('#ps-theme-save').onclick=saveAsCustom;
  $e('#ps-theme-update').onclick=updateCustom;
  $e('#ps-theme-apply').onclick=applySelectedTheme;
  $e('#ps-theme-delete').onclick=deleteCustomTheme;

  function safeText(str) { return String(str).replace(/[&<>"']/g, x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])); }
  function prop(k, key, fallback) { const v=params.get(k)?.[key]; return typeof v === 'number' && isFinite(v) ? v : fallback; }
