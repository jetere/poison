const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const assert = require('node:assert/strict');
const timeout = setTimeout(() => { console.error('Smoke test timed out'); app.exit(1); }, 30000);
app.whenReady().then(async () => {
  // A temporary session prevents tests from changing the user's saved scenes.
  const win = new BrowserWindow({ show: false, webPreferences: { preload: path.resolve('electron/preload.cjs'), partition: 'poison-smoke', contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  const errors = [];
  let scriptRan = false;
  win.webContents.on('console-message', event => {
    if (event.message.includes('[Poison script] smoke-script-ok')) scriptRan = true;
    if (event.level === 'error' && !event.message.includes('ERR_NAME_NOT_RESOLVED')) errors.push(event.message);
  });
  const run = code => win.webContents.executeJavaScript(code);
  try {
    await win.loadURL('about:blank');
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Page.enable');
    await win.webContents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:'window.__DBG = value => { window.smokeDebug = value; };'});
    await win.loadFile(path.resolve(process.argv[2] || 'dist/index.html'));
    await new Promise(resolve => setTimeout(resolve, 1500));
    assert.equal(await run(`!!window.poisonStudio && poisonRuntime.mode === 'running' && poisonRuntime.frameScheduled`), true, 'startup');
    assert.equal(await run(`typeof window.poisonDesktop?.openProject==='function' && typeof window.require==='undefined'`), true, 'isolated desktop bridge');
    assert.equal(await run(`document.querySelector('#game').getContext('2d').getImageData(0,0,320,180).data.some(v=>v!==0)`), true, 'canvas renders');
    await run(`poisonRuntime.pause(); if(poisonRuntime.mode!=='paused'||poisonRuntime.frameScheduled)throw Error('Pause failed'); poisonRuntime.resume(); poisonStudio.open();`);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(await run(`poisonRuntime.mode==='stopped' && !poisonRuntime.frameScheduled && window.poisonEditorOpen`), true, 'Studio stops game');
    await run(`
      (()=>{
        const original=JSON.stringify(poisonStudio.serialize());
        const generate=(seed,layout='linear',length='320')=>{
          document.querySelector('#ps-new').click();document.querySelector('#ps-new-seed').click();
          document.querySelector('#pg-seed').value=seed;document.querySelector('#pg-lay').value=layout;document.querySelector('#pg-len').value=length;document.querySelector('#pg-go').click();
          return JSON.stringify(poisonProcedural.snapshot);
        };
        const first=generate(42);if(generate(42)!==first)throw Error('Procedural seed not repeatable');
        if(generate(43)===first)throw Error('Different seeds identical');

        for(const layout of ['auto','linear','rise','fall','zigzag','zagup']){
          generate(42,layout,'512');const map=poisonProcedural.snapshot;
          if(!map.grid.length||!map.cps.length||!map.goal)throw Error('Incomplete generated map');
          if(layout!=='auto'&&map.layout!==layout)throw Error('Layout setting ignored');
          const scene=poisonStudio.serialize();
          const terrain=Array.from({length:map.rows},()=>Array(map.cols).fill(0));for(const [r,c,n,v] of scene.tiles)for(let i=0;i<n;i++)terrain[r][c+i]=v;
          if(JSON.stringify(terrain)!==JSON.stringify(map.grid))throw Error('Generated terrain changed during import');
          for(const group of ['cps','gems','springs','saws','fans','movers','belts','winds','moons','crushers','lasers','drips','gates','levers','keys','portals','turrets','crystals']){
            const records=scene.meta.filter(m=>m[2].generated?.group===group).map(m=>m[2].generated.data);
            if(JSON.stringify(records)!==JSON.stringify(map[group]))throw Error('Generated objects changed: '+group);
          }
          poisonStudio.deserialize(JSON.parse(JSON.stringify(scene)));
          if(JSON.stringify(poisonStudio.serialize())!==JSON.stringify(scene))throw Error('Generated scene round-trip changed data');
          poisonStudio.play();
          if(poisonRuntime.mode!=='running')throw Error('Generated scene build failed');
          if(JSON.stringify(smokeDebug.lvl.grid)!==JSON.stringify(map.grid))throw Error('Playing generated scene changed terrain');
          for(const group of ['gems','springs','saws','fans','movers','belts','winds','moons','crushers','lasers','drips','levers','keys','portals','turrets','crystals']){
            if(JSON.stringify(smokeDebug.lvl[group])!==JSON.stringify(map[group]))throw Error('Playing changed generated objects: '+group);
          }
          poisonStudio.open();
        }
        if(poisonRuntime.mode!=='stopped'||poisonRuntime.frameScheduled)throw Error('Generator started runtime in editor');
        document.querySelector('[data-tab="hierarchy"]').click();
        document.querySelector('#ps-scene-list .ps-scene-item').click();
        const before=JSON.stringify(poisonStudio.serialize());const x=document.querySelector('#psi-x');x.value=Number(x.value)-2;x.dispatchEvent(new Event('change'));
        const moved=JSON.stringify(poisonStudio.serialize());if(moved===before)throw Error('Generated object cannot be edited');
        poisonStudio.undo();if(JSON.stringify(poisonStudio.serialize())!==before)throw Error('Generated edit undo failed');
        poisonStudio.redo();if(JSON.stringify(poisonStudio.serialize())!==moved)throw Error('Generated edit redo failed');
        const edited=poisonStudio.serialize();edited.tiles.push([1,1,1,2]);poisonStudio.deserialize(edited);const normalizedEdited=JSON.stringify(poisonStudio.serialize());
        poisonStudio.play();if(smokeDebug.lvl.grid[1][1]!==2)throw Error('Edited terrain lost on play');
        if(window.procOn||poisonRuntime.mode!=='running')throw Error('Edited map was not played as a scene');
        poisonStudio.open();if(JSON.stringify(poisonStudio.serialize())!==normalizedEdited)throw Error('Opening editor discarded edits');
        if(document.querySelector('#ps-save').disabled||document.querySelector('#ps-export').disabled)throw Error('Generated map cannot save/export');
        document.querySelector('#pg-toggle').click();if(!window.procOn)throw Error('Game toggle failed');
        const generated=JSON.stringify(poisonStudio.serialize());document.querySelector('#ps-procedural').click();
        if(window.procOn||JSON.stringify(poisonStudio.serialize())!==generated)throw Error('Turning off discarded generated scene');
        poisonStudio.deserialize(JSON.parse(original));
      })();
    `);
    await run(`poisonRuntime.resume(); if(poisonRuntime.mode!=='stopped')throw Error('Studio allowed game to resume');
      window.smokeScene=poisonStudio.serialize(); poisonStudio.deserialize(JSON.parse(JSON.stringify(smokeScene)));
      if(JSON.stringify(poisonStudio.serialize())!==JSON.stringify(smokeScene))throw Error('JSON round-trip changed scene');
      document.querySelector('#ps-theme-toggle').click();
      const sky=document.querySelector('#ps-theme-skyfx');sky.value='galaxy';sky.dispatchEvent(new Event('change',{bubbles:true}));
      document.querySelector('#ps-theme-name').value='Smoke Galaxy';document.querySelector('#ps-theme-save').click();
      if(poisonStudio.serialize().themeData.skyFx!=='galaxy')throw Error('Galaxy theme not saved');
      poisonStudio.undo();if(poisonStudio.serialize().theme!==smokeScene.theme)throw Error('Undo failed');
      poisonStudio.redo();if(poisonStudio.serialize().themeData.skyFx!=='galaxy')throw Error('Redo failed');
      poisonStudio.createCustom('empty');
      const scene=poisonStudio.serialize(), prefab=scene.prefabs[scene.prefabs.length-1][1];
      prefab.components.script={enabled:true,code:'({onStart(api){api.log("smoke-script-ok")}})',props:{test:7}};
      scene.objs.push([12,8,'custom']);scene.meta.push([12,8,{custom:prefab}]);
      poisonStudio.deserialize(scene);
      window.smokeCustom=poisonStudio.serialize();poisonStudio.deserialize(JSON.parse(JSON.stringify(smokeCustom)));
      if(JSON.stringify(poisonStudio.serialize())!==JSON.stringify(smokeCustom))throw Error('Custom theme/object/prefab round-trip changed scene');
      if(poisonCustomRuntime.status().scriptsAllowed)throw Error('Import enabled scripts');
      poisonStudio.play();
    `);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(await run(`poisonRuntime.mode==='running' && poisonCustomRuntime.status().count===1 && !poisonCustomRuntime.status().scriptsActive`), true, 'Galaxy scene and imported object play without scripts');
    await run(`poisonStudio.open();poisonStudio.enableScripts();document.querySelector('#ps-script-allow').click();poisonStudio.play();`);
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal(scriptRan, true, 'approved custom script runs');
    await run(`poisonStudio.open();if(poisonCustomRuntime.status().scriptsActive)throw Error('Studio left script running');
      poisonStudio.deserialize(smokeCustom);if(poisonCustomRuntime.status().scriptsAllowed)throw Error('Reimport retained script permission');
      poisonStudio.close();if(poisonRuntime.mode!=='stopped')throw Error('Closing Studio restarted game');
      poisonRuntime.restart();if(poisonRuntime.mode!=='running')throw Error('Restart failed');poisonRuntime.stop();`);
    assert.deepEqual(errors, [], 'renderer errors');
    console.log('PASS: startup, canvas, pause/resume/restart, Studio stop, Galaxy, undo/redo, custom objects, script approval, JSON round-trip.');
  } catch (error) { console.error(error, errors); clearTimeout(timeout); app.exit(1); return; }
  clearTimeout(timeout);
  app.exit(0);
});
