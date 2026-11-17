// 背景氛圍層：低解析度畫布放大，粒子都是像素 sprite
const SCALE = 4;
const TAU = Math.PI * 2;

export const THEMES = ['stars', 'snow', 'off'];

const SNOW_CROSS = ['.W.', 'WWW', '.W.'];

const rnd = (a, b) => a + Math.random() * (b - a);

export class Ambient {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = 'off';
    this.parts = [];
    this.stars = [];
    this.shooters = [];
    this.nextShooter = 0;
    this.wind = 0;
    this.gustUntil = 0;
    this.last = 0;
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.populate();
    });
  }

  resize() {
    this.W = this.canvas.width = Math.ceil(window.innerWidth / SCALE);
    this.H = this.canvas.height = Math.ceil(window.innerHeight / SCALE);
  }

  setTheme(theme) {
    this.theme = THEMES.includes(theme) ? theme : THEMES[0];
    this.populate();
    if (this.theme === 'off') this.ctx.clearRect(0, 0, this.W, this.H);
  }

  // 抽中時吹一陣風，雪花往旁邊飄
  gust() {
    this.gustUntil = performance.now() + 1600;
  }

  populate() {
    const area = this.W * this.H;
    this.parts = [];
    this.stars = [];
    this.shooters = [];
    if (this.theme === 'snow') {
      const n = Math.round(area / 380);
      for (let i = 0; i < n; i++) this.parts.push(this.makeFlake(true));
    } else if (this.theme === 'stars') {
      const n = Math.round(area / 700);
      for (let i = 0; i < n; i++) {
        this.stars.push({
          x: Math.floor(Math.random() * this.W),
          y: Math.floor(Math.random() * this.H),
          big: Math.random() < 0.08,
          phase: Math.random() * TAU,
          speed: rnd(0.6, 2),
          color: Math.random() < 0.2 ? '#fee761' : Math.random() < 0.3 ? '#9ad4ff' : '#f4f4f4',
        });
      }
    }
  }

  makeFlake(anywhere) {
    const r = Math.random();
    return {
      kind: r < 0.1 ? 'cross' : r < 0.4 ? 'big' : 'dot',
      x: rnd(0, this.W),
      y: anywhere ? rnd(-4, this.H) : rnd(-8, -2),
      vy: r < 0.1 ? rnd(4, 6) : rnd(6, 14),
      sway: rnd(2, 6),
      swayRate: rnd(0.5, 1.2),
      phase: Math.random() * TAU,
      alpha: rnd(0.5, 1),
    };
  }

  update(now, reduceMotion) {
    if (this.theme === 'off') return;
    const dt = reduceMotion ? 0 : Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    const target = now < this.gustUntil ? 45 : 4;
    this.wind += (target - this.wind) * Math.min(1, dt * 2.5);

    const { ctx } = this;
    ctx.clearRect(0, 0, this.W, this.H);
    if (this.theme === 'snow') this.drawSnow(now, dt);
    else if (this.theme === 'stars') this.drawStars(now, dt, reduceMotion);
  }

  drawSnow(now, dt) {
    const t = now / 1000;
    const { ctx } = this;
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.y += p.vy * dt;
      p.x += (this.wind * 0.6 + Math.sin(t * p.swayRate + p.phase) * p.sway) * dt;
      if (p.y > this.H + 4) {
        this.parts[i] = this.makeFlake(false);
        continue;
      }
      if (p.x < -4) p.x += this.W + 8;
      if (p.x > this.W + 4) p.x -= this.W + 8;
      if (p.kind === 'cross') {
        this.blit(SNOW_CROSS, p.x, p.y, { W: '#e8f4ff' }, p.alpha);
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#e8f4ff';
        const s = p.kind === 'big' ? 2 : 1;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawStars(now, dt, reduceMotion) {
    const t = now / 1000;
    const { ctx } = this;
    for (const s of this.stars) {
      const tw = reduceMotion ? 1 : (Math.sin(t * s.speed + s.phase) + 1) / 2;
      ctx.globalAlpha = 0.25 + tw * 0.75;
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big && tw > 0.6) {
        ctx.globalAlpha = (tw - 0.6) * 2;
        ctx.fillRect(s.x - 1, s.y, 1, 1);
        ctx.fillRect(s.x + 1, s.y, 1, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 1);
        ctx.fillRect(s.x, s.y + 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    if (reduceMotion) return;

    // 流星：每 4~9 秒一顆，斜向劃過並留下漸淡的尾巴
    if (now > this.nextShooter) {
      this.nextShooter = now + rnd(4000, 9000);
      this.shooters.push({ x: rnd(this.W * 0.2, this.W), y: rnd(-4, this.H * 0.3), v: rnd(90, 140), life: 0 });
    }
    for (const m of this.shooters) {
      m.life += dt;
      m.x -= m.v * dt;
      m.y += m.v * 0.5 * dt;
      for (let k = 0; k < 10; k++) {
        ctx.globalAlpha = 1 - k / 10;
        ctx.fillStyle = k === 0 ? '#ffffff' : '#fee761';
        ctx.fillRect(Math.round(m.x + k * 2), Math.round(m.y - k), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    this.shooters = this.shooters.filter((m) => m.x > -24 && m.y < this.H + 12);
  }

  blit(frame, x, y, colors, alpha) {
    const { ctx } = this;
    const ox = Math.round(x);
    const oy = Math.round(y);
    ctx.globalAlpha = alpha;
    for (let r = 0; r < frame.length; r++) {
      const row = frame[r];
      for (let c = 0; c < row.length; c++) {
        const col = colors[row[c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + c, oy + r, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}
