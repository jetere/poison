/* ---------- Poison creator: component-driven custom object runtime ---------- */
const customRuntime = (() => {
  let entities = [], iframe = null, nonce = '', approved = false, active = false, lastError = '';
  const MAX_OBJECTS = 350, MAX_COMMANDS = 70;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const match = (a,b)=>a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const tagHas = (e,tag)=>String(e.tags||'').split(/[\s,]+/).includes(String(tag));
  const color = x => {const s=String(x||'#79d9eb').replace('#',''); const n=parseInt(s.length===3?s.split('').map(v=>v+v).join(''):s,16);return Number.isFinite(n)?pack((n>>16)&255,(n>>8)&255,n&255):pack(121,217,235);};
  function apiError(err){lastError=String(err).slice(0,180);const h=document.getElementById('poison-custom-status');if(h)h.textContent='Script: '+lastError;}
  function compileImage(entity){
    const data=entity.sprite?.image;
    if(typeof data!=='string'||!/^data:image\/(png|webp|jpeg);base64,/.test(data)||data.length>150000)return;
    const img=new Image();img.onload=()=>{try{
      const count=Math.round(clamp(entity.sprite.frames||1,1,8));
      const cn=document.createElement('canvas');cn.width=20*count;cn.height=20;const ct=cn.getContext('2d',{willReadFrequently:true});ct.imageSmoothingEnabled=false;ct.clearRect(0,0,cn.width,20);ct.drawImage(img,0,0,cn.width,20);
      const px=ct.getImageData(0,0,cn.width,20).data,frames=[];
      for(let frame=0;frame<count;frame++){
        const rows=[],palette={};let n=0;
        for(let y=0;y<20;y++){let row='';for(let x=0;x<20;x++){
          const i=(y*cn.width+frame*20+x)*4;if(px[i+3]<100){row+='.';continue;}
          const c=String.fromCharCode(256+n++);row+=c;palette[c]=pack(px[i],px[i+1],px[i+2]);
        }rows.push(row);}frames.push({rows,palette});
      }entity.pixel={frames};
    }catch(e){}};img.src=data;
  }
  function configure(level){
    closeScriptFrame();entities=[];lastError='';
    if(!level||!Array.isArray(level.customObjects))return;
    for(let i=0;i<Math.min(MAX_OBJECTS,level.customObjects.length);i++){
      const src=level.customObjects[i];if(!src||!src.components)continue;
      const c=JSON.parse(JSON.stringify(src.components));
      const sp=c.sprite||{},co=c.collider||{},body=c.body||{},b=c.behavior||{},hp=c.health||{};
      const e={id:'obj'+i,name:String(src.name||'Object').slice(0,60),tags:String(src.tags||''),x:+src.x||0,y:+src.y||0,x0:+src.x||0,y0:+src.y||0,w:clamp(sp.width||16,4,128),h:clamp(sp.height||16,4,128),
        sprite:sp,collider:co,body,behavior:b,health:hp,audio:c.audio||{},script:c.script||{},vx:Number(body.vx)||0,vy:Number(body.vy)||0,active:true,visible:true,open:false,got:false,near:false,healthNow:clamp(hp.max||1,1,999),hitCD:0,pixel:null};
      entities.push(e);compileImage(e);
    }
    stats.total+=entities.filter(e=>e.behavior.type==='collect').length;
    if(approved && !window.poisonEditorOpen && (!window.poisonRuntime || window.poisonRuntime.mode==='running'))startScripts();
  }
  function solidEntity(e){return e.active && e.collider.enabled && e.collider.solid && !e.open && !e.got;}
  function blocked(x,y){return entities.some(e=>solidEntity(e)&&match({x,y,w:PW,h:PH},e));}
  function worldCollision(x,y,w,h){
    const xs=[Math.floor(x/T),Math.floor((x+w-.01)/T)],ys=[Math.floor(y/T),Math.floor((y+h-.01)/T)];
    for(const tx of xs)for(const ty of ys)if(solidTile(tx,ty))return true;
    return false;
  }
  function openTag(tag){let ct=0;entities.forEach(e=>{if(e.behavior.type==='door'&&tagHas(e,tag)){e.open=true;ct++;}});return ct;}
  function collected(e){if(e.got)return;e.got=true;e.active=false;stats.gems++;emit(e.x+e.w/2,e.y+e.h/2,12,C.gem,50,.4);SFX.play('gem');}
  function bounce(e){pl.vy=-clamp(e.behavior.strength||260,40,600);pl.state=NORMAL;pl.onGround=false;pl.dashes=P.maxDashes;SFX.play('spring');}
  function tick(dt){
    if(!entities.length)return;
    const hitEvents=[];
    for(const e of entities){
      if(!e.active)continue;e.hitCD=Math.max(0,(e.hitCD||0)-dt);
      const b=e.behavior,body=e.body,prevX=e.x,prevY=e.y;
      if(b.type==='patrol'||b.type==='oscillate'){
        const speed=clamp(b.speed||45,0,500),range=clamp(b.range||48,1,800),phase=(world.time*speed)/range;
        const next=Math.sin(phase)*range; if(b.axis==='y'){e.y=e.y0+next;}else e.x=e.x0+next;
      }else if(b.type==='follow'){
        const speed=clamp(b.speed||35,0,500),range=clamp(b.range||120,1,800);
        if(Math.abs(pl.x-e.x)<range){const dx=Math.sign(pl.x-e.x)*speed*dt;if(!worldCollision(e.x+dx,e.y,e.w,e.h))e.x+=dx;}
      }
      if(body.enabled){
        e.vy=Math.min(800,e.vy+clamp(body.gravity??900,-1000,2500)*dt);
        const dx=e.vx*dt,dy=e.vy*dt;
        if(!worldCollision(e.x+dx,e.y,e.w,e.h))e.x+=dx;else e.vx*=-clamp(body.bounce??0,0,1);
        if(!worldCollision(e.x,e.y+dy,e.w,e.h))e.y+=dy;else {e.vy=dy>0?-Math.abs(e.vy)*clamp(body.bounce??0,0,1):0;}
      }
      if(e.x!==prevX||e.y!==prevY){e.x=clamp(e.x,0,W-e.w);e.y=clamp(e.y,0,H-e.h);}
      const touching=!pl.dead && e.collider.enabled!==false && match(e,{x:pl.x,y:pl.y,w:PW,h:PH});
      if(touching&&!e.near){hitEvents.push({id:e.id,type:'onCollisionEnter',other:{tag:'player',x:pl.x,y:pl.y}});if(e.audio.enabled){if(e.audio.fileData&&/^data:audio\/(wav|mpeg|ogg|webm|mp3);base64,/.test(e.audio.fileData)&&e.audio.fileData.length<480000){try{if(!e.audioEl)e.audioEl=new Audio(e.audio.fileData);e.audioEl.currentTime=0;e.audioEl.volume=clamp(e.audio.volume??.8,0,1);e.audioEl.play().catch(()=>{});}catch(ex){}}else SFX.play(String(e.audio.cue||'crystal'),clamp(e.audio.volume??.8,0,1));}}
      e.near=touching;
      if(touching&&!e.got){
        if(pl.state===DASH&&e.health.enabled&&e.hitCD<=0){e.healthNow--;e.hitCD=.35;emit(e.x+e.w/2,e.y+e.h/2,6,C.hazard,35,.25);SFX.play('break');if(e.healthNow<=0)e.active=false;}
        else if(e.collider.harmful||b.type==='hazard'){die();}
        else if(b.type==='collect'){collected(e);}
        else if(b.type==='bounce'&&pl.vy>=-40){bounce(e);}
        else if(b.type==='switch'&&!e.open){e.open=true;openTag(String(b.target||'door'));SFX.play('lever');}
        else if(b.type==='checkpoint'){if(cp.x!==e.x||cp.y!==e.y){cp={x:e.x,y:e.y};SFX.play('checkpoint');}}
      }
    }
    if(active&&iframe?.contentWindow){try{iframe.contentWindow.postMessage({kind:'tick',nonce,dt,
      objects:entities.filter(e=>e.active).map(e=>({id:e.id,x:e.x,y:e.y,w:e.w,h:e.h,props:e.script.props||{}})),
      player:{x:pl.x,y:pl.y,vx:pl.vx,vy:pl.vy,onGround:pl.onGround,dead:pl.dead},events:hitEvents},'*');}catch(e){apiError(e);}}
  }
  function draw(){
    for(const e of entities){if(!e.active||!e.visible||e.got||e.open||e.sprite.enabled===false||Math.abs(e.x-cam.x)>350)continue;
      const c=color(e.sprite.color),xc=e.x+e.w/2,yc=-(e.y+e.h/2);
      if(e.pixel){const frames=e.pixel.frames,pix=frames[Math.floor(world.time*clamp(e.sprite.fps||8,1,24))%frames.length];drawSprite(pix.rows,(ch)=>pix.palette[ch]||c,xc,yc,0,e.w,e.h);continue;}
      if(e.sprite.shape==='diamond'){drawMesh(MESH.diamond,xc,yc,0,e.w/2,e.h/2,3,0,c,true,1);}
      else if(e.sprite.shape==='circle'){drawMesh(MESH.diamond,xc,yc,0,e.w/2,e.h/2,3,world.time*1.2,c,true,1);}
      else{drawBox(e.x,-e.y-e.h,-3,e.x+e.w,-e.y,3,c,!!e.sprite.glow,1,63,c);}
    }
  }
  function command(id,cmd){
    const e=entities.find(q=>q.id===id);if(!e||!e.active||!cmd||typeof cmd.op!=='string')return;
    const args=Array.isArray(cmd.args)?cmd.args:[];
    switch(cmd.op){
      case'move':e.x=clamp(e.x+clamp(args[0],-16,16),0,W-e.w);e.y=clamp(e.y+clamp(args[1],-16,16),0,H-e.h);break;
      case'setVelocity':e.vx=clamp(args[0],-450,450);e.vy=clamp(args[1],-450,450);break;
      case'setVisible':e.visible=!!args[0];break;
      case'playSound':if(['crystal','gem','spring','lever','gate','break','death','jump','tick','whoosh','zap','clunk','checkpoint'].includes(args[0]))SFX.play(args[0],.7);break;
      case'damageSelf':if(e.health.enabled){e.healthNow=Math.max(0,e.healthNow-clamp(args[0]||1,0,100));if(e.healthNow<=0)e.active=false;}break;
      case'healSelf':if(e.health.enabled)e.healthNow=Math.min(e.health.max,e.healthNow+clamp(args[0]||1,0,100));break;
      case'setColor':if(/^#[0-9a-f]{6}$/i.test(String(args[0])))e.sprite.color=args[0];break;
      case'openTag':openTag(String(args[0]).slice(0,40));break;
      case'damagePlayer':if(!pl.dead&&Math.hypot(pl.x-e.x,pl.y-e.y)<70)die();break;
      case'bouncePlayer':if(!pl.dead&&Math.hypot(pl.x-e.x,pl.y-e.y)<70){pl.vy=-clamp(args[0]||260,60,600);pl.onGround=false;}break;
      case'collect':if(e.behavior.type==='collect')collected(e);break;
      case'destroy':e.active=false;break;
      case'log':console.info('[Poison script]',String(args[0]).slice(0,180));break;
    }
  }
  function sandboxBoot(){
    'use strict';let allowed='',scripts=new Map(),errors=new Set();
    function execute(item,method,dt,other){
      if(!item||typeof item.fn?.[method]!=='function')return[];
      const commands=[];const push=(op,...args)=>{if(commands.length<24)commands.push({op,args});};
      const obj=item.data||{};
      const api={id:item.id,x:obj.x||0,y:obj.y||0,w:obj.w||8,h:obj.h||8,props:item.props||{},state:item.state,
        player:obj.player||{},move:(x,y)=>push('move',x,y),setVelocity:(x,y)=>push('setVelocity',x,y),
        setVisible:x=>push('setVisible',x),setColor:x=>push('setColor',x),playSound:x=>push('playSound',x),damageSelf:x=>push('damageSelf',x),healSelf:x=>push('healSelf',x),openTag:x=>push('openTag',x),damagePlayer:()=>push('damagePlayer'),
        bouncePlayer:x=>push('bouncePlayer',x),collect:()=>push('collect'),destroy:()=>push('destroy'),log:x=>push('log',x)};
      try{item.fn[method](api,method==='onUpdate'?dt:other);}catch(ex){if(!errors.has(item.id+method)){errors.add(item.id+method);parent.postMessage({kind:'scriptError',nonce:allowed,error:item.id+': '+String(ex).slice(0,120)},'*');}}
      return commands;
    }
    addEventListener('message',event=>{const msg=event.data;if(!msg||!msg.nonce)return;
      if(msg.kind==='boot'){
        allowed=msg.nonce;scripts=new Map();errors.clear();
        for(const s of (msg.scripts||[]).slice(0,100)){try{
          if(typeof s.code!=='string'||s.code.length>7000)continue;
          const fn=Function('"use strict";return ('+s.code+')')();
          if(!fn||typeof fn!=='object')throw Error('Script must return an object with hooks');
          const item={id:s.id,fn,props:s.props||{},state:{},data:s};scripts.set(s.id,item);
        }catch(e){parent.postMessage({kind:'scriptError',nonce:allowed,error:s.id+': '+String(e).slice(0,120)},'*');}}
        const cmds=[];scripts.forEach(s=>execute(s,'onStart').forEach(cmd=>cmds.push({id:s.id,...cmd})));
        parent.postMessage({kind:'commands',nonce:allowed,commands:cmds},'*');return;
      }
      if(msg.kind!=='tick'||msg.nonce!==allowed)return;
      const positions=new Map((msg.objects||[]).map(o=>[o.id,o])),events=msg.events||[];
      const commands=[];
      for(const item of scripts.values()){
        const pos=positions.get(item.id);if(!pos)continue;item.data={...pos,player:msg.player};
        for(const cmd of execute(item,'onUpdate',Math.max(0,Math.min(.05,msg.dt||0)))){if(commands.length<70)commands.push({id:item.id,...cmd});}
        for(const event of events){if(event.id!==item.id)continue;for(const cmd of execute(item,event.type,0,event.other)){if(commands.length<70)commands.push({id:item.id,...cmd});}}
      }
      parent.postMessage({kind:'commands',nonce:allowed,commands},'*');
    });
  }
  function closeScriptFrame(){active=false;if(iframe){iframe.remove();iframe=null;}}
  function startScripts(){
    closeScriptFrame();if(!approved||!entities.some(e=>e.script.enabled&&e.script.code))return;
    nonce='poison_'+Math.random().toString(36).slice(2)+Date.now();iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.style.display='none';iframe.title='Poison isolated script worker';
    const csp="default-src 'none'; connect-src 'none'; img-src 'none'; media-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; form-action 'none'; base-uri 'none'";
    iframe.srcdoc='<!doctype html><meta http-equiv="Content-Security-Policy" content="'+csp+'"><scr'+'ipt>('+sandboxBoot.toString()+')();</scr'+'ipt>';
    iframe.onload=()=>{if(iframe?.contentWindow){active=true;iframe.contentWindow.postMessage({kind:'boot',nonce,scripts:entities.filter(e=>e.script.enabled&&e.script.code).map(e=>({id:e.id,code:String(e.script.code).slice(0,7000),props:e.script.props||{},x:e.x,y:e.y,w:e.w,h:e.h}))},'*');}};
    document.body.append(iframe);
  }
  window.addEventListener('message',ev=>{if(window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode!=='running') || !active||!iframe||ev.source!==iframe.contentWindow||ev.data?.nonce!==nonce)return;
    if(ev.data.kind==='scriptError'){apiError(ev.data.error);return;}
    if(ev.data.kind!=='commands'||!Array.isArray(ev.data.commands))return;
    for(const c of ev.data.commands.slice(0,MAX_COMMANDS)){if(c&&typeof c.id==='string')command(c.id,c);}
  });
  function halt(){entities.forEach(e=>{if(e.audioEl){try{e.audioEl.pause();e.audioEl.currentTime=0;}catch(err){}}});closeScriptFrame();}
  function activate(){if(approved&&!active)startScripts();}
  function approve(on){approved=!!on;if(approved){if(!window.poisonEditorOpen && (!window.poisonRuntime || window.poisonRuntime.mode==='running'))startScripts();}else closeScriptFrame();}
  const status=()=>({count:entities.length,scriptsAllowed:approved,scriptsActive:active,error:lastError,entities:entities.map(e=>({name:e.name,x:e.x,y:e.y,open:e.open,got:e.got,active:e.active,health:e.healthNow}))});
  return{load:configure,step:tick,draw,blocked,approve,status,halt,activate};
})();
window.poisonCustomRuntime={status:()=>customRuntime.status(),approve:v=>customRuntime.approve(v)};

