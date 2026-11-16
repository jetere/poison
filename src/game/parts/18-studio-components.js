  /* ---------- Poison Creator: custom components and prefab authoring ---------- */
  const PREFAB_KEY='poison_prefabs_v1',prefabs=new Map();
  let allowScripts=false;
  const deep=v=>JSON.parse(JSON.stringify(v));
  const hex=v=>/^#[\da-f]{6}$/i.test(String(v||''))?v:'#83dff1';
  const limit=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):fallback;
  const SCRIPT_EXAMPLE=`({
  onStart(api) {
    api.log('Object ready: ' + api.id);
  },
  onUpdate(api, dt) {
    // Example: gentle movement to the right
    // api.move(20 * dt, 0);
  },
  onCollisionEnter(api, other) {
    if (other.tag === 'player') {
      // api.bouncePlayer(250);
    }
  }
})`;
  function makeCustom(kind='empty',label='Custom Object'){
    const d={name:label,tags:'',components:{
      sprite:{enabled:true,shape:'box',color:'#83dff1',width:16,height:16,glow:true,image:'',frames:1,fps:8},
      collider:{enabled:true,solid:false,harmful:false},
      body:{enabled:false,gravity:900,vx:0,vy:0,bounce:0},
      health:{enabled:false,max:3},
      audio:{enabled:false,cue:'crystal',volume:0.8,fileData:''},
      behavior:{type:'none',speed:45,range:48,axis:'x',strength:260,target:'door'},
      script:{enabled:false,code:SCRIPT_EXAMPLE,props:{}}
    }};
    const {sprite,collider,behavior}=d.components;
    if(kind==='patrol'){d.name=label==='Custom Object'?'Patrol Enemy':label;d.tags='enemy';sprite.color='#f56e81';collider.harmful=true;behavior.type='patrol';}
    if(kind==='collect'){d.name=label==='Custom Object'?'Collectible':label;d.tags='pickup';sprite.shape='diamond';sprite.color='#ffd46d';collider.enabled=true;behavior.type='collect';}
    if(kind==='door'){d.name=label==='Custom Object'?'Door':label;d.tags='door';sprite.color='#78a5f1';sprite.width=16;sprite.height=32;collider.solid=true;behavior.type='door';}
    if(kind==='switch'){d.name=label==='Custom Object'?'Floor Switch':label;d.tags='switch';sprite.width=16;sprite.height=8;sprite.color='#eac47e';behavior.type='switch';behavior.target='door';}
    if(kind==='bounce'){d.name=label==='Custom Object'?'Bounce Pad':label;d.tags='spring';sprite.width=24;sprite.height=8;sprite.color='#fc94df';behavior.type='bounce';}
    if(kind==='follow'){d.name=label==='Custom Object'?'Chaser Enemy':label;d.tags='enemy';sprite.color='#ff956c';collider.harmful=true;behavior.type='follow';}
    if(kind==='checkpoint'){d.name=label==='Custom Object'?'Checkpoint':label;sprite.color='#93f9b7';behavior.type='checkpoint';}
    return d;
  }
  function cleanCustom(src){
    const base=makeCustom();if(!src||typeof src!=='object')return base;
    base.name=String(src.name||base.name).slice(0,60);base.tags=String(src.tags||'').slice(0,100);if(typeof src.prefabId==='string'&&/^pf_[\w-]{2,90}$/.test(src.prefabId))base.prefabId=src.prefabId;
    const c=src.components||{};
    for(const comp of ['sprite','collider','body','health','audio','behavior','script']){
      const input=c[comp];if(!input||typeof input!=='object')continue;
      for(const key of Object.keys(base.components[comp])){
        const old=base.components[comp][key],v=input[key];
        if(typeof old==='boolean'&&typeof v==='boolean')base.components[comp][key]=v;
        else if(typeof old==='number'&&Number.isFinite(v))base.components[comp][key]=limit(v,-2000,2500,old);
        else if(typeof old==='string'&&typeof v==='string')base.components[comp][key]=v.slice(0,key==='code'?7000:key==='image'?150000:key==='fileData'?480000:100);
      }
    }
    const s=base.components.sprite,co=base.components.collider,b=base.components.body,h=base.components.health,be=base.components.behavior,sc=base.components.script;
    s.color=hex(s.color);s.width=limit(s.width,4,128,16);s.height=limit(s.height,4,128,16);s.frames=Math.round(limit(s.frames,1,8,1));s.fps=limit(s.fps,1,24,8);
    if(!['box','circle','diamond','image'].includes(s.shape))s.shape='box';
    if(s.image&&!/^data:image\/(png|webp|jpeg);base64,/.test(s.image))s.image='';
    b.gravity=limit(b.gravity,-1000,2500,900);b.vx=limit(b.vx,-450,450,0);b.vy=limit(b.vy,-450,450,0);b.bounce=limit(b.bounce,0,1,0);
    h.max=limit(h.max,1,999,3);const au=base.components.audio;au.volume=limit(au.volume,0,1,0.8);if(!['crystal','gem','spring','lever','gate','break','death','jump','tick','whoosh','zap','clunk','checkpoint'].includes(au.cue))au.cue='crystal';if(au.fileData&&!/^data:audio\/(wav|mpeg|ogg|webm|mp3);base64,/.test(au.fileData))au.fileData='';be.speed=limit(be.speed,0,500,45);be.range=limit(be.range,1,800,48);be.strength=limit(be.strength,40,600,260);
    if(!['none','patrol','oscillate','follow','collect','door','switch','bounce','checkpoint','hazard'].includes(be.type))be.type='none';
    if(!['x','y'].includes(be.axis))be.axis='x';be.target=String(be.target||'door').slice(0,40);
    sc.code=String(sc.code||'').slice(0,7000);sc.props={};
    if(c.script?.props&&typeof c.script.props==='object')for(const [k,v] of Object.entries(c.script.props).slice(0,20)){if(/^[a-zA-Z_][\w]{0,25}$/.test(k)&&(typeof v==='string'||typeof v==='number'||typeof v==='boolean'))sc.props[k]=typeof v==='string'?v.slice(0,80):v;}
    return base;
  }
  function savePrefabs(){try{localStorage.setItem(PREFAB_KEY,JSON.stringify([...prefabs]));}catch(e){say('Prefab storage full. Export the scene JSON to keep assets.');}}
  function addPrefab(data,id){
    const key=id||'pf_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    const pf=cleanCustom(data);prefabs.set(key,pf);
    if(!BY['pf:'+key]){const it={id:'pf:'+key,n:pf.name,glyph:'✦',col:pf.components.sprite.color,grp:'My Prefabs',prefab:true};ITEMS.push(it);BY[it.id]=it;}
    else{BY['pf:'+key].n=pf.name;BY['pf:'+key].col=pf.components.sprite.color;}
    return key;
  }
  function loadPrefabs(){try{const d=JSON.parse(localStorage.getItem(PREFAB_KEY)||'[]');if(Array.isArray(d))for(const item of d.slice(0,100)){if(Array.isArray(item)&&typeof item[0]==='string'&&item[0].length<100)addPrefab(item[1],item[0]);}}catch(e){}}
  function createCustom(kind='empty'){
    const p=makeCustom(kind),key=addPrefab(p);savePrefabs();renderAssets();setAsset('pf:'+key);say('Created '+p.name+'. Click the scene to place it; select it to edit components.');
  }
  function showCreateCustom(){
    modal(`<h2>New Poison Object</h2><p>Start from a reusable object template. Place it on the scene, select it, and edit any component in the Inspector. Save the finished object as a prefab.</p>
    <div class="ps-creator-grid">${[
      ['empty','✦ Empty Object','Build from basic components'],['patrol','✺ Patrol Enemy','Moves between two points and hurts player'],
      ['follow','➜ Chaser Enemy','Pursues the player in range'],['collect','◆ Collectible','Adds to gem counter on contact'],
      ['door','▣ Door','Solid until a tagged switch opens it'],['switch','⏻ Switch','Opens doors sharing a target tag'],
      ['bounce','↥ Bounce Pad','Launches the player upwards'],['checkpoint','⚑ Checkpoint','Changes the respawn position']
    ].map(([k,g,n])=>`<button class="ps-template" data-create="${k}"><b>${g}</b><br><span class="ps-muted">${n}</span></button>`).join('')}</div><p class="ps-muted">Custom objects are Poison-only for now. You can combine components, behaviors, and isolated scripts.</p><div style="text-align:right"><button id="ps-modal-cancel">Cancel</button></div>`);
    $e('#ps-modal-content').classList.remove('ps-object-reveal');void $e('#ps-modal-content').offsetWidth;$e('#ps-modal-content').classList.add('ps-object-reveal');
    el.querySelectorAll('[data-create]').forEach(b=>b.onclick=()=>{hideModal();createCustom(b.dataset.create);});
    $e('#ps-modal-cancel').onclick=hideModal;
  }
  function customFrom(k){const v=params.get(k)?.custom;return cleanCustom(v||makeCustom());}
  const num=(path,label,v,min,max,step)=>`<label class="ps-editrow"><span>${label}</span><input data-custom="${path}" type="number" value="${Number(v)}" min="${min}" max="${max}" step="${step}"></label>`;
  const check=(path,label,val)=>`<label class="ps-checkrow"><input data-custom="${path}" type="checkbox" ${val?'checked':''}> ${label}</label>`;
  let expandedComponents=new Set([0,1,5]);
  function drawCustomInspector(k){
    const ins=$e('#ps-inspector');const prior=[...ins.querySelectorAll('details.ps-component')];if(prior.length)expandedComponents=new Set(prior.map((d,i)=>d.open?i:-1).filter(i=>i>=0));
    const o=customFrom(k),comp=o.components,[x,y]=P(k),s=comp.sprite,co=comp.collider,b=comp.body,h=comp.health,be=comp.behavior,sc=comp.script;
    const select=(path,label,current,options)=>`<label class="ps-editrow"><span>${label}</span><select data-custom="${path}">${options.map(([v,n])=>`<option value="${v}"${current===v?' selected':''}>${n}</option>`).join('')}</select></label>`;
    ins.innerHTML=`<div class="ps-customhead"><div class="ps-customicon" style="background:${s.color}">✦</div><div><b>${safeText(o.name)}</b><div class="ps-muted">Custom GameObject · Poison components</div></div></div>
    <div class="ps-section">Identity &amp; Transform</div>
    <label class="ps-editrow">Name<input data-custom="name" value="${safeText(o.name)}" maxlength="60"></label>
    <label class="ps-editrow">Tags (comma-separated)<input data-custom="tags" value="${safeText(o.tags)}" maxlength="100" placeholder="enemy, boss"></label>
    <div class="ps-coords">${num('position.x','X tile',x,-3000,3000,1)}${num('position.y','Y tile',y,-3000,3000,1)}</div>
    <details class="ps-component" open><summary>🎨 Sprite Renderer</summary>
      ${check('sprite.enabled','Visible sprite',s.enabled)}
      ${select('sprite.shape','Shape',s.shape,[['box','3D box'],['circle','Round gem'],['diamond','Diamond'],['image','Pixel sprite image']])}
      <label class="ps-editrow">Tint<input data-custom="sprite.color" type="color" value="${s.color}"></label>
      <div class="ps-coords">${num('sprite.width','Width (px)',s.width,4,128,1)}${num('sprite.height','Height (px)',s.height,4,128,1)}</div>
      ${check('sprite.glow','Emissive glow',s.glow)}
      <div class="ps-coords">${num('sprite.frames','Frames across',s.frames,1,8,1)}${num('sprite.fps','Animation FPS',s.fps,1,24,1)}</div>
      <label class="ps-editrow">Import PNG/WebP/JPEG sprite (max 1 MB). Horizontal sheets have one frame per column.<input type="file" id="ps-custom-image" accept="image/png,image/jpeg,image/webp"></label>
      ${s.image?'<div class="ps-sprite-preview"><img src="'+safeText(s.image)+'" alt="Imported sprite"><button id="ps-remove-image">Remove image</button></div>':''}
    </details>
    <details class="ps-component" open><summary>▦ Collider</summary>
      ${check('collider.enabled','Enable collision',co.enabled)}${check('collider.solid','Solid (blocks player)',co.solid)}${check('collider.harmful','Dangerous on touch',co.harmful)}
    </details>
    <details class="ps-component"><summary>↓ Rigidbody / Physics</summary>
      ${check('body.enabled','Simulate gravity',b.enabled)}${num('body.gravity','Gravity (px/s²)',b.gravity,-1000,2500,10)}
      <div class="ps-coords">${num('body.vx','Velocity X',b.vx,-450,450,5)}${num('body.vy','Velocity Y',b.vy,-450,450,5)}</div>
      ${num('body.bounce','Bounce (0 to 1)',b.bounce,0,1,0.05)}
    </details>
    <details class="ps-component"><summary>♥ Health</summary>${check('health.enabled','Enable health',h.enabled)}${num('health.max','Max HP',h.max,1,999,1)}</details>
    <details class="ps-component"><summary>♫ Audio</summary>
      ${check('audio.enabled','Play sound on contact',comp.audio.enabled)}
      ${select('audio.cue','Sound cue',comp.audio.cue,['crystal','gem','spring','lever','gate','break','death','jump','tick','whoosh','zap','clunk','checkpoint'].map(v=>[v,v]))}
      ${num('audio.volume','Volume',comp.audio.volume,0,1,.05)}
      <label class="ps-editrow">Optional custom audio (max 350 KB)<input type="file" id="ps-custom-audio" accept="audio/wav,audio/mpeg,audio/ogg,audio/webm"></label>
      ${comp.audio.fileData?'<div class="ps-flex" style="margin:10px"><span class="ps-muted">Custom audio attached</span><button id="ps-remove-audio">Remove</button></div>':''}
    </details>
    <details class="ps-component" open><summary>⚙ Built-in Behavior (no code)</summary>
      ${select('behavior.type','Behavior',be.type,[['none','None'],['patrol','Patrol'],['oscillate','Oscillate'],['follow','Follow player'],['collect','Collectible'],['door','Door'],['switch','Switch / open doors'],['bounce','Bounce pad'],['checkpoint','Checkpoint'],['hazard','Hazard']])}
      ${select('behavior.axis','Movement axis',be.axis,[['x','Horizontal X'],['y','Vertical Y']])}
      <div class="ps-coords">${num('behavior.speed','Speed (px/s)',be.speed,0,500,5)}${num('behavior.range','Range (px)',be.range,1,800,4)}</div>
      ${num('behavior.strength','Bounce force',be.strength,40,600,10)}
      <label class="ps-editrow">Target door tag<input data-custom="behavior.target" value="${safeText(be.target)}" maxlength="40"></label>
    </details>
    <details class="ps-component"><summary>⌘ Script Component</summary>
      ${check('script.enabled','Attach JavaScript behavior',sc.enabled)}
      <p class="ps-note">Code runs only when you explicitly enable scripts at the top of Studio. It executes in an isolated, no-network iframe and uses a limited object API.</p>
      <label class="ps-editrow">Script variables (JSON object)<textarea class="ps-script-editor ps-props-editor" id="ps-script-props" spellcheck="false"></textarea></label>
      <textarea class="ps-script-editor" id="ps-script-code" spellcheck="false"></textarea>
      <div class="ps-flex"><button id="ps-script-help">API reference</button><button id="ps-script-reset">Insert example</button></div>
    </details>
    <div class="ps-section">Prefabs / reusable objects</div>
    <div class="ps-flex"><button id="ps-as-prefab" class="ps-primary">Save as Prefab</button>${o.prefabId?'<button id="ps-update-prefab">Update Prefab</button>':''}<button id="ps-custom-copy">Duplicate</button><button id="ps-custom-delete">Delete</button></div>
    <p class="ps-note">Instance properties live in this scene. Save as Prefab to reuse the object in another place or level. Existing prefab instances do not change automatically.</p>`;
    ins.querySelectorAll('details.ps-component').forEach((d,i)=>{d.open=expandedComponents.has(i);});
    $e('#ps-script-code').value=sc.code;$e('#ps-script-props').value=JSON.stringify(sc.props||{},null,2);
    ins.querySelectorAll('[data-custom]').forEach(inp=>{
      inp.addEventListener('change',()=>{
        const path=inp.dataset.custom,v=inp.type==='checkbox'?inp.checked:inp.type==='number'?Number(inp.value):inp.value;
        if(path.startsWith('position.')){
          const nx=path==='position.x'?Math.round(v):x,ny=path==='position.y'?Math.round(v):y,nk=K(nx,ny);
          if(!valid(nx)||!valid(ny)||(nk!==k&&objs.has(nk))){say('That position is occupied or out of bounds.');renderInspector();return;}
          if(nk!==k){objs.delete(k);objs.set(nk,'custom');params.set(nk,deep(params.get(k)||{}));params.delete(k);selection.clear();selection.add(nk);}
        }else{
          const custom=customFrom(k);
          if(path==='name'||path==='tags')custom[path]=String(v);
          else{const [part,key]=path.split('.');if(custom.components[part])custom.components[part][key]=v;}
          params.set(k,{...params.get(k),custom:cleanCustom(custom)});
        }
        commit('Updated custom object');redrawAll();
      });
    });
    $e('#ps-script-props').addEventListener('change',e=>{try{const value=JSON.parse(e.target.value||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Use a JSON object');const custom=customFrom(k);custom.components.script.props=value;params.set(k,{...params.get(k),custom:cleanCustom(custom)});commit('Updated script variables');redrawAll();}catch(ex){say('Script variables: '+ex.message);}});
    $e('#ps-script-code').addEventListener('change',e=>{const custom=customFrom(k);custom.components.script.code=e.target.value.slice(0,7000);params.set(k,{...params.get(k),custom});commit('Updated script');redrawAll();});
    $e('#ps-script-reset').onclick=()=>{const custom=customFrom(k);custom.components.script.code=SCRIPT_EXAMPLE;params.set(k,{...params.get(k),custom});commit('Inserted script example');redrawAll();};
    $e('#ps-script-help').onclick=showScriptHelp;
    $e('#ps-custom-image').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;if(file.size>1000000)return say('Image exceeds 1 MB. Use a small pixel sprite.');
      try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=data;});
        const custom=customFrom(k);const frames=custom.components.sprite.frames;const c=document.createElement('canvas');c.width=20*frames;c.height=20;const a=c.getContext('2d');a.imageSmoothingEnabled=false;a.drawImage(img,0,0,c.width,c.height);custom.components.sprite.image=c.toDataURL('image/png');custom.components.sprite.shape='image';params.set(k,{...params.get(k),custom});commit('Imported sprite image');redrawAll();
      }catch(err){say('Could not import sprite: '+err.message);}
    };
    $e('#ps-custom-audio').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>350000)return say('Audio too large for a portable scene. Limit 350 KB.');try{const data=await new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=reject;rd.readAsDataURL(file);});const custom=customFrom(k);custom.components.audio.fileData=data;custom.components.audio.enabled=true;params.set(k,{...params.get(k),custom:cleanCustom(custom)});commit('Imported custom audio');redrawAll();}catch(err){say('Could not import audio: '+err.message);}};
    if($e('#ps-remove-audio'))$e('#ps-remove-audio').onclick=()=>{const custom=customFrom(k);custom.components.audio.fileData='';params.set(k,{...params.get(k),custom});commit('Removed custom audio');redrawAll();};
    if($e('#ps-remove-image'))$e('#ps-remove-image').onclick=()=>{const custom=customFrom(k);custom.components.sprite.image='';custom.components.sprite.shape='box';params.set(k,{...params.get(k),custom});commit('Removed sprite image');redrawAll();};
    $e('#ps-as-prefab').onclick=()=>{const custom=customFrom(k);const pname=prompt('Name for this reusable prefab:',custom.name);if(!pname)return;custom.name=pname.slice(0,60);const id=addPrefab(custom);custom.prefabId=id;params.set(k,{...params.get(k),custom});savePrefabs();commit('Saved prefab');renderAssets();redrawAll();say('Prefab "'+custom.name+'" saved. Find it under My Prefabs.');};
    if($e('#ps-update-prefab'))$e('#ps-update-prefab').onclick=()=>{const custom=customFrom(k);if(!prefabs.has(custom.prefabId))return say('Prefab not found. Save as a new prefab.');addPrefab(custom,custom.prefabId);savePrefabs();renderAssets();say('Updated prefab for future placements.');};
    $e('#ps-custom-copy').onclick=duplicateSelection;$e('#ps-custom-delete').onclick=deleteSelection;
  }
  function showScriptHelp(){modal(`<h2>Poison Object Script API</h2><p>The script is a JavaScript object expression. Add <code>onStart(api)</code>, <code>onUpdate(api, dt)</code>, and <code>onCollisionEnter(api, other)</code> hooks.</p>
    <div class="ps-codehelp"><b>Read-only values:</b> api.x, api.y, api.w, api.h, api.player, api.props, api.state (local script state)<br><br>
    <b>Allowed actions:</b><br>api.move(dx,dy)<br>api.setVelocity(vx,vy)<br>api.setColor('#ff6688')<br>api.setVisible(true/false)<br>api.playSound('spring')<br>api.damageSelf(1)<br>api.healSelf(1)<br>api.openTag('door')<br>api.bouncePlayer(260)<br>api.damagePlayer()<br>api.collect() (collectible objects)<br>api.destroy()<br>api.log('message')<br><br>
    <b>Collision:</b> <code>other.tag === 'player'</code> when the player first touches the object.<br>Move distances are pixels per frame; multiply speeds by <code>dt</code>.<br><br>
    Script calls are queued into a restricted API. HTML, network, file access and direct game internals are unavailable inside the sandbox. Complex or infinite loops can still hurt performance; run only scripts you trust.</div>
    <div class="ps-flex" style="justify-content:end;margin-top:15px"><button id="ps-help-close" class="ps-primary">Close</button></div>`);$e('#ps-help-close').onclick=hideModal;}
  function requestScriptPermission(){
    if(allowScripts){allowScripts=false;$e('#ps-scripts').textContent='⌘ Scripts OFF';$e('#ps-scripts').classList.remove('ps-script-on');customRuntime.approve(false);say('Custom scripts disabled.');return;}
    modal(`<h2>Enable Custom Scripts?</h2><p>Scenes and prefabs can contain user-written JavaScript. Scripts are off by default, especially after importing a scene.</p>
    <p>Poison runs scripts inside a sandboxed iframe with no network access, and scripts communicate with the game only through an approved command list. Nevertheless, scripts can affect gameplay or performance. Enable only for projects you trust.</p>
    <div class="ps-flex" style="justify-content:end"><button id="ps-script-cancel">Cancel</button><button id="ps-script-allow" class="ps-primary">Enable for this scene</button></div>`);
    $e('#ps-script-cancel').onclick=hideModal;
    $e('#ps-script-allow').onclick=()=>{allowScripts=true;$e('#ps-scripts').textContent='⌘ Scripts ON';$e('#ps-scripts').classList.add('ps-script-on');hideModal();say('Scripts enabled for this scene. Press Play scene to test them.');};
  }
  function disableScripts(){allowScripts=false;customRuntime.approve(false);const b=$e('#ps-scripts');if(b){b.textContent='⌘ Scripts OFF';b.classList.remove('ps-script-on');}}
  loadPrefabs();

  function mapSummary() {
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    const expand=k=>{const [c,r]=P(k);minX=Math.min(minX,c);maxX=Math.max(maxX,c);minY=Math.min(minY,r);maxY=Math.max(maxY,r);};
    tiles.forEach((v,k)=>expand(k));objs.forEach((v,k)=>expand(k));
    if(!isFinite(minX))return {minX:0,minY:0,maxX:40,maxY:25};
    return {minX,minY,maxX,maxY};
  }
  function paintDemo(which='starter') {
    tiles.clear();objs.clear();params.clear();selection.clear();tileSelection=null;
    if(which==='blank'){objs.set(K(3,7),'player');objs.set(K(35,7),'flag');}
    if(which==='starter'){
      for(let c=0;c<52;c++)for(let r=10;r<14;r++) if(c<16 || c>20 && c<34 || c>38) tiles.set(K(c,r),1);
      [25,26,42].forEach(c=>tiles.set(K(c,9),2));
      objs.set(K(3,9),'player');objs.set(K(48,9),'flag');objs.set(K(13,9),'cp');objs.set(K(19,8),'gem');objs.set(K(36,9),'spring');objs.set(K(43,7),'saw');
    }
    if(which==='vertical'){
      for(let c=0;c<28;c++)for(let r=24;r<29;r++) tiles.set(K(c,r),1);
      for(let c=9;c<18;c++)tiles.set(K(c,17),1);
      for(let c=19;c<27;c++)tiles.set(K(c,11),1);
      for(let c=3;c<11;c++)tiles.set(K(c,5),1);
      objs.set(K(3,23),'player');objs.set(K(5,4),'flag');objs.set(K(17,16),'cp');objs.set(K(18,23),'spring');objs.set(K(22,9),'gem');objs.set(K(11,17),'lift');
    }
    if(which==='creator'){paintDemo('starter');const specs=[[6,9,makeCustom('switch')],[12,8,makeCustom('door')],[29,8,makeCustom('patrol')],[31,7,makeCustom('collect')]];specs.forEach(([x,y,p])=>{const id=addPrefab(p),k=K(x,y);p.prefabId=id;objs.set(k,'custom');params.set(k,{custom:p});});savePrefabs();}
    cam.x=-7;cam.y=-3;cam.z=20;currentSelection();
  }
  function currentSelection() {selection.clear();tileSelection=null;}
  function cloneData() {return {tiles:[...tiles],objs:[...objs],params:[...params].map(([k,v])=>[k,deep(v)]),theme:V.theme,themeData:typeof V.theme==='string'&&CUSTOM_THEMES.has(V.theme)?normalizeTheme(CUSTOM_THEMES.get(V.theme)):null};}
  function loadSnapshot(s) {tiles.clear();objs.clear();params.clear();s.tiles.forEach(([k,v])=>tiles.set(k,v));s.objs.forEach(([k,v])=>objs.set(k,v));s.params.forEach(([k,v])=>params.set(k,deep(v)));if(s.themeData&&typeof s.theme==='string'&&s.theme.startsWith('custom:')){importCustomTheme(s.theme,s.themeData);saveCustomThemes();}if(s.theme!==undefined){V.theme=s.theme;applyTheme(V.seed);save();}currentSelection();redrawAll();}
  function saveCurrent() { try{localStorage.setItem(CK,JSON.stringify(serialize()));$e('#ps-autosave').textContent='Autosaved';}catch(e){$e('#ps-autosave').textContent='Autosave unavailable';} }
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveCurrent,350);}
  function updateHistoryButtons(){$e('#ps-undo').disabled=historyIndex===0;$e('#ps-redo').disabled=historyIndex>=history.length-1;}
  function resetHistory(){history=[cloneData()];historyIndex=0;updateHistoryButtons();scheduleSave();}
  function commit(label='Scene updated'){
    const snap=cloneData();if(JSON.stringify(snap)===JSON.stringify(history[historyIndex]))return;
    history.length=historyIndex+1;history.push(snap);if(history.length>HISTORY_LIMIT)history.shift();historyIndex=history.length-1;
    updateHistoryButtons();scheduleSave();say(label);redrawAll();
  }
  function undo(){if(historyIndex<1)return;historyIndex--;loadSnapshot(history[historyIndex]);updateHistoryButtons();scheduleSave();say('Undo');}
  function redo(){if(historyIndex>=history.length-1)return;historyIndex++;loadSnapshot(history[historyIndex]);updateHistoryButtons();scheduleSave();say('Redo');}
  function clearSel(){selection.clear();tileSelection=null;}
  const visible = id => (BY[id]?.tile ? visTerrain : visObjects);
  const locked = id => (BY[id]?.tile ? lockTerrain : lockObjects);
  function setAsset(id){if(!BY[id])return;cur=id;layer=BY[id].tile?'terrain':'objects';if(mode==='select'||mode==='hand'||mode==='erase'||mode==='fill'&&layer==='objects')mode='brush';clearSel();updateToolButtons();renderAssets();renderInspector();renderCanvas();}
  function setTool(next){mode=next;updateToolButtons();canvas.style.cursor=next==='hand'?'grab':next==='select'?'default':'crosshair';renderCanvas();}
  function updateToolButtons(){el.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===mode));}
  function setLeftTab(t){leftTab=t;$e('#ps-assets').hidden=t!=='assets';$e('#ps-hierarchy').hidden=t!=='hierarchy';el.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));if(t==='hierarchy')renderHierarchy();}
  function renderAssets(){
    const q=$e('#ps-search').value.trim().toLowerCase(), host=$e('#ps-assets-list');host.replaceChildren();let group='';let count=0;
    ITEMS.filter(it=>it.n.toLowerCase().includes(q)||it.grp.toLowerCase().includes(q)).forEach(it=>{
      if(it.grp!==group){group=it.grp;const h=document.createElement('div');h.className='ps-section';h.textContent=group;host.append(h);}
      const b=document.createElement('button');b.className='ps-item'+(cur===it.id?' active':'');b.innerHTML=`<span class="ps-symbol" style="background:${it.col}">${it.glyph}</span><span><span class="ps-itemlabel">${safeText(it.n)}</span><span class="ps-itemsub" style="display:block">${it.tile?'Tile · paintable':'Scene object · editable'}</span></span>`;b.onclick=()=>{setAsset(it.id);};host.append(b);if(it.prefab){const more=document.createElement('button');more.className='ps-prefab-action';more.textContent='⋯  Prefab options';more.onclick=()=>{const pid=it.id.slice(3),p=prefabs.get(pid);if(!p)return;modal(`<h2>${safeText(p.name)}</h2><p>Reusable Poison prefab. Click an instance after placing it to edit components.</p><p><b>Behavior:</b> ${safeText(p.components.behavior.type)}</p><div class="ps-flex"><button id="ps-pf-place" class="ps-primary">Place Instance</button><button id="ps-pf-delete">Delete Prefab</button><button id="ps-pf-close">Close</button></div>`);$e('#ps-pf-place').onclick=()=>{hideModal();setAsset(it.id);};$e('#ps-pf-close').onclick=hideModal;$e('#ps-pf-delete').onclick=()=>{if(!confirm('Delete prefab '+p.name+'? Existing placed objects remain in the scene.'))return;prefabs.delete(pid);ITEMS.splice(ITEMS.indexOf(it),1);delete BY[it.id];if(cur===it.id)cur='custom';savePrefabs();hideModal();renderAssets();};};host.append(more);}count++;
    });if(!count){host.textContent='No matching objects.';}
  }
  function renderHierarchy(){
    const host=$e('#ps-scene-list'),q=$e('#ps-scene-search').value.toLowerCase();host.replaceChildren();const entries=[...objs].sort((a,b)=>{let [ax,ay]=P(a[0]),[bx,by]=P(b[0]);return (BY[a[1]].grp).localeCompare(BY[b[1]].grp)||ax-bx||ay-by;}).filter(([k,id])=>((id==='custom'?customFrom(k).name:BY[id].n)+' '+k).toLowerCase().includes(q));
    const top=document.createElement('div');top.className='ps-muted';top.textContent=entries.length+' objects in scene';host.append(top);
    for(const [key,id] of entries.slice(0,500)){
      const it=BY[id],b=document.createElement('div');b.className='ps-scene-item'+(selection.has(key)?' selected':'');const [c,r]=P(key);
      b.innerHTML=`<span style="color:${it.col};font-size:17px">${it.glyph}</span><span>${safeText(id==='custom'?customFrom(key).name:it.n)}</span><span class="ps-scene-pos">${c},${r}</span>`;
      b.onclick=e=>{if(e.shiftKey){selection.has(key)?selection.delete(key):selection.add(key);}else{selection.clear();selection.add(key);}tileSelection=null;renderInspector();renderHierarchy();renderCanvas();};
      b.ondblclick=()=>{cam.x=c-canvas.width/cam.z/2;cam.y=r-canvas.height/cam.z/2;redrawAll();};host.append(b);
    }
    if(entries.length>500){const n=document.createElement('div');n.className='ps-note';n.textContent='Showing 500 objects. Use the search to narrow this list.';host.append(n);}
  }
  const fld=(id,label,val,min,max,step=1)=>`<div class="ps-property"><label for="${id}">${label}</label><input type="number" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}"></div>`;
  function renderInspector(){
    const ins=$e('#ps-inspector');
    const all=Array.from(selection).filter(k=>objs.has(k));if(all.length!==selection.size){selection.clear();all.forEach(k=>selection.add(k));}
    if(all.length===1){
      const k=all[0],id=objs.get(k),it=BY[id],[x,y]=P(k);
      if(id==='custom'){drawCustomInspector(k);updateBottom();return;}
      ins.innerHTML=`<div class="ps-flex" style="align-items:center;margin-bottom:12px"><span class="ps-symbol" style="background:${it.col};border-radius:6px;display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;font-size:23px;color:#080d17">${it.glyph}</span><div><b style="font-size:15px">${safeText(it.n)}</b><div class="ps-muted">${it.grp} · Scene object</div></div></div>`+
      `<div class="ps-section">Transform</div><div class="ps-coords">${fld('psi-x','X · tile',x,-MAXC,MAXC)}${fld('psi-y','Y · tile',y,-MAXC,MAXC)}</div>`+
      `<div class="ps-flex"><button id="psi-rotate">↻ Rotate (R)</button><button id="psi-flip">⇋ Flip (F)</button></div>`+
      `<div class="ps-section">Object properties</div><div id="psi-properties"></div>`+
      `<div class="ps-flex" style="margin-top:15px"><button id="psi-duplicate">Duplicate</button><button id="psi-delete">Delete</button></div><p class="ps-note">Changes to supported hazard and mover properties affect the actual game when you press Play scene.</p>`;
      const moveInput=()=>{const nx=Math.round(Number($e('#psi-x').value)),ny=Math.round(Number($e('#psi-y').value)),nk=K(nx,ny);if(!valid(nx)||!valid(ny)||nk!==k&&objs.has(nk)){say('Invalid position or another object occupies that cell.');renderInspector();return;}if(nk!==k){const v=objs.get(k),p=params.get(k);objs.delete(k);params.delete(k);objs.set(nk,v);if(p)params.set(nk,p);selection.clear();selection.add(nk);commit('Moved '+it.n);}renderInspector();};
      $e('#psi-x').onchange=moveInput;$e('#psi-y').onchange=moveInput;
      $e('#psi-rotate').onclick=()=>rotate('r');$e('#psi-flip').onclick=()=>rotate('f');
      $e('#psi-delete').onclick=deleteSelection;$e('#psi-duplicate').onclick=duplicateSelection;
      const props=$e('#psi-properties'),fields=PROPERTIES[id]||[];
      if(!fields.length)props.innerHTML='<p class="ps-muted">This object has no extra parameters. Drag it in the scene or adjust its tile coordinates above.</p>';
      fields.forEach(([key,title,def,min,max,step])=>{
        const box=document.createElement('div');box.innerHTML=fld('psi-'+key,title,prop(k,key,def),min,max,step);props.append(box);
        box.querySelector('input').onchange=e=>{const n=Number(e.target.value);if(!isFinite(n)){renderInspector();return;}const p=deep(params.get(k)||{});p[key]=Math.min(max,Math.max(min,n));params.set(k,p);commit('Updated '+title);renderInspector();};
      });
    }else if(all.length>1){
      ins.innerHTML=`<div class="ps-section">Multiple selection</div><h2>${all.length} objects</h2><p class="ps-muted">Move them together by dragging one of the selected objects or with the arrow keys. Copy, duplicate or delete the whole selection.</p><div class="ps-flex"><button id="psi-duplicate">Duplicate</button><button id="psi-delete">Delete selected</button></div>`;
      $e('#psi-duplicate').onclick=duplicateSelection;$e('#psi-delete').onclick=deleteSelection;
    }else if(tileSelection){
      const a=tileSelection,b=(a.x1-a.x0+1)*(a.y1-a.y0+1);
      ins.innerHTML=`<div class="ps-section">Area selection</div><h2>${a.x1-a.x0+1} × ${a.y1-a.y0+1} tiles</h2><p class="ps-muted">X ${a.x0}…${a.x1}<br>Y ${a.y0}…${a.y1}</p><p class="ps-note">Copy or delete this area, including its terrain and objects. Paste with Ctrl+V at the cursor.</p><div class="ps-flex"><button id="psi-duplicate">Duplicate area</button><button id="psi-delete">Delete area</button></div>`;
      $e('#psi-duplicate').onclick=duplicateSelection;$e('#psi-delete').onclick=deleteSelection;
    }else{
      const types={};objs.forEach(id=>types[id]=(types[id]||0)+1);
      ins.innerHTML=`<div class="ps-section">Scene overview</div><h2 style="margin:5px 0 6px">${safeText(name())}</h2><p class="ps-muted">Select an object to edit its location and physics. Choose an asset on the left to paint it directly into the scene.</p>`+
        `<div class="ps-stat"><span>Terrain tiles</span><strong>${tiles.size.toLocaleString()}</strong></div><div class="ps-stat"><span>Scene objects</span><strong>${objs.size.toLocaleString()}</strong></div>`+
        `<div class="ps-stat"><span>Gems</span><strong>${types.gem||0}</strong></div><div class="ps-stat"><span>Checkpoints</span><strong>${types.cp||0}</strong></div>`+
        `<div class="ps-stat"><span>Spawn / goal</span><strong>${types.player||0} / ${types.flag||0}</strong></div>`+
        `<div class="ps-section">Quick actions</div><div class="ps-flex"><button id="psi-frame">Frame scene</button><button id="psi-select">Select objects</button></div>`+
        `<div class="ps-section">Editing tips</div><p class="ps-muted">Use the Scene tab to browse all entities. Ctrl+Z undoes strokes. Right-click removes content on the current layer. Draw with the rectangle, line, or bucket tools for faster level construction.</p>`;
      $e('#psi-frame').onclick=frameAll;$e('#psi-select').onclick=()=>setTool('select');
    }
    updateBottom();
  }
  function updateBottom(){
    $e('#ps-stats').textContent=`${tiles.size.toLocaleString()} tiles · ${objs.size.toLocaleString()} objects`;
    $e('#ps-zoomlabel').textContent=Math.round(cam.z/20*100)+'%';
    $e('#ps-coords').textContent=hover?`X ${hover.c} · Y ${hover.r}`:'X — · Y —';
    $e('#ps-coordlabel').textContent=hover?`SCENE VIEW  ·  ${hover.c}, ${hover.r}  ·  GRID 8px`:'SCENE VIEW  ·  GRID 8px';
  }
  function resize(){const r=viewport.getBoundingClientRect();if(r.width<5||r.height<5)return;canvas.width=Math.max(150,r.width|0);canvas.height=Math.max(150,r.height|0);redrawAll();}
  function zoomAt(f,px=canvas.width/2,py=canvas.height/2){const nz=Math.max(3,Math.min(56,cam.z*f));cam.x+=px/cam.z-px/nz;cam.y+=py/cam.z-py/nz;cam.z=nz;redrawAll();}
  function frameAll(){const b=mapSummary(),spanX=b.maxX-b.minX+12,spanY=b.maxY-b.minY+14,z=Math.min(canvas.width/spanX,canvas.height/spanY);cam.z=Math.max(3,Math.min(32,z));cam.x=(b.maxX+b.minX)/2-canvas.width/(cam.z*2);cam.y=(b.maxY+b.minY)/2-canvas.height/(cam.z*2);redrawAll();say('Framed all scene content.');}
  function at(e){const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)*canvas.width/r.width,py=(e.clientY-r.top)*canvas.height/r.height;return{c:Math.floor(px/cam.z+cam.x),r:Math.floor(py/cam.z+cam.y),px,py};}
  function rect(a,b){return {x0:Math.min(a.c,b.c),y0:Math.min(a.r,b.r),x1:Math.max(a.c,b.c),y1:Math.max(a.r,b.r)};}
  function outlines(id,k){const [c,r]=P(k);if(id==='custom'){const s=customFrom(k).components.sprite;return[c,r,c+s.width/8,r+s.height/8];}const p=params.get(k)||{},w=(p.width||({'mov':24,'lift':24,'fan':24,'wr':80,'wl':80,'moon':80,'br':72,'bl':72,'crush':24}[id]))/8||0,h=(p.height||({'fan':88,'wr':96,'wl':96,'moon':144}[id]))/8||0,range=(p.range||32)/8;
    if(id==='saw')return[c-range,r,c+range+1,r+1];if(id==='sawv')return[c,r-range,c+1,r+range+1];
    if(id==='mov')return[c-range,r,c+w+range,r+1];if(id==='lift')return[c,r-range,c+w,r+range];
    if(id==='fan')return[c,r-h,c+w,r+1];if(id==='wr'||id==='wl')return[c,r+4-h,c+w,r+4];if(id==='moon')return[c,r+4-h,c+w,r+4];
    if(id==='br'||id==='bl')return[c,r,c+w,r+2];if(id==='crush')return[c,r-4,c+w,r+1];
    if(id==='laser'||id==='lasera'||id==='laserb')return[c-2,r-(p.length||56)/8,c+3,r+1];if(id==='laserh')return[c-(p.length||56)/16,r,c+(p.length||56)/16,r+1];
    return null;
  }
  function renderCanvas(){
    const W=canvas.width,H=canvas.height,z=cam.z,x=ctx;x.clearRect(0,0,W,H);x.fillStyle='#0b1121';x.fillRect(0,0,W,H);
    const sx=c=>(c-cam.x)*z,sy=r=>(r-cam.y)*z,c0=Math.floor(cam.x),r0=Math.floor(cam.y),c1=Math.ceil(cam.x+W/z),r1=Math.ceil(cam.y+H/z);
    // faint perspective bands and unit-grid make terrain easier to reason about
    x.fillStyle='#11192c';for(let r=Math.floor(r0/8)*8;r<=r1;r+=8)x.fillRect(0,sy(r),W,Math.max(1,z*.12));
    if(viewGrid&&z>=5){x.lineWidth=1;x.beginPath();for(let c=c0;c<=c1;c++){const q=Math.round(sx(c))+.5;x.moveTo(q,0);x.lineTo(q,H);}for(let r=r0;r<=r1;r++){const q=Math.round(sy(r))+.5;x.moveTo(0,q);x.lineTo(W,q);}x.strokeStyle=z>13?'#ffffff13':'#ffffff0a';x.stroke();
      if(z>=12){x.strokeStyle='#9bb9e81e';x.beginPath();for(let c=Math.floor(c0/8)*8;c<=c1;c+=8){let q=Math.round(sx(c))+.5;x.moveTo(q,0);x.lineTo(q,H);}for(let r=Math.floor(r0/8)*8;r<=r1;r+=8){let q=Math.round(sy(r))+.5;x.moveTo(0,q);x.lineTo(W,q);}x.stroke();}}
    x.strokeStyle='#81a8db40';x.lineWidth=1;x.beginPath();x.moveTo(sx(0)+.5,0);x.lineTo(sx(0)+.5,H);x.moveTo(0,sy(0)+.5);x.lineTo(W,sy(0)+.5);x.stroke();
    if(visTerrain){for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
      const id=TILE[tiles.get(K(c,r))];if(!id)continue;const px=sx(c),py=sy(r);x.fillStyle=BY[id].col;x.fillRect(px,py,z+.25,z+.25);
      if(id==='ground'){x.fillStyle='#b0c4d8';x.fillRect(px,py,z,Math.max(1,z*.16));x.fillStyle='#344762';x.fillRect(px+z*.12,py+z*.42,z*.3,z*.14);}
      else if(id==='spike'){x.fillStyle='#892b43';x.fillRect(px,py+z*.8,z,z*.2);x.fillStyle='#ffd0bb';x.beginPath();x.moveTo(px+z*.1,py+z*.84);x.lineTo(px+z*.5,py+z*.1);x.lineTo(px+z*.9,py+z*.84);x.fill();}
      else if(id==='crumble'){x.strokeStyle='#6f5b52';x.lineWidth=Math.max(1,z*.1);x.beginPath();x.moveTo(px+z*.18,py+z*.15);x.lineTo(px+z*.5,py+z*.5);x.lineTo(px+z*.34,py+z*.82);x.stroke();}
      else if(id==='brk'){x.strokeStyle='#444958';x.lineWidth=Math.max(1,z*.1);x.beginPath();x.moveTo(px+z*.15,py+z*.2);x.lineTo(px+z*.72,py+z*.8);x.moveTo(px+z*.8,py+z*.2);x.lineTo(px+z*.38,py+z*.55);x.stroke();}
    }}
    if(visObjects){
      if(viewExt){objs.forEach((id,k)=>{const q=outlines(id,k);if(!q)return;const [c0,r0,c1,r1]=q;x.fillStyle=BY[id].col+'25';x.fillRect(sx(c0),sy(r0),sx(c1)-sx(c0),sy(r1)-sy(r0));x.strokeStyle=BY[id].col+'65';x.setLineDash([5,4]);x.strokeRect(sx(c0),sy(r0),sx(c1)-sx(c0),sy(r1)-sy(r0));x.setLineDash([]);});}
      objs.forEach((id,k)=>{const [c,r]=P(k);if(c<c0-30||c>c1+30||r<r0-30||r>r1+30)return;const it=BY[id],cx=sx(c+.5),cy=sy(r+.5),radius=Math.max(5,Math.min(17,z*.43));
        x.fillStyle='#050914';x.beginPath();x.arc(cx,cy,radius+2,0,Math.PI*2);x.fill();x.fillStyle=it.col;x.beginPath();x.arc(cx,cy,radius,0,Math.PI*2);x.fill();
        x.fillStyle='#101323';x.textAlign='center';x.textBaseline='middle';x.font=`900 ${Math.max(9,Math.min(22,z*.8))}px 'IBM Plex Sans'`;x.fillText(it.glyph,cx,cy+.5);
        if(id==='custom'){const o=customFrom(k),s=o.components.sprite;x.fillStyle=s.color;x.beginPath();x.arc(cx,cy,radius,0,Math.PI*2);x.fill();x.fillStyle='#11182b';x.fillText('✦',cx,cy+.5);}
        if(z>=15){x.fillStyle='#d9e6f6';x.font='10px IBM Plex Sans';x.textAlign='left';x.fillText(id==='custom'?customFrom(k).name:it.n,sx(c+1.3),cy);}
      });
    }
    if(tileSelection){const q=tileSelection;x.fillStyle='#70caff24';x.fillRect(sx(q.x0),sy(q.y0),(q.x1-q.x0+1)*z,(q.y1-q.y0+1)*z);x.strokeStyle='#89d0ff';x.setLineDash([6,3]);x.lineWidth=1.5;x.strokeRect(sx(q.x0),sy(q.y0),(q.x1-q.x0+1)*z,(q.y1-q.y0+1)*z);x.setLineDash([]);}
    selection.forEach(k=>{if(!objs.has(k))return;const [c,r]=P(k);x.strokeStyle='#ffd76e';x.lineWidth=2;x.strokeRect(sx(c)-2,sy(r)-2,z+4,z+4);});
    if(action&&(action.kind==='rect'||action.kind==='line'||action.kind==='marquee')){
      const a=action.start,b=hover||a,q=rect(a,b);x.fillStyle=action.kind==='marquee'?'#70caff26':'#ff85ab30';x.strokeStyle=action.kind==='marquee'?'#70caff':'#ff99b9';x.setLineDash([5,4]);x.lineWidth=1.5;x.fillRect(sx(q.x0),sy(q.y0),(q.x1-q.x0+1)*z,(q.y1-q.y0+1)*z);x.strokeRect(sx(q.x0),sy(q.y0),(q.x1-q.x0+1)*z,(q.y1-q.y0+1)*z);x.setLineDash([]);
    }
    if(hover&&!(action&&action.kind==='pan')){x.lineWidth=1.5;x.strokeStyle=mode==='erase'?'#fff':'#ff8ca9';x.strokeRect(sx(hover.c)+.75,sy(hover.r)+.75,z-.5,z-.5);}
    updateBottom();
  }
  function renderMini(){
    const m=mini.getContext('2d'),W=mini.width,H=mini.height;m.fillStyle='#0b1020';m.fillRect(0,0,W,H);
    const b=mapSummary(),pad=12,w=Math.max(20,b.maxX-b.minX+12),h=Math.max(16,b.maxY-b.minY+12),z=Math.min((W-12)/w,(H-12)/h),sx=c=>6+(c-b.minX+6)*z,sy=r=>6+(r-b.minY+6)*z;
    miniBounds={b,z,sx,sy};tiles.forEach((v,k)=>{const [c,r]=P(k);m.fillStyle=BY[TILE[v]]?.col||'#fff';m.fillRect(sx(c),sy(r),Math.max(1,z),Math.max(1,z));});
    objs.forEach((id,k)=>{const [c,r]=P(k);m.fillStyle=BY[id].col;m.fillRect(sx(c)-1,sy(r)-1,Math.max(3,z+2),Math.max(3,z+2));});
    m.strokeStyle='#8ad1ff';m.lineWidth=1;m.strokeRect(sx(cam.x),sy(cam.y),canvas.width/cam.z*z,canvas.height/cam.z*z);
  }
  function redrawAll(){renderCanvas();renderMini();renderInspector();if(leftTab==='hierarchy')renderHierarchy();}
  function placeCell(c,r,erase=false) {
    if(!valid(c)||!valid(r))return;
    const key=K(c,r),it=BY[cur];
    if(erase||mode==='erase'){
      if(layer==='terrain'){if(!lockTerrain)tiles.delete(key);}else if(!lockObjects){objs.delete(key);params.delete(key);selection.delete(key);}
    }else if(it.tile){if(!lockTerrain)tiles.set(key,it.tile);}
    else if(!lockObjects){
      if(it.id==='player'||it.id==='flag')for(const [k,v] of objs){if(v===it.id&&k!==key){objs.delete(k);params.delete(k);selection.delete(k);}}
      if(objs.get(key)!==it.id)params.delete(key);
      if(it.prefab){objs.set(key,'custom');const p=cleanCustom(prefabs.get(it.id.slice(3)));p.prefabId=it.id.slice(3);params.set(key,{custom:p});}
      else if(it.id==='custom'){objs.set(key,'custom');params.set(key,{custom:makeCustom()});}
      else objs.set(key,it.id);
    }
  }
  function placeBrush(c,r,erase=false){
    if((BY[cur]?.tile||mode==='erase'||erase)&&layer==='terrain')for(let yy=0;yy<bs;yy++)for(let xx=0;xx<bs;xx++)placeCell(c+xx,r+yy,erase);
    else placeCell(c,r,erase);
  }
  function drawLine(a,b,fn){let x=a.c,y=a.r,dx=Math.abs(b.c-a.c),dy=-Math.abs(b.r-a.r),sx=x<b.c?1:-1,sy=y<b.r?1:-1,err=dx+dy,n=0;while(true){fn(x,y);if(x===b.c&&y===b.r)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}if(++n>MAX_AREA)break;}}
  function doShape(a,b,kind,erasing){
    const q=rect(a,b),count=(q.x1-q.x0+1)*(q.y1-q.y0+1);if(count>MAX_AREA){say('This area is too large. Limit: 36,000 tiles per action.');return;}
    if(kind==='line')drawLine(a,b,(x,y)=>placeBrush(x,y,erasing));
    else if(BY[cur].tile||erasing||mode==='erase'){for(let y=q.y0;y<=q.y1;y++)for(let x=q.x0;x<=q.x1;x++)placeCell(x,y,erasing);}
    else placeCell(b.c,b.r,false);
  }
  function bucket(c,r){
    if(lockTerrain)return say('Terrain layer is locked.');if(!visTerrain)return say('Show the terrain layer first.');
    const old=tiles.get(K(c,r))||0,rep=BY[cur]?.tile||0;
    if(!old){say('Bucket fill works on a connected painted region. Paint a tile first.');return;}
    if(old===rep)return;
    const q=[[c,r]],seen=new Set(),change=[];
    for(let i=0;i<q.length&&q.length<=MAX_AREA;i++){
      const [x,y]=q[i],key=K(x,y);if(seen.has(key)||!valid(x)||!valid(y)||tiles.get(key)!==old)continue;
      seen.add(key);change.push(key);q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    if(q.length>MAX_AREA){say('Bucket fill stopped: region too large.');return;}
    change.forEach(key=>rep?tiles.set(key,rep):tiles.delete(key));commit('Filled '+change.length+' terrain tiles');
  }
  function areaObjects(q){const all=[];objs.forEach((v,k)=>{const [c,r]=P(k);if(c>=q.x0&&c<=q.x1&&r>=q.y0&&r<=q.y1)all.push(k);});return all;}
  function finalizeMarquee(a,b,extend){
    const q=rect(a,b);if(!extend)selection.clear();
    for(const k of areaObjects(q))selection.add(k);
    if(q.x0!==q.x1||q.y0!==q.y1)tileSelection=q;
    else{tileSelection=tiles.has(K(q.x0,q.y0))?q:null;}
    redrawAll();
    say(selection.size+' objects selected'+(tileSelection?' with terrain area':''));
  }
  function moveObjects(dx,dy,original){
    if(!dx&&!dy)return;
    const originalKeys=new Set(original.map(([k])=>k)),newKeys=original.map(([key])=>{const [x,y]=P(key);return K(x+dx,y+dy);});
    if(newKeys.some(k=>{const [x,y]=P(k);return !valid(x)||!valid(y)||objs.has(k)&&!originalKeys.has(k);}))return;
    original.forEach(([k])=>{objs.delete(k);params.delete(k);});selection.clear();
    original.forEach(([key,id,p],i)=>{const nk=newKeys[i];objs.set(nk,id);if(p)params.set(nk,deep(p));selection.add(nk);});
    tileSelection=null;
  }
  function removeArea(area){
    if(!area)return;
    if((area.x1-area.x0+1)*(area.y1-area.y0+1)>MAX_AREA)return say('Selection too large to delete.');
    for(let y=area.y0;y<=area.y1;y++)for(let x=area.x0;x<=area.x1;x++){
      if(!lockTerrain)tiles.delete(K(x,y));if(!lockObjects){objs.delete(K(x,y));params.delete(K(x,y));}
    }
  }
  function deleteSelection(){
    if(tileSelection){removeArea(tileSelection);}else if(!lockObjects){for(const k of selection){objs.delete(k);params.delete(k);}}
    clearSel();commit('Deleted selected content');redrawAll();
  }
  function copySelection(){
    const keys=selection.size?[...selection].filter(k=>objs.has(k)):[],area=tileSelection;
    if(!keys.length&&!area){say('Select one or more objects or drag an area first.');return false;}
    let b=area;
    if(!b){const points=keys.map(P);b={x0:Math.min(...points.map(p=>p[0])),y0:Math.min(...points.map(p=>p[1])),x1:Math.max(...points.map(p=>p[0])),y1:Math.max(...points.map(p=>p[1]))};}
    const content={tiles:[],objects:[],width:b.x1-b.x0+1,height:b.y1-b.y0+1,originX:b.x0,originY:b.y0};
    if(area)tiles.forEach((id,k)=>{const [x,y]=P(k);if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)content.tiles.push([x-b.x0,y-b.y0,id]);});
    (area?areaObjects(area):keys).forEach(k=>{const [x,y]=P(k);content.objects.push([x-b.x0,y-b.y0,objs.get(k),deep(params.get(k)||{})]);});
    clipboard=content;say(`Copied ${content.objects.length} objects and ${content.tiles.length} tiles`);return true;
  }
  function pasteSelection(anchor){
    if(!clipboard){say('Nothing to paste. Use Ctrl+C after selecting an object or area.');return;}
    if(clipboard.tiles.length&&lockTerrain||clipboard.objects.length&&lockObjects)return say('Unlock the layers you want to paste into.');
    let tx=anchor?.c??(hover?.c??Math.floor(cam.x+canvas.width/(cam.z*2)));
    let ty=anchor?.r??(hover?.r??Math.floor(cam.y+canvas.height/(cam.z*2)));
    if(!anchor&&tx===clipboard.originX&&ty===clipboard.originY){tx+=3;ty+=3;}
    const dx=tx,dy=ty;const candidates=clipboard.objects.map(([x,y,id,p])=>[x+dx,y+dy,id,p]);
    if(candidates.some(([x,y])=>!valid(x)||!valid(y)))return say('Cannot paste outside the scene bounds.');
    clipboard.tiles.forEach(([x,y,id])=>{if(valid(x+dx)&&valid(y+dy))tiles.set(K(x+dx,y+dy),id);});
    selection.clear();for(const [x,y,id,p] of candidates){const k=K(x,y);if(id==='player'||id==='flag')for(const [k2,v2] of objs){if(v2===id&&k2!==k){objs.delete(k2);params.delete(k2);}}objs.set(k,id);params.set(k,deep(p));selection.add(k);}
    tileSelection=clipboard.tiles.length?{x0:dx,y0:dy,x1:dx+clipboard.width-1,y1:dy+clipboard.height-1}:null;
    commit('Pasted scene content');
  }
  function duplicateSelection(){
    let anchor;if(tileSelection)anchor={c:tileSelection.x0+3,r:tileSelection.y0+3};
    else if(selection.size){const positions=[...selection].map(P);anchor={c:Math.min(...positions.map(v=>v[0]))+3,r:Math.min(...positions.map(v=>v[1]))+3};}
    if(copySelection())pasteSelection(anchor);
  }
  function rotate(kind){
    let changed=false;
    if(selection.size&&!lockObjects){for(const k of selection){const id=objs.get(k),id2=VAR[id]?.[kind]||id;if(id!==id2){objs.set(k,id2);changed=true;}}if(changed)commit(kind==='r'?'Rotated selection':'Flipped selection');}
    else{const next=VAR[cur]?.[kind];if(next){setAsset(next);say(kind==='r'?'Rotated brush':'Flipped brush');}else say('No alternate orientation for this asset.');}
    redrawAll();
  }
  function handleDown(e){
    if(e.button>2)return;const pos=at(e);hover=pos;
    if(e.button===1||space||mode==='hand'){
      action={kind:'pan',start:pos,cx:cam.x,cy:cam.y,clientX:e.clientX,clientY:e.clientY};canvas.style.cursor='grabbing';e.preventDefault();canvas.setPointerCapture(e.pointerId);return;
    }
    const erase=e.button===2;
    if(mode==='select'&&!erase){
      const key=K(pos.c,pos.r);
      if(objs.has(key)&&!lockObjects&&visObjects){
        if(e.shiftKey){selection.has(key)?selection.delete(key):selection.add(key);}else if(!selection.has(key)){selection.clear();selection.add(key);}
        tileSelection=null;
        const original=[...selection].map(k=>[k,objs.get(k),params.get(k)?deep(params.get(k)):null]);
        action={kind:'move',start:pos,original,moved:false};
        redrawAll();
      }else{action={kind:'marquee',start:pos,extend:e.shiftKey};if(!e.shiftKey)clearSel();}
    }else if(mode==='rect'||mode==='line'){action={kind:mode,start:pos,erase};}
    else if(mode==='fill'&&!erase){bucket(pos.c,pos.r);}
    else{
      action={kind:'brush',start:pos,erase,was:pos};
      if(mode==='erase'){layer=BY[cur]?.tile?'terrain':'objects';}
      placeBrush(pos.c,pos.r,erase);renderCanvas();
    }
    canvas.setPointerCapture(e.pointerId);e.preventDefault();
  }
  function handleMove(e){
    const pos=at(e);hover=pos;
    if(action?.kind==='pan'){
      cam.x=action.cx-(e.clientX-action.clientX)/cam.z;cam.y=action.cy-(e.clientY-action.clientY)/cam.z;renderCanvas();renderMini();return;
    }
    if(action?.kind==='move'){
      const dx=pos.c-action.start.c,dy=pos.r-action.start.r;
      if(dx||dy)action.moved=true;
      const originalKeys=new Set(action.original.map(([k])=>k));
      (action.current||action.original.map(([k])=>k)).forEach(k=>{objs.delete(k);params.delete(k);});
      const canMove=action.original.every(([k])=>{const [x,y]=P(k);const nk=K(x+dx,y+dy);return valid(x+dx)&&valid(y+dy)&&(!objs.has(nk)||originalKeys.has(nk));});
      const ox=canMove?dx:0,oy=canMove?dy:0;selection.clear();
      action.current=[];action.original.forEach(([key,id,p])=>{const [x,y]=P(key),nk=K(x+ox,y+oy);objs.set(nk,id);if(p)params.set(nk,p);selection.add(nk);action.current.push(nk);});
    }
    if(action?.kind==='brush'&&(e.buttons&1||e.buttons&2)){
      if(BY[cur]?.tile||mode==='erase'||action.erase){drawLine(action.was,pos,(x,y)=>placeBrush(x,y,action.erase));action.was=pos;}
    }
    renderCanvas();
  }
  function handleUp(e){
    if(!action)return;const a=action;const end=hover||a.start;
    if(a.kind==='rect'||a.kind==='line'){doShape(a.start,end,a.kind,a.erase);commit(a.kind==='rect'?'Rectangle painted':'Line drawn');}
    if(a.kind==='marquee')finalizeMarquee(a.start,end,a.extend);
    if(a.kind==='move'&&a.moved)commit('Moved scene objects');
    if(a.kind==='brush')commit(a.erase?'Erased scene content':'Painted scene content');
    action=null;
    if(e&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor=mode==='hand'?'grab':mode==='select'?'default':'crosshair';redrawAll();
  }
  function serialize(){
    const rows={},runs=[];
    tiles.forEach((v,k)=>{const [c,r]=P(k);(rows[r]??=[]).push([c,v]);});
    for(const r of Object.keys(rows)){
      const a=rows[r].sort((a,b)=>a[0]-b[0]);if(!a.length)continue;
      let start=a[0][0],last=start,v=a[0][1],len=1;
      for(let i=1;i<a.length;i++){const [cx,t]=a[i];if(cx===last+1&&t===v){len++;last=cx;}else{runs.push([+r,start,len,v]);start=last=cx;v=t;len=1;}}
      runs.push([+r,start,len,v]);
    }
    return{game:'poison',v:5,name:name(),theme:V.theme,themeData:typeof V.theme==='string'&&V.theme.startsWith('custom:')?normalizeTheme(CUSTOM_THEMES.get(V.theme)):null,tiles:runs,objs:[...objs].map(([k,id])=>[...P(k),id]),meta:[...params].filter(([k,v])=>objs.has(k)&&Object.keys(v).length).map(([k,v])=>[...P(k),deep(v)]),prefabs:[...prefabs].map(([id,p])=>[id,deep(p)])};
  }
  function deserialize(d){
    if(!d||d.game!=='poison'||!Array.isArray(d.objs))throw Error('Not a Poison scene file');
    const t=new Map(),o=new Map(),p=new Map();
    if(typeof d.tiles==='string'&&d.cols===160&&d.rows===56){let i=0;for(const part of d.tiles.split(',')){const [v,n]=part.split('x').map(Number);if(!Number.isInteger(v)||v<0||v>5||!Number.isInteger(n)||n<1||i+n>8960)throw Error('Invalid legacy tiles');if(v)for(let j=0;j<n;j++)t.set(K((i+j)%160,Math.floor((i+j)/160)),v);i+=n;}}
    else if(Array.isArray(d.tiles)&&d.tiles.length<=100000){let total=0;for(const [r,start,n,v] of d.tiles){if(!valid(r)||!valid(start)||!Number.isInteger(n)||n<1||n>6000||![1,2,4,5].includes(v)||(total+=n)>300000||!valid(start+n-1))throw Error('Invalid tile data');for(let j=0;j<n;j++)t.set(K(start+j,r),v);}}
    else throw Error('Invalid terrain data');
    if(d.objs.length>25000)throw Error('Too many objects');
    for(const item of d.objs){if(!Array.isArray(item)||item.length<3)continue;const [c,r,id]=item;if(BY[id]&&!BY[id].tile&&valid(c)&&valid(r))o.set(K(c,r),id);}
    if(Array.isArray(d.meta))for(const entry of d.meta.slice(0,25000)){
      if(!Array.isArray(entry)||entry.length<3)continue;const [c,r,vals]=entry,k=K(c,r);if(!valid(c)||!valid(r)||!o.has(k)||!vals||typeof vals!=='object')continue;
      const accepted={};for(const [key,label,def,min,max] of PROPERTIES[o.get(k)]||[]){const n=vals[key];if(typeof n==='number'&&isFinite(n))accepted[key]=Math.min(max,Math.max(min,n));}
      if(o.get(k)==='custom')accepted.custom=cleanCustom(vals.custom);if(Object.keys(accepted).length)p.set(k,accepted);
    }
    if(Array.isArray(d.prefabs))for(const item of d.prefabs.slice(0,100)){if(Array.isArray(item)&&typeof item[0]==='string'&&/^pf_[\w-]{2,90}$/.test(item[0]))addPrefab(item[1],item[0]);}savePrefabs();disableScripts();
    tiles.clear();objs.clear();params.clear();t.forEach((v,k)=>tiles.set(k,v));o.forEach((v,k)=>objs.set(k,v));p.forEach((v,k)=>params.set(k,v));
    clearSel();$e('#ps-name').value=String(d.name||'My level').slice(0,40);
    if(typeof d.theme==='string'&&d.theme.startsWith('custom:')&&d.themeData){importCustomTheme(d.theme,d.themeData);saveCustomThemes();}
    if(d.theme==='auto'||(Number.isInteger(d.theme)&&d.theme>=0&&d.theme<BASE_THEME_COUNT)||(typeof d.theme==='string'&&CUSTOM_THEMES.has(d.theme))){V.theme=d.theme;applyTheme(V.seed);save();}
    else if(d.theme!==undefined){V.theme=0;applyTheme(V.seed);save();}

    const start=[...objs].find(([k,id])=>id==='player');if(start){const [c,r]=P(start[0]);cam.x=c-8;cam.y=r-8;}
    resetHistory();renderAssets();redrawAll();
  }
  const getLib=()=>{try{const v=JSON.parse(localStorage.getItem(LK)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(e){return{};}};
  function setLib(v){try{localStorage.setItem(LK,JSON.stringify(v));return true;}catch(e){say('Browser storage is full or blocked. Export the scene as JSON.');return false;}}
  function refreshLibrary(){
    const l=getLib(),list=$e('#ps-library'),previous=list.value;list.replaceChildren();
    for(const n of Object.keys(l)){const o=document.createElement('option');o.value=n;o.textContent=n;list.append(o);}
    if(l[previous])list.value=previous;else if(l[name()])list.value=name();
    const host=document.getElementById('poison-scene-library');if(host){host.replaceChildren();const names=Object.keys(l);if(!names.length){host.textContent='No saved scenes yet. Click Open level editor to create one.';return;}
      for(const n of names){const row=document.createElement('div');row.style.cssText='display:flex;gap:5px;margin:6px 0;align-items:center';const label=document.createElement('span');label.textContent=n;label.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';row.append(label);
        const button=(caption,fn)=>{const b=document.createElement('button');b.className='chip';b.textContent=caption;b.onclick=fn;row.append(b);};
        button('Play',()=>{try{deserialize(l[n]);if(window.procOn&&window.poisonSetProcedural)window.poisonSetProcedural(false);else{window.procOn=false;buildLevel(V.seed,'Playing '+n);}refreshLibrary();}catch(e){say('Cannot load this scene: '+e.message);}});
        button('Edit',()=>{try{deserialize(l[n]);openEditor();}catch(e){say('Cannot edit this scene: '+e.message);}});
        button('×',()=>{if(!confirm('Delete saved scene "'+n+'"?'))return;const v=getLib();delete v[n];setLib(v);refreshLibrary();});host.append(row);}
    }
  }
  function saveScene(){const data=serialize(),lib=getLib();lib[data.name]=data;if(setLib(lib)){saveCurrent();refreshLibrary();$e('#ps-library').value=data.name;say('Saved scene: '+data.name);$e('#ps-save').classList.remove('ps-just-saved');void $e('#ps-save').offsetWidth;$e('#ps-save').classList.add('ps-just-saved');} }
  function loadScene(){const n=$e('#ps-library').value,d=getLib()[n];if(!d)return say('Choose a saved scene to open.');try{deserialize(d);say('Opened scene: '+n);frameAll();}catch(e){say(e.message);}}
  function downloadScene(){const d=serialize(),json=JSON.stringify(d,null,2),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(d.name.replace(/[^\w-]+/g,'_')||'Poison_Level')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);say('Exported '+a.download);}
  async function importScene(e){const file=e.target.files?.[0];if(!file)return;try{const raw=await file.text();if(raw.length>25000000)throw Error('File too large');deserialize(JSON.parse(raw));const d=serialize(),l=getLib();l[d.name]=d;setLib(l);refreshLibrary();saveCurrent();if(importTarget!=='editor')openEditor();say('Imported '+file.name);}catch(ex){say('Import failed: '+ex.message);}finally{e.target.value='';}}
  function modal(html){toggleThemeWindow(false);$e('#ps-modal-content').innerHTML=html;$e('#ps-modal').classList.add('open');}
  function hideModal(){$e('#ps-modal').classList.remove('open');$e('#ps-modal-content').classList.remove('ps-object-reveal');}
  function showNew(){modal(`<h2>Create a scene</h2><p>Choose a starting layout. Save or export your current scene first if you want to keep it; New replaces the current autosaved draft.</p>
    <button class="ps-template" data-template="starter"><b>▦ Platforming starter</b><br><span class="ps-muted">Ground, gaps, checkpoints, a spring and one moving hazard</span></button>
    <button class="ps-template" data-template="vertical"><b>⇧ Vertical challenge</b><br><span class="ps-muted">Stacked platforms, a lift, a gem, and elevated finish</span></button>
    <button class="ps-template" data-template="blank"><b>＋ Empty scene</b><br><span class="ps-muted">Only a spawn and finish flag to begin your design</span></button>
    <button class="ps-template" data-template="creator"><b>✦ Creator components demo</b><br><span class="ps-muted">Custom switch, solid door, patrol enemy and collectible with editable components</span></button><div style="text-align:right;margin-top:10px"><button id="ps-modal-cancel">Cancel</button></div>`);
    el.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{paintDemo(b.dataset.template);$e('#ps-name').value='Untitled scene';resetHistory();frameAll();refreshLibrary();hideModal();say('New '+b.dataset.template+' scene ready.');});
    $e('#ps-modal-cancel').onclick=hideModal;
  }
  function showHelp(){modal(`<h2>Poison Scene Studio</h2><p>Design a custom playable level, tune hazards, and test instantly. This editor uses the same level data as Poison.</p><div class="ps-helpgrid">
    <div><b>Mouse</b><br>Left: draw / select<br>Right: erase current layer<br>Middle or Space-drag: pan<br>Wheel: zoom at cursor</div>
    <div><b>Editing</b><br>V Select · B Brush<br>U Rectangle · L Line<br>G Fill · E Eraser<br>H Hand · R Rotate · F Flip</div>
    <div><b>Shortcuts</b><br>Ctrl+Z / Y: Undo / redo<br>Ctrl+C / V: Copy / paste<br>Ctrl+D: Duplicate<br>Delete: Remove selection</div>
    <div><b>Project</b><br>Ctrl+S: Save locally<br>Home: Frame scene<br>Arrow keys: Move selection<br>Esc: Close / deselect</div>
    </div><p>Use <b>＋ Create Custom Object</b> to make reusable Poison components, choose built-in behaviors, attach a script and save it as a prefab. Scripts require explicit opt-in for each imported scene.</p><p>Tiles and objects occupy different editing layers. In the right Inspector, selected moving platforms, saws, lasers, conveyors and environmental zones expose settings used by the actual game.</p><div style="text-align:right"><button id="ps-modal-ok" class="ps-primary">Start editing</button></div>`);$e('#ps-modal-ok').onclick=hideModal;}
  function openEditor(){if(window.poisonEditorOpen)return;window.poisonEditorOpen=true;if(window.poisonRuntime)window.poisonRuntime.stop('Game stopped: Studio open');el.style.display='flex';document.body.style.overflow='hidden';renderAssets();renderHierarchy();updateToolButtons();requestAnimationFrame(()=>{resize();if(!history.length)resetHistory();if(!openedOnce){openedOnce=true;frameAll();}renderInspector();canvas.focus();});}
  function closeEditor(){hideModal();toggleThemeWindow(false);el.style.display='none';window.poisonEditorOpen=false;document.body.style.overflow='';saveCurrent();refreshLibrary();/* Deliberately leave the game stopped; user chooses Resume or Play Scene. */}
  function playScene(){if(!objs.size||![...objs.values()].includes('player')){say('Place a Player spawn before testing.');return;}try{closeEditor();customRuntime.approve(allowScripts);if(window.procOn&&window.poisonSetProcedural)window.poisonSetProcedural(false);else {window.procOn=false;buildLevel(V.seed,'Testing '+name());}if(window.poisonRuntime)window.poisonRuntime.resume('Testing scene');canvas.blur();}catch(e){openEditor();say('Level build failed: '+e.message);}}
  function arrowMove(dx,dy){if(!selection.size||lockObjects)return;const keys=[...selection].filter(k=>objs.has(k)),entries=keys.map(k=>[k,objs.get(k),params.get(k)?deep(params.get(k)):null]);moveObjects(dx,dy,entries);commit('Moved selection');}
  function keyShortcuts(e){
    if(!window.poisonEditorOpen)return;
    const isModal=$e('#ps-modal').classList.contains('open'),typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName);
    const ctrl=e.ctrlKey||e.metaKey,code=e.code;
    if(themeWindow.classList.contains('open')){if(code==='Escape'){toggleThemeWindow(false);e.preventDefault();}e.stopImmediatePropagation();return;}
    if(ctrl&&code==='KeyS'){e.preventDefault();e.stopImmediatePropagation();saveScene();return;}
    if(isModal){if(code==='Escape'){hideModal();e.preventDefault();}e.stopImmediatePropagation();return;}
    if(typing){if(code==='Escape'){e.target.blur();canvas.focus();}e.stopImmediatePropagation();return;}
    let handled=true;
    if(ctrl&&code==='KeyZ'){e.shiftKey?redo():undo();}
    else if(ctrl&&(code==='KeyY'))redo();
    else if(ctrl&&code==='KeyC')copySelection();
    else if(ctrl&&code==='KeyV')pasteSelection();
    else if(ctrl&&code==='KeyD')duplicateSelection();
    else if(code==='Escape'){if(selection.size||tileSelection){clearSel();redrawAll();}else closeEditor();}
    else if(code==='Space'){space=true;canvas.style.cursor='grab';}
    else if(code==='Delete'||code==='Backspace')deleteSelection();
    else if(code==='KeyV')setTool('select');else if(code==='KeyB')setTool('brush');else if(code==='KeyU')setTool('rect');else if(code==='KeyL')setTool('line');else if(code==='KeyG')setTool('fill');else if(code==='KeyE')setTool('erase');else if(code==='KeyH')setTool('hand');
    else if(code==='KeyR')rotate('r');else if(code==='KeyF')rotate('f');else if(code==='Home')frameAll();
    else if(code==='Equal'||code==='NumpadAdd')zoomAt(1.2);else if(code==='Minus'||code==='NumpadSubtract')zoomAt(1/1.2);
    else if(code==='ArrowLeft')arrowMove(-1,0);else if(code==='ArrowRight')arrowMove(1,0);else if(code==='ArrowUp')arrowMove(0,-1);else if(code==='ArrowDown')arrowMove(0,1);
    else handled=false;
    if(handled){e.preventDefault();e.stopImmediatePropagation();}
    else e.stopImmediatePropagation();
  }
