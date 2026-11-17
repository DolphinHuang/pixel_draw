// 低解析度畫布放大，讓彩帶保持方塊感
const COLORS = ['#e43b44', '#feae34', '#fee761', '#63c74d', '#2ce8f5', '#3b5dc9', '#f6757a', '#ffffff'];
const SCALE = 4;

export class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.dirty = false;
    this.last = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = Math.ceil(window.innerWidth / SCALE);
    this.canvas.height = Math.ceil(window.innerHeight / SCALE);
  }

  burst(count = 140) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    for (let i = 0; i < count; i++) {
      this.parts.push({
        x: Math.random() * W,
        y: -Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 30,
        vy: 20 + Math.random() * 40,
        size: Math.random() < 0.3 ? 2 : 1,
        color: COLORS[i % COLORS.length],
        flip: Math.random() * 1000,
      });
    }
  }

  update(now) {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    const { ctx, canvas } = this;
    if (!this.parts.length) {
      if (this.dirty) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.dirty = false;
      }
      return;
    }
    this.dirty = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of this.parts) {
      p.vy += 30 * dt;
      p.x += p.vx * dt + Math.sin((now + p.flip) / 200) * 0.3;
      p.y += p.vy * dt;
      // 翻轉閃爍
      if (Math.floor((now + p.flip) / 120) % 4 === 0) continue;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    this.parts = this.parts.filter((p) => p.y < canvas.height + 4);
  }
}
