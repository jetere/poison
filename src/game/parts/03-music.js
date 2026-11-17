  /* ---- music: plays a track you load (file or URL), looped; no generated music ---- */
  let mGain = null, mEl = null, mSrc = null, mName = '', mBuf = null, mNode = null, mMode = 'none', mDemoReq = false;
  const DEMO_B64 = '__POISON_DEMO_AUDIO_BASE64__';
  function mBase() { return V.music ? V.musicVol * 0.5 : 0; }
  function mSetup() {
    if (mGain) return true; if (!init()) return false;
    mGain = ac.createGain(); mGain.gain.value = mBase(); mGain.connect(ac.destination); return true;
  }
  function elSetup() {
    if (mEl) return true; if (!mSetup()) return false;
    mEl = new Audio(); mEl.loop = true; mEl.crossOrigin = 'anonymous'; mEl.preload = 'auto';
    try { mSrc = ac.createMediaElementSource(mEl); mSrc.connect(mGain); } catch (e) { mEl.volume = Math.min(1, mBase() * 2); }
    mEl.addEventListener('error', () => { mName = 'could not load that track'; });
    return true;
  }
  function demoNode() {
    if (mNode || !mBuf) return;
    mNode = ac.createBufferSource(); mNode.buffer = mBuf; mNode.loop = true; mNode.connect(mGain); mNode.start();
  }
  function killNode() { if (mNode) { try { mNode.stop(); } catch (e) {} mNode = null; } }
  function loadDemo() {
    if (mDemoReq || mMode === 'file') return; if (!mSetup()) return; mDemoReq = true;
    const bin = atob(DEMO_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    ac.decodeAudioData(u.buffer, buf => { mBuf = buf; if (mMode !== 'file') { mMode = 'demo'; mName = 'demo track'; if (V.music && !window.poisonEditorOpen && (!window.poisonRuntime || window.poisonRuntime.mode === 'running') && !document.hidden) demoNode(); } }, () => { mDemoReq = false; });
  }
  function startMusic() {
    if (!V.music || window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode !== 'running') || document.hidden) return;
    if (mMode === 'file') { if (mEl && mEl.src && mEl.paused) mEl.play().catch(() => {}); return; }
    if (mMode === 'demo') demoNode(); else loadDemo();
  }
  function stopMusic() { if (mEl) mEl.pause(); killNode(); }
  const music = {
    start: startMusic, stop: stopMusic,
    load(src, name) { if (!elSetup()) return; killNode(); mMode = 'file'; mEl.src = src; mName = name || 'track'; if (!window.poisonEditorOpen && (!window.poisonRuntime || window.poisonRuntime.mode === 'running') && !document.hidden) { if (ac.state === 'suspended') resumeContext(); startMusic(); } },
    info() { return mMode === 'none' ? 'starting...' : (V.music ? mName : mName + ' (off)'); },
    setVol() { if (mGain) mGain.gain.setTargetAtTime(mBase(), ac.currentTime, 0.05); else if (mEl) mEl.volume = Math.min(1, mBase() * 2); if (!V.music) stopMusic(); else startMusic(); },
    setMood() {}, setSeed() {}, setEnergy() {},
    duck() { if (!mGain) return; const n = ac.currentTime; mGain.gain.setTargetAtTime(mBase() * 0.3, n, 0.02); mGain.gain.setTargetAtTime(mBase(), n + 0.5, 0.2); }
  };
  function runtimeAllowsAudio(){return !window.poisonEditorOpen&&(!window.poisonRuntime||window.poisonRuntime.mode==='running')&&!document.hidden;}
  function resumeContext(){ac.resume().then(()=>{if(!runtimeAllowsAudio()){stopMusic();return ac.suspend();}}).catch(()=>{});}
  function resume() { if (window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode !== 'running') || document.hidden) return; if (init() && ac.state === 'suspended') resumeContext(); startMusic(); }
  function suspend() { stopMusic(); if(ac&&ac.state!=='closed')ac.suspend().catch(()=>{}); }
  function setVol() { if (master) master.gain.value = V.sound ? V.volume : 0; }
  function tone(o) {
    const t = ac.currentTime + (o.delay || 0), dur = o.dur, g = ac.createGain(), osc = ac.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain === undefined ? 0.2 : o.gain), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.02); }
    osc.connect(g); g.connect(o.dest || master); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function bell(f, dur, gain, delay) {
    tone({ type: 'sine', f0: f, dur, gain, delay });
    tone({ type: 'sine', f0: f * 2.76, dur: dur * 0.5, gain: gain * 0.45, delay });
    tone({ type: 'sine', f0: f * 5.4, dur: dur * 0.25, gain: gain * 0.2, delay });
  }
  function noise(o) {
    const t = ac.currentTime + (o.delay || 0), dur = o.dur, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = nb; src.loop = true; f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.f0, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    f.Q.value = o.q || 1;
    g.gain.setValueAtTime(Math.max(0.0002, o.gain === undefined ? 0.2 : o.gain), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || master); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const S = {
    jump: () => { tone({ type: 'sine', f0: 300, f1: 760, dur: 0.11, gain: 0.16 }); tone({ type: 'triangle', f0: 600, f1: 1500, dur: 0.07, gain: 0.04 }); },
    wall: () => { tone({ type: 'triangle', f0: 520, f1: 260, dur: 0.1, gain: 0.14 }); noise({ filter: 'bandpass', f0: 1200, q: 3, dur: 0.05, gain: 0.07 }); },
    land: k => { noise({ f0: 500, f1: 120, dur: 0.12, gain: 0.05 + 0.16 * k }); tone({ type: 'sine', f0: 95, f1: 42, dur: 0.14, gain: 0.08 + 0.22 * k }); },
    dash: () => { noise({ filter: 'bandpass', f0: 400, f1: 4200, q: 1.6, dur: 0.16, gain: 0.3 }); tone({ type: 'sine', f0: 90, f1: 40, dur: 0.18, gain: 0.2 }); tone({ type: 'triangle', f0: 900, f1: 300, dur: 0.12, gain: 0.05 }); },
    super: k => { tone({ type: 'triangle', f0: 260, f1: 900 * k, dur: 0.2, gain: 0.12 }); noise({ filter: 'bandpass', f0: 800, f1: 5000, q: 2, dur: 0.18, gain: 0.12 * k }); },
    refill: () => { bell(1320, 0.18, 0.08); },
    crystal: () => { bell(988, 0.35, 0.1); bell(1480, 0.4, 0.08, 0.08); },
    death: () => { noise({ filter: 'highpass', f0: 3000, f1: 6000, dur: 0.18, gain: 0.2 }); noise({ f0: 1800, f1: 120, dur: 0.45, gain: 0.22 }); tone({ type: 'sine', f0: 500, f1: 70, dur: 0.45, gain: 0.2, vib: [22, 30] }); bell(330, 0.5, 0.06, 0.04); },
    respawn: () => { tone({ type: 'sine', f0: 330, f1: 660, dur: 0.22, gain: 0.12 }); bell(990, 0.3, 0.07, 0.12); },
    checkpoint: () => { [392, 587, 784].forEach((f, i) => bell(f, 0.5, 0.1, i * 0.1)); },
    goal: () => { [392, 494, 587, 784, 988].forEach((f, i) => { bell(f, 0.7, 0.1, i * 0.11); tone({ type: 'sine', f0: f / 2, dur: 0.5, gain: 0.07, delay: i * 0.11 }); }); },
    grab: () => { noise({ filter: 'bandpass', f0: 1000, dur: 0.04, gain: 0.07 }); },
    step: () => { noise({ f0: 380 + Math.random() * 250, dur: 0.05, gain: 0.06 }); },
    gem: () => { const b = [880, 1109, 1319, 1661][Math.floor(Math.random() * 4)]; bell(b, 0.28, 0.1); bell(b * 1.5, 0.3, 0.06, 0.06); },
    spring: () => { tone({ type: 'sine', f0: 200, f1: 900, dur: 0.3, gain: 0.16, vib: [26, 90] }); tone({ type: 'triangle', f0: 400, f1: 1500, dur: 0.18, gain: 0.05 }); },
    crumble: () => { noise({ f0: 500, f1: 90, dur: 0.35, gain: 0.2 }); noise({ filter: 'bandpass', f0: 300, q: 4, dur: 0.12, gain: 0.12, delay: 0.1 }); },
    break: () => { noise({ filter: 'highpass', f0: 1500, dur: 0.12, gain: 0.2 }); noise({ f0: 900, f1: 60, dur: 0.3, gain: 0.3 }); tone({ type: 'sine', f0: 120, f1: 40, dur: 0.25, gain: 0.25 }); bell(700, 0.15, 0.05); },
    slam: k => { noise({ f0: 800, f1: 60, dur: 0.4, gain: 0.42 * k }); tone({ type: 'sine', f0: 85, f1: 28, dur: 0.35, gain: 0.45 * k }); noise({ filter: 'highpass', f0: 2200, dur: 0.07, gain: 0.16 * k }); },
    warnTick: k => { tone({ type: 'sine', f0: 1000, dur: 0.05, gain: 0.12 * k }); tone({ type: 'sine', f0: 1000, dur: 0.05, gain: 0.12 * k, delay: 0.12 }); },
    servo: k => { tone({ type: 'triangle', f0: 130, f1: 230, dur: 0.28, gain: 0.07 * k, vib: [28, 8] }); },
    laserWarn: k => { tone({ type: 'sine', f0: 640, f1: 980, dur: 0.16, gain: 0.13 * k }); tone({ type: 'sine', f0: 640, f1: 980, dur: 0.16, gain: 0.13 * k, delay: 0.2 }); },
    zap: k => { noise({ filter: 'bandpass', f0: 3200, f1: 700, q: 3, dur: 0.22, gain: 0.34 * k }); tone({ type: 'sawtooth', f0: 190, f1: 55, dur: 0.22, gain: 0.14 * k, vib: [60, 40] }); },
    laserHum: k => { tone({ type: 'triangle', f0: 105, dur: 0.16, gain: 0.09 * k, vib: [45, 14] }); },
    saw: k => { noise({ filter: 'bandpass', f0: 2200 + Math.random() * 700, q: 5, dur: 0.1, gain: 0.14 * k }); tone({ type: 'sawtooth', f0: 290 + Math.random() * 70, dur: 0.1, gain: 0.04 * k }); },
    whoosh: k => { noise({ filter: 'bandpass', f0: 500, f1: 2000, q: 1.2, dur: 0.24, gain: 0.2 * k }); },
    wind: k => { noise({ filter: 'bandpass', f0: 380, f1: 720, q: 0.8, dur: 0.45, gain: 0.1 * k }); },
    fan: k => { noise({ filter: 'bandpass', f0: 320, f1: 520, q: 1, dur: 0.32, gain: 0.09 * k }); tone({ type: 'sine', f0: 85, dur: 0.3, gain: 0.05 * k }); },
    bubble: k => { const f = 380 + Math.random() * 320; tone({ type: 'sine', f0: f, f1: f * 1.8, dur: 0.11, gain: 0.09 * k }); },
    moonIn: k => { tone({ type: 'sine', f0: 280, f1: 900, dur: 0.32, gain: 0.13 * k }); bell(1200, 0.3, 0.05 * k, 0.1); },
    moonOut: k => { tone({ type: 'sine', f0: 900, f1: 260, dur: 0.26, gain: 0.12 * k }); },
    belt: k => { noise({ filter: 'highpass', f0: 1500, dur: 0.03, gain: 0.08 * k }); tone({ type: 'triangle', f0: 200, f1: 150, dur: 0.04, gain: 0.05 * k }); },
    clunk: k => { tone({ type: 'sine', f0: 150, f1: 65, dur: 0.14, gain: 0.22 * k }); noise({ f0: 600, f1: 150, dur: 0.08, gain: 0.1 * k }); },
    drip: k => { bell(1500, 0.22, 0.09 * k); },
    thud: k => { noise({ f0: 450, f1: 90, dur: 0.22, gain: 0.28 * k }); tone({ type: 'sine', f0: 75, f1: 38, dur: 0.2, gain: 0.25 * k }); },
    lever: k => { tone({ type: 'square', f0: 180, f1: 90, dur: 0.06, gain: 0.1 * k }); noise({ filter: 'highpass', f0: 2500, dur: 0.03, gain: 0.1 * k }); bell(660, 0.25, 0.07 * k, 0.04); },
    gate: k => { noise({ f0: 400, f1: 70, dur: 0.6, gain: 0.25 * k }); tone({ type: 'sine', f0: 70, f1: 40, dur: 0.5, gain: 0.3 * k }); [523, 659, 784].forEach((f, i) => bell(f, 0.5, 0.08 * k, 0.15 + i * 0.1)); },
    key: k => { [880, 1175, 1568].forEach((f, i) => bell(f, 0.4, 0.1 * k, i * 0.07)); },
    wrong: k => { tone({ type: 'sawtooth', f0: 120, f1: 80, dur: 0.28, gain: 0.14 * k, vib: [30, 6] }); tone({ type: 'square', f0: 90, dur: 0.28, gain: 0.07 * k }); },
    portal: k => { tone({ type: 'sine', f0: 250, f1: 1300, dur: 0.3, gain: 0.14 * k }); noise({ filter: 'bandpass', f0: 600, f1: 3000, q: 2, dur: 0.3, gain: 0.14 * k }); bell(1046, 0.4, 0.07 * k, 0.12); },
    phaseTick: k => { tone({ type: 'sine', f0: 700, f1: 500, dur: 0.05, gain: 0.07 * k }); },
    shoot: k => { noise({ filter: 'bandpass', f0: 1800, f1: 500, q: 2, dur: 0.12, gain: 0.2 * k }); tone({ type: 'square', f0: 520, f1: 140, dur: 0.14, gain: 0.1 * k }); },
    tick: () => { tone({ type: 'sine', f0: 1200, f1: 800, dur: 0.035, gain: 0.08 }); },
    slide: () => { noise({ filter: 'bandpass', f0: 900, f1: 600, q: 2, dur: 0.1, gain: 0.03 }); }
  };
  function play(name, k) {
    if (!V.sound || V.volume <= 0 || window.poisonEditorOpen || (window.poisonRuntime && window.poisonRuntime.mode !== 'running') || document.hidden || !init() || ac.state !== 'running') return;
    if (k !== undefined && k <= 0.03) return;
    const fn = S[name]; if (fn) fn(k === undefined ? 1 : k);
  }
  window.addEventListener('pointerdown', resume); window.addEventListener('keydown', resume);
  return { resume, suspend, setVol, play, music };
})();

