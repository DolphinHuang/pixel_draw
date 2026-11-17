import { rand01 } from './rng.js';

const TAU = Math.PI * 2;
const INK = '#1a1c2c';
const FONT = '"DotGothic16", "PingFang TC", monospace';
const COLORS = [
  '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#2ce8f5',
  '#0099db', '#3b5dc9', '#b55088', '#f6757a', '#3e8948', '#c0cbdc',
];
const DARK_TEXT = new Set(['#feae34', '#fee761', '#63c74d', '#2ce8f5', '#f6757a', '#c0cbdc']);

function colorFor(i, n) {
  let k = i % COLORS.length;
  // 避免最後一格和第一格同色相鄰
  if (n > 1 && i === n - 1 && k === 0) k = 1;
  return COLORS[k];
}

function fitText(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

export class Wheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = canvas.width;
    this.items = [];
    this.rot = 0;          // 順時針旋轉量（弧度）
    this.anim = null;
    this.kick = 0;         // 指針被格線撥動的擺幅
    this.lastSeg = 0;
  }

  get spinning() {
    return this.anim !== null;
  }

  setItems(items) {
    this.items = items.slice();
  }

  // 讓第 index 格停在頂端指針下，落點在格內隨機位置
  spinTo(index, { onTick, onDone } = {}) {
    const n = this.items.length;
    const seg = TAU / n;
    const local = (index + 0.12 + rand01() * 0.76) * seg;
    const delta = (((-local - this.rot) % TAU) + TAU) % TAU;
    const turns = 6 + Math.floor(rand01() * 3);
    this.anim = {
      from: this.rot,
      to: this.rot + turns * TAU + delta,
      start: performance.now(),
      dur: 5000 + rand01() * 1500,
      onTick,
      onDone,
    };
    this.lastSeg = Math.floor(this.rot / seg);
  }

  update(now) {
    const A = this.anim;
    if (A) {
      const p = Math.min(1, (now - A.start) / A.dur);
      const eased = 1 - Math.pow(1 - p, 4);
      this.rot = A.from + (A.to - A.from) * eased;

      const seg = Math.floor(this.rot / (TAU / this.items.length));
      if (seg !== this.lastSeg) {
        this.lastSeg = seg;
        this.kick = 1;
        A.onTick?.();
      }
      if (p >= 1) {
        this.anim = null;
        this.rot %= TAU;
        A.onDone?.();
      }
    }
    this.kick *= 0.8;
    this.draw(now);
  }

  draw(now) {
    const { ctx, size } = this;
    const c = size / 2;
    const rOuter = c - 10;
    const r = rOuter - 16;
    const n = this.items.length;

    ctx.clearRect(0, 0, size, size);

    // 陰影 + 外框
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    disc(ctx, c + 6, c + 8, rOuter + 3);
    ctx.fillStyle = INK;
    disc(ctx, c, c, rOuter + 3);
    ctx.fillStyle = '#3a4466';
    disc(ctx, c, c, rOuter);

    // 跑馬燈：轉動時快速追逐，靜止時慢慢閃
    const bulbs = 24;
    const phase = this.spinning ? Math.floor(now / 70) : Math.floor(now / 650);
    for (let i = 0; i < bulbs; i++) {
      const a = (i / bulbs) * TAU;
      const x = Math.round(c + Math.cos(a) * (r + 8));
      const y = Math.round(c + Math.sin(a) * (r + 8));
      const on = (i + phase) % (this.spinning ? 3 : 2) === 0;
      ctx.fillStyle = INK;
      ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = on ? '#fee761' : '#8b6d2c';
      ctx.fillRect(x - 3, y - 3, 6, 6);
      if (on) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, 2, 2);
      }
    }

    // 扇形
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(this.rot);
    if (n === 0) {
      ctx.fillStyle = '#262b44';
      disc(ctx, 0, 0, r);
    } else {
      const seg = TAU / n;
      for (let i = 0; i < n; i++) {
        const start = -Math.PI / 2 + i * seg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, start, start + seg);
        ctx.closePath();
        ctx.fillStyle = colorFor(i, n);
        ctx.fill();
      }
      if (n > 1) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + i * seg;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.stroke();
        }
      }
      if (n <= 80) this.drawLabels(r, seg);
    }
    ctx.restore();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, TAU);
    ctx.stroke();

    if (n === 0) {
      ctx.fillStyle = '#9aa3c7';
      ctx.font = `16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('名單是空的', c, c - 56);
    }

    this.drawHub(c);
    this.drawPointer(c);
  }

  drawLabels(r, seg) {
    const { ctx } = this;
    const n = this.items.length;
    const fontSize = n <= 10 ? 16 : n <= 20 ? 14 : n <= 40 ? 12 : 10;
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const maxW = r - 14 - 34;
    for (let i = 0; i < n; i++) {
      const color = colorFor(i, n);
      const label = fitText(ctx, this.items[i], maxW);
      ctx.save();
      ctx.rotate(-Math.PI / 2 + (i + 0.5) * seg);
      const x = r - 12;
      if (DARK_TEXT.has(color)) {
        ctx.fillStyle = INK;
        ctx.fillText(label, x, 1);
      } else {
        ctx.fillStyle = INK;
        ctx.fillText(label, x + 1, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x, 1);
      }
      ctx.restore();
    }
  }

  drawHub(c) {
    const { ctx } = this;
    ctx.fillStyle = INK;
    disc(ctx, c, c, 27);
    ctx.fillStyle = '#c27a1a';
    disc(ctx, c, c, 23);
    ctx.fillStyle = '#feae34';
    disc(ctx, c - 1, c - 2, 20);
    ctx.fillStyle = '#fee761';
    ctx.fillRect(c - 12, c - 14, 6, 4);
    ctx.fillStyle = INK;
    ctx.font = `20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.spinning ? '…' : '抽', c, c);
  }

  // 用方塊疊出像素三角指針
  drawPointer(c) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(c, 4);
    ctx.rotate(-this.kick * 0.35);
    const rows = [28, 24, 20, 16, 12, 8, 4];
    rows.forEach((w, i) => {
      ctx.fillStyle = INK;
      ctx.fillRect(-w / 2 - 3, i * 4 - 3, w + 6, 10);
    });
    rows.forEach((w, i) => {
      ctx.fillStyle = i < 2 ? '#ff7b7b' : '#e43b44';
      ctx.fillRect(-w / 2, i * 4, w, 4);
    });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, 1, 4, 3);
    ctx.restore();
  }
}

function disc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
