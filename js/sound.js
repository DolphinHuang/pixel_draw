// 8-bit 音效：用 WebAudio 方波即時合成，不需要音檔
let ctx = null;
let lastTick = 0;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.06, delay = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  muted: false,

  tick() {
    if (this.muted) return;
    const now = performance.now();
    if (now - lastTick < 35) return;
    lastTick = now;
    tone(1200, 0.025, { vol: 0.035 });
  },

  start() {
    if (this.muted) return;
    [330, 440, 660].forEach((f, i) => tone(f, 0.08, { delay: i * 0.06 }));
  },

  win() {
    if (this.muted) return;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone(f, i === 5 ? 0.35 : 0.1, { delay: i * 0.09, vol: 0.07 }));
  },

  pop() {
    if (this.muted) return;
    tone(660, 0.05);
    tone(990, 0.06, { delay: 0.05 });
  },

  error() {
    if (this.muted) return;
    tone(196, 0.12, { type: 'square' });
    tone(147, 0.18, { delay: 0.12 });
  },
};
