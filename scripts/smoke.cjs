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
    await win.loadFile(path.resolve(process.argv[2] || 'dist/index.html'));
    await new Promise(resolve => setTimeout(resolve, 1500));
    assert.equal(await run(`!!window.poisonStudio && poisonRuntime.mode === 'running' && poisonRuntime.frameScheduled`), true, 'startup');
    assert.equal(await run(`typeof window.poisonDesktop?.openProject==='function' && typeof window.require==='undefined'`), true, 'isolated desktop bridge');
    assert.equal(await run(`document.querySelector('#game').getContext('2d').getImageData(0,0,320,180).data.some(v=>v!==0)`), true, 'canvas renders');
    await run(`poisonRuntime.pause(); if(poisonRuntime.mode!=='paused'||poisonRuntime.frameScheduled)throw Error('Pause failed'); poisonRuntime.resume(); poisonStudio.open();`);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(await run(`poisonRuntime.mode==='stopped' && !poisonRuntime.frameScheduled && window.poisonEditorOpen`), true, 'Studio stops game');
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
  } catch (error) { console.error(error); clearTimeout(timeout); app.exit(1); return; }
  clearTimeout(timeout);
  app.exit(0);
});
