// 16x16 像素小人，逐格動畫
const PAL = {
  K: '#1a1c2c', // 外框
  H: '#8f4e35', // 頭髮
  S: '#ffcd9c', // 皮膚
  C: '#f6757a', // 腮紅
  R: '#e43b44', // 衣服 / 嘴
  B: '#3b5dc9', // 褲子
};

const BASE = [
  '.......KHK......',
  '....KKKKHKKK....',
  '...KHHHHHHHHK...',
  '..KHHHHHHHHHHK..',
  '..KHHSSSSSSHHK..',
  '..KHSSSSSSSSHK..',
  '..KSSKSSSSKSSK..',
  '..KSSKSSSSKSSK..',
  '..KSCSSKKSSCSK..',
  '...KSSSSSSSSK...',
  '....KKKKKKKK....',
  '...KSRRRRRRSK...',
  '...KKRRRRRRKK...',
  '....KBBBBBBK....',
  '....KBK..KBK....',
  '....KK....KK....',
];

function variant(over) {
  const f = BASE.slice();
  for (const [row, str] of Object.entries(over)) f[row] = str;
  return f;
}

const HAPPY_FACE = {
  6: '..KSSKSSSSKSSK..',
  7: '..KSKSKSSKSKSK..',
  8: '..KSCSKRRKSCSK..',
};
const ARMS_UP = {
  9: '.KSKSSSSSSSSKSK.',
  10: '.KSKKKKKKKKKKSK.',
  11: '..KRRRRRRRRRRK..',
  12: '...KRRRRRRRRK...',
};

const FRAMES = {
  idle: BASE,
  blink: variant({ 6: '..KSSSSSSSSSSK..', 7: '..KSKKSSSSKKSK..' }),
  happy: variant(HAPPY_FACE),
  cheer: variant({ ...HAPPY_FACE, ...ARMS_UP }),
  sleep: variant({ 6: '..KSSSSSSSSSSK..', 7: '..KSKKSSSSKKSK..', 8: '..KSCSSSKSSCSK..' }),
};

const ZZZ = ['KKKK', '..K.', '.K..', 'KKKK'];

const SLEEP_AFTER = 20000;

export class Mascot {
  constructor(canvas, bubble) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bubble = bubble;
    this.state = 'idle';
    this.stateAt = performance.now();
    this.lastActive = this.stateAt;
    this.bubbleTimer = 0;
  }

  setState(state) {
    this.state = state;
    this.stateAt = performance.now();
    this.lastActive = this.stateAt;
  }

  wake() {
    if (this.state === 'sleep') this.setState('idle');
    this.lastActive = performance.now();
  }

  poke() {
    if (this.state === 'cheer' || this.state === 'celebrate') return;
    this.setState('hop');
  }

  say(text, ms = 3000) {
    this.bubble.textContent = text;
    this.bubble.classList.add('show');
    clearTimeout(this.bubbleTimer);
    if (ms > 0) this.bubbleTimer = setTimeout(() => this.bubble.classList.remove('show'), ms);
  }

  update(now) {
    const t = now - this.stateAt;
    let frame = FRAMES.idle;
    let lift = 0;   // 往上跳的高度
    let bob = 0;    // 呼吸上下
    let zzz = false;

    switch (this.state) {
      case 'idle':
        if (now - this.lastActive > SLEEP_AFTER) {
          this.state = 'sleep';
          this.stateAt = now;
        }
        bob = Math.floor(now / 600) % 2;
        frame = now % 3600 < 140 ? FRAMES.blink : FRAMES.idle;
        break;
      case 'sleep':
        bob = Math.floor(now / 1100) % 2;
        frame = FRAMES.sleep;
        zzz = true;
        break;
      case 'cheer': {
        const k = Math.floor(now / 150) % 2;
        frame = k ? FRAMES.cheer : FRAMES.happy;
        lift = k ? 2 : 0;
        break;
      }
      case 'celebrate':
        if (t < 1800) {
          frame = FRAMES.cheer;
          lift = Math.round(Math.abs(Math.sin((t / 1000) * Math.PI * 2.5)) * 8);
        } else {
          frame = FRAMES.happy;
          bob = Math.floor(now / 400) % 2;
        }
        if (t > 3200) this.setState('idle');
        break;
      case 'hop':
        frame = FRAMES.happy;
        lift = Math.round(Math.sin(Math.min(1, t / 450) * Math.PI) * 6);
        if (t > 450) this.setState('idle');
        break;
    }

    this.draw(frame, lift, bob, zzz, now);
  }

  draw(frame, lift, bob, zzz, now) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 影子隨跳躍高度縮小
    const sw = Math.max(6, 12 - Math.floor(lift / 2));
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(12 - sw / 2, 24, sw, 2);

    const ox = 4;
    const oy = 8 + bob - lift;
    for (let y = 0; y < frame.length; y++) {
      const row = frame[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }

    if (zzz) {
      const step = Math.floor(now / 700) % 3;
      ctx.fillStyle = '#c0cbdc';
      for (let i = 0; i <= step && i < 2; i++) {
        const zx = 18 + i * 2;
        const zy = 4 - i * 4;
        ZZZ.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) if (row[x] === 'K') ctx.fillRect(zx + x, zy + y, 1, 1);
        });
      }
    }
  }
}
