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

// 被抓住時的臉：> < 眼睛加張開的嘴
const PANIC_HEAD = HEAD.map((row, i) => ({
  3: 'VLMRRRENXNERRRMRD',
  5: '.VMRRRENXNERRRMD.',
  8: '....VRRMMMMRDD...',
  9: '.....VRMXXMRD....',
}[i] ?? row));

const SWEAT = ['.S.', 'SWS', 'SSS', '.S.'];
const SWEAT_PAL = { S: '#9ad4ff', W: '#ffffff' };

const GRAVITY = 420;
const rnd = (a, b) => a + Math.random() * (b - a);

function compose(feet, spin, head) {
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
  put(head, CHAR_X + 3, CHAR_Y, (ch) => PAL[ch]);

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

// 預先算好所有影格：表情 2 種 × 腳 3 種 × 風車 8 個角度
const SPINS = [0, 1, 2, 3, 4, 5, 6, 7];
const FRAMES = {
  happy: FEET.map((_, f) => SPINS.map((s) => compose(f, s, HEAD))),
  panic: FEET.map((_, f) => SPINS.map((s) => compose(f, s, PANIC_HEAD))),
};

// 這些元素上按下去是在操作介面，不是抓小傢伙
const UI_SELECTOR = '.panel, button, textarea, input, label, a, .modal, .logo, .bubble';

export class Buddy {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = 40;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.state = 'run';
    this.stateAt = performance.now();
    this.nextPause = this.stateAt + rnd(6000, 12000);
    this.excited = false;
    this.last = 0;
    this.drops = [];
    this.nextDrop = 0;
    this.grab = null;
    this.onGrab = null;
    this.onDrop = null;
    this.onLand = null;
    this.resize();
    this.y = this.ground;
    window.addEventListener('resize', () => this.resize());
    this.bindPointer();
  }

  get ground() {
    return this.ch - H - 1;
  }

  resize() {
    this.scale = window.innerWidth < 600 ? 2 : 3;
    this.cw = this.canvas.width = Math.ceil(window.innerWidth / this.scale);
    this.ch = this.canvas.height = Math.ceil(window.innerHeight / this.scale);
    this.x = Math.min(this.x, this.cw - W);
    if (this.state !== 'held' && this.state !== 'fall') this.y = this.ground;
  }

  // 轉盤轉動時跑快一點
  setExcited(on) {
    this.excited = on;
    if (on && this.state === 'pause') this.go('run');
  }

  cheer() {
    if (this.state === 'held' || this.state === 'fall') return;
    this.go('cheer');
  }

  go(state) {
    this.state = state;
    this.stateAt = performance.now();
    if (state === 'run') this.nextPause = this.stateAt + rnd(6000, 12000);
    this.canvas.classList.toggle('is-held', state === 'held' || state === 'fall');
  }

  // ---------- 抓取 ----------
  toLocal(e) {
    return { x: e.clientX / this.scale, y: e.clientY / this.scale };
  }

  hit(e) {
    if (e.target.closest?.(UI_SELECTOR) && this.state !== 'fall') return false;
    const p = this.toLocal(e);
    // 判定範圍略縮到身體與風車
    return p.x >= this.x + 2 && p.x <= this.x + W - 2 && p.y >= this.y + 2 && p.y <= this.y + H;
  }

  bindPointer() {
    const down = (e) => {
      if (this.grab || !this.hit(e)) return;
      e.preventDefault();
      const p = this.toLocal(e);
      this.grab = { id: e.pointerId, dx: p.x - this.x, dy: p.y - this.y, lx: p.x, ly: p.y, lt: performance.now() };
      this.vx = this.vy = 0;
      this.go('held');
      document.body.classList.add('buddy-grabbing');
      this.onGrab?.();
    };
    const move = (e) => {
      if (!this.grab) {
        if (e.pointerType === 'mouse') document.body.classList.toggle('buddy-hover', this.hit(e));
        return;
      }
      if (e.pointerId !== this.grab.id) return;
      const p = this.toLocal(e);
      const now = performance.now();
      const dt = Math.max(1, now - this.grab.lt) / 1000;
      // 平滑後的甩動速度，放開時用來丟出去
      this.vx = this.vx * 0.6 + ((p.x - this.grab.lx) / dt) * 0.4;
      this.vy = this.vy * 0.6 + ((p.y - this.grab.ly) / dt) * 0.4;
      Object.assign(this.grab, { lx: p.x, ly: p.y, lt: now });
      this.x = Math.max(-W / 2, Math.min(this.cw - W / 2, p.x - this.grab.dx));
      this.y = Math.max(-H / 2, Math.min(this.ground, p.y - this.grab.dy));
    };
    const up = (e) => {
      if (!this.grab || e.pointerId !== this.grab.id) return;
      this.grab = null;
      document.body.classList.remove('buddy-grabbing');
      const cap = 260;
      this.vx = Math.max(-cap, Math.min(cap, this.vx));
      this.vy = Math.max(-cap, Math.min(cap, this.vy));
      this.go('fall');
      this.onDrop?.();
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // 手機上按住小傢伙時不要捲動頁面
    window.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (t && this.hit({ clientX: t.clientX, clientY: t.clientY, target: e.target })) e.preventDefault();
    }, { passive: false });
  }

  // ---------- 動畫 ----------
  update(now, reduceMotion) {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    const t = now - this.stateAt;
    let lift = 0;
    let feet = 2;
    let spinRate = 12;
    let face = 'happy';
    let running = false;
    let shake = 0;

    if (reduceMotion && this.state !== 'held') {
      this.y = this.ground;
      this.draw(FRAMES.happy[2][0], 0, { now });
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
      case 'held':
        // 掙扎：亂踢腳、左右扭、狂冒汗
        face = 'panic';
        feet = Math.floor(now / 70) % 2;
        shake = Math.floor(now / 60) % 2 ? 1 : -1;
        spinRate = 60;
        if (now > this.nextDrop) {
          this.nextDrop = now + rnd(120, 260);
          this.spawnDrop();
        }
        break;
      case 'fall':
        face = 'panic';
        feet = Math.floor(now / 90) % 2;
        spinRate = 40;
        this.vy += GRAVITY * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx) * 0.5; }
        if (this.x > this.cw - W) { this.x = this.cw - W; this.vx = -Math.abs(this.vx) * 0.5; }
        if (this.y < 0) { this.y = 0; this.vy = Math.abs(this.vy) * 0.3; }
        if (this.y >= this.ground) {
          this.y = this.ground;
          if (this.vy > 90) {
            this.vy = -this.vy * 0.35;
            this.vx *= 0.6;
            this.onLand?.();
          } else {
            this.vx = this.vy = 0;
            this.go('dizzy');
          }
        }
        break;
      case 'dizzy':
        spinRate = 3;
        if (t > 1200) {
          this.dir = Math.random() < 0.5 ? 1 : -1;
          this.go('run');
        }
        break;
    }

    if (this.state !== 'held' && this.state !== 'fall') this.y = this.ground;
    this.updateDrops(dt);

    const spin = Math.floor(now / 1000 * spinRate) % 8;
    this.draw(FRAMES[face][feet][spin], lift, { running, shake, now, dizzy: this.state === 'dizzy' });
  }

  spawnDrop() {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.drops.push({
      x: this.x + W / 2 + side * rnd(5, 9),
      y: this.y + CHAR_Y + rnd(0, 3),
      vx: side * rnd(15, 35),
      vy: rnd(-55, -30),
      life: 0.7,
    });
  }

  updateDrops(dt) {
    for (const d of this.drops) {
      d.vy += GRAVITY * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
    }
    this.drops = this.drops.filter((d) => d.life > 0);
  }

  draw(frame, lift, { running = false, shake = 0, now = 0, dizzy = false } = {}) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.cw, this.ch);
    const ox = Math.round(this.x) + shake;
    const oy = Math.round(this.y) - lift;
    const flip = this.dir < 0;

    // 影子：離地越高越小越淡
    const height = this.ground - this.y + lift;
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.35 - height / 300)})`;
    const sw = Math.max(7, 19 - Math.round(height / 6));
    ctx.fillRect(Math.round(this.x) + Math.round((W - sw) / 2), this.ch - 2, sw, 2);

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

    // 掙扎時身體兩側的抖動線
    if (shake) {
      ctx.fillStyle = OUTLINE;
      const k = Math.floor(now / 90) % 2;
      for (const [sx, s] of [[ox - 2, -1], [ox + W + 1, 1]]) {
        ctx.fillRect(sx + s * k, oy + CHAR_Y + 8, 1, 3);
        ctx.fillRect(sx + s * (k + 2), oy + CHAR_Y + 7, 1, 5);
      }
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

    // 暈眩：頭上轉圈的小星星
    if (dizzy) {
      ctx.fillStyle = '#fee761';
      for (let i = 0; i < 3; i++) {
        const a = now / 200 + (i * Math.PI * 2) / 3;
        const sx = Math.round(ox + W / 2 + Math.cos(a) * 9);
        const sy = Math.round(oy + CHAR_Y - 3 + Math.sin(a) * 2);
        ctx.fillRect(sx - 1, sy, 3, 1);
        ctx.fillRect(sx, sy - 1, 1, 3);
      }
    }

    for (const d of this.drops) {
      ctx.globalAlpha = Math.min(1, d.life * 3);
      SWEAT.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const c = SWEAT_PAL[row[x]];
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(Math.round(d.x) + x, Math.round(d.y) + y, 1, 1);
        }
      });
    }
    ctx.globalAlpha = 1;
  }
}
