/* ---------- sound ---------- */
const SFX = (() => {
  let ac = null, master = null, nb = null;
  function init() {
    if (ac) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC(); master = ac.createGain(); master.gain.value = V.sound ? V.volume : 0; master.connect(ac.destination);
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { ac = null; return false; }
  }
