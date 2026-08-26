let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playCardSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    const slap = ctx.createBufferSource();
    const slapLen = 0.06;
    const slapBuf = ctx.createBuffer(1, ctx.sampleRate * slapLen, ctx.sampleRate);
    const slapData = slapBuf.getChannelData(0);
    for (let i = 0; i < slapData.length; i++) {
      const p = i / slapData.length;
      slapData[i] = (Math.random() * 2 - 1) * Math.exp(-p * 12) * 0.6;
    }
    slap.buffer = slapBuf;

    const slapFilter = ctx.createBiquadFilter();
    slapFilter.type = 'bandpass';
    slapFilter.frequency.value = 3500;
    slapFilter.Q.value = 0.8;

    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(180, t);
    thud.frequency.exponentialRampToValueAtTime(60, t + 0.05);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.25, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    const master = ctx.createGain();
    master.gain.value = 0.5;

    slap.connect(slapFilter);
    slapFilter.connect(master);
    thud.connect(thudGain);
    thudGain.connect(master);
    master.connect(ctx.destination);

    slap.start(t);
    slap.stop(t + slapLen);
    thud.start(t);
    thud.stop(t + 0.1);
  } catch (e) {}
}

export function playTrickWonSound() {
  try {
    const ctx = getCtx();
    const duration = 0.2;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.5;
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  } catch (e) {}
}
