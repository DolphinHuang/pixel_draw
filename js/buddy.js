// 畫面底部拿著風車跑來跑去的小傢伙
const PAL = {
  R: '#c4644c', // 頭
  D: '#9a4433', // 頭暗部
  L: '#e3896b', // 頭亮部
  V: '#a99be0', // 側邊紫色反光
  E: '#1a1c2c', // 大眼外圈
  N: '#3a3f5a', // 大眼內
  W: '#ffffff', // 眼睛反光
  X: '#ff6a4d', // 紅色斜線
  M: '#5a1e14', // 瞇眼、嘴巴
  B: '#f4f4f4', // 身體
  G: '#c9c9d6', // 身體陰影
  Y: '#feae34', // 風車中心
};
const OUTLINE = '#4a2418';
const STICK = '#c8a27a';
const BLADES = ['#a6dd6a', '#fbe57a', '#f2a0a8', '#c49be8'];

// 17 寬，倒三角的頭
const HEAD = [
  'LR......X......RR',
  'LRRR..RRXRR..RRRR',
  'VLRRRRREEERRRRRRD',
  'VLRRRRENXNERRRRRD',
  'VVRMRREWXNERRMRD.',
  '.VMRMRENXNERMRMD.',
  '..VLRRREEERRRDD..',
  '...VLRRRXRRRDD...',
  '....VRMRRRRMDD...',
  '.....VRMMMMRD....',
  '......VDDDDD.....',
  '.......DDD.......',
  '........D........',
];

// 23 寬，從第 6 列開始：舉高的手 + 枕頭狀身體
const BODY = [
  '.BB.................BB.',
  '.BB.................BB.',
  '..BB...............BB..',
  '..BBB.............BBB..',
  '...BBBBBBBBBBBBBBBBB...',
  '...BBBBBBBBBBBBBBBBB...',
  '...GBBBBBBBBBBBBBBBG...',
  '...GBBBBBBBBBBBBBBBG...',
  '....GBBBBBBBBBBBBBG....',
  '...GGBBBBBBBBBBBBBGG...',
  '..GGBBBBBBBBBBBBBBBGG..',
];
const FEET = [
  '..GGGGG..........GGG...',
  '...GGG..........GGGGG..',
  '..GGGGG.........GGGGG..',
];

const W = 31;
const H = 30;
const CHAR_X = 4;
const CHAR_Y = 11;
const STICKS = [5, 25];
const PIN_Y = 6;

// 9x9 風車：以中心切成 8 個 45° 扇區，每隔一個填一片葉子。
// phase 0..7 每次轉 45°，葉片顏色跟著扇區走
function pinwheel(phase) {
  const rows = [];
  for (let y = 0; y < 9; y++) {
    const row = [];
    for (let x = 0; x < 9; x++) {
      const dx = x - 4;
      const dy = y - 4;
      if (!dx && !dy) {
        row.push(PAL.Y);
        continue;
      }
      const a = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      const k = (((Math.floor(a / (Math.PI / 4)) - phase) % 8) + 8) % 8;
      row.push(k % 2 ? BLADES[k >> 1] : null);
    }
    rows.push(row);
  }
  return rows;
}

const rnd = (a, b) => a + Math.random() * (b - a);

function compose(feet, spin) {
  const g = Array.from({ length: H }, () => Array(W).fill(null));
  const put = (rows, ox, oy, color) => rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = color(row[x]);
      if (c) g[oy + y][ox + x] = c;
    }
  });
  const pin = pinwheel(spin);
  STICKS.forEach((sx) => put(pin, sx - 4, PIN_Y - 4, (c) => c));
  put(BODY, CHAR_X, CHAR_Y + 6, (ch) => PAL[ch]);
  put([FEET[feet]], CHAR_X, CHAR_Y + 17, (ch) => PAL[ch]);
  put(HEAD, CHAR_X + 3, CHAR_Y, (ch) => PAL[ch]);

  // 自動描邊
  const out = g.map((row) => row.slice());
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      if (g[y - 1]?.[x] || g[y + 1]?.[x] || g[y][x - 1] || g[y][x + 1]) out[y][x] = OUTLINE;
    }
  }
  // 竹竿最後畫在空白處，不加描邊
  for (const sx of STICKS) {
    for (let y = PIN_Y + 5; y < CHAR_Y + 6; y++) if (!out[y][sx]) out[y][sx] = STICK;
  }
  return out;
}

// 預先算好所有影格：腳 3 種 × 風車 8 個角度
const FRAMES = FEET.map((_, f) => [0, 1, 2, 3, 4, 5, 6, 7].map((s) => compose(f, s)));

export class Buddy {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = 40;
    this.dir = 1;
    this.state = 'run';
    this.stateAt = performance.now();
    this.nextPause = this.stateAt + rnd(6000, 12000);
    this.excited = false;
    this.last = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.scale = window.innerWidth < 600 ? 2 : 3;
    this.cw = this.canvas.width = Math.ceil(window.innerWidth / this.scale);
    this.ch = this.canvas.height = H + 4;
    this.canvas.style.height = `${this.ch * this.scale}px`;
    this.x = Math.min(this.x, this.cw - W);
  }

  // 轉盤轉動時跑快一點
  setExcited(on) {
    this.excited = on;
    if (on && this.state === 'pause') this.go('run');
  }

  cheer() {
    this.go('cheer');
  }

  go(state) {
    this.state = state;
    this.stateAt = performance.now();
    if (state === 'run') this.nextPause = this.stateAt + rnd(6000, 12000);
  }

  update(now, reduceMotion) {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    const t = now - this.stateAt;
    let lift = 0;
    let feet = 2;
    let spinRate = 12;
    let running = false;

    if (reduceMotion) {
      this.draw(FRAMES[2][0], 0, false);
      return;
    }

    switch (this.state) {
      case 'run': {
        running = true;
        const speed = this.excited ? 42 : 18;
        this.x += this.dir * speed * dt;
        if (this.x > this.cw - W) { this.x = this.cw - W; this.dir = -1; }
        if (this.x < 0) { this.x = 0; this.dir = 1; }
        const step = Math.floor(now / (this.excited ? 80 : 130)) % 2;
        feet = step;
        lift = step;
        spinRate = this.excited ? 40 : 18;
        if (!this.excited && now > this.nextPause) this.go('pause');
        break;
      }
      case 'pause':
        lift = Math.round(Math.abs(Math.sin(t / 1000 * Math.PI * 1.6)) * 3);
        spinRate = 8;
        if (t > 2600) {
          if (Math.random() < 0.4) this.dir *= -1;
          this.go('run');
        }
        break;
      case 'cheer':
        lift = Math.round(Math.abs(Math.sin(t / 1000 * Math.PI * 1.7)) * 8);
        spinRate = 50;
        if (t > 1800) this.go('run');
        break;
    }

    const spin = Math.floor(now / 1000 * spinRate) % 8;
    this.draw(FRAMES[feet][spin], lift, running, now);
  }

  draw(frame, lift, running, now = 0) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.cw, this.ch);
    const ox = Math.round(this.x);
    const oy = this.ch - H - 1 - lift;
    const flip = this.dir < 0;

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    const sw = Math.max(9, 19 - lift);
    ctx.fillRect(ox + Math.round((W - sw) / 2), this.ch - 2, sw, 2);

    // 身後的速度線
    if (running) {
      const tail = flip ? ox + W - 1 : ox;
      const d = flip ? 1 : -1;
      const wob = Math.floor(now / 100) % 2;
      [['#fee761', 23, 7 + wob], ['#c8a27a', 26, 5], ['#fee761', 28, 4 - wob]].forEach(([color, y, len]) => {
        ctx.fillStyle = color;
        for (let i = 0; i < len; i++) ctx.fillRect(tail + d * (2 + i), oy + y, 1, 1);
      });
    }

    for (let y = 0; y < H; y++) {
      const row = frame[y];
      for (let x = 0; x < W; x++) {
        const c = row[x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(ox + (flip ? W - 1 - x : x), oy + y, 1, 1);
      }
    }
  }
}
