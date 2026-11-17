import { Wheel } from './wheel.js';
import { Mascot } from './mascot.js';
import { Confetti } from './confetti.js';
import { sfx } from './sound.js';
import { randInt, shuffle, pick } from './rng.js';

const $ = (sel) => document.querySelector(sel);

const STORE_KEY = 'pixel-draw:v1';
const SAMPLE = ['小明', '小華', '阿美', '志明', '春嬌', '阿傑', '小芳', '大頭'];
const MAX_HISTORY = 200;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = Object.assign(
  { text: SAMPLE.join('\n'), mode: 'replace', drawn: [], history: [], muted: false },
  load(),
);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && typeof saved.text === 'string') return saved;
  } catch { /* 無痕模式或資料損壞時用預設值 */ }
  return {};
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch { /* 忽略 */ }
}

const entries = () => state.text.split('\n').map((s) => s.trim()).filter(Boolean);

// 不放回：名單扣掉已抽出的（同名項目按次數扣）
function remaining() {
  const list = entries();
  if (state.mode === 'replace') return list;
  const left = new Map();
  for (const d of state.drawn) left.set(d, (left.get(d) || 0) + 1);
  return list.filter((x) => {
    const c = left.get(x);
    if (c) {
      left.set(x, c - 1);
      return false;
    }
    return true;
  });
}

// ---------- elements ----------
const el = {
  wheel: $('#wheel'),
  mascot: $('#mascot'),
  bubble: $('#bubble'),
  entries: $('#entries'),
  count: $('#count'),
  status: $('#status'),
  modeHint: $('#modeHint'),
  modeInputs: [...document.querySelectorAll('input[name="mode"]')],
  spinBtn: $('#spinBtn'),
  muteBtn: $('#muteBtn'),
  drawnPanel: $('#drawnPanel'),
  drawnList: $('#drawnList'),
  drawnEmpty: $('#drawnEmpty'),
  historyList: $('#historyList'),
  historyEmpty: $('#historyEmpty'),
  modal: $('#modal'),
  modalName: $('#modalName'),
  modalNote: $('#modalNote'),
  lockables: [...document.querySelectorAll('#shuffleBtn, #sortBtn, #sampleBtn, #clearBtn, #resetBtn, #clearHistBtn')],
};

const wheel = new Wheel(el.wheel);
const mascot = new Mascot(el.mascot, el.bubble);
const confetti = new Confetti($('#confetti'));
sfx.muted = state.muted;

// ---------- render ----------
function refresh() {
  const all = entries();
  const left = remaining();
  wheel.setItems(left);

  el.count.textContent = `${all.length} 個`;
  el.status.textContent = state.mode === 'noreplace'
    ? `剩餘 ${left.length} / 共 ${all.length}`
    : `共 ${all.length} 個選項`;
  el.modeHint.textContent = state.mode === 'noreplace'
    ? '不放回：抽到的會從轉盤上移除'
    : '放回：抽到的會留在轉盤上，可重複抽中';
  el.modeInputs.forEach((i) => { i.checked = i.value === state.mode; });
  el.spinBtn.disabled = wheel.spinning || left.length === 0;
  el.spinBtn.textContent = left.length === 0 && all.length > 0 ? '全部抽完了' : '開始抽籤';

  renderDrawn();
  renderHistory();
}

function renderDrawn() {
  el.drawnPanel.hidden = state.mode !== 'noreplace';
  el.drawnList.replaceChildren(...state.drawn.map((name, i) => {
    const li = document.createElement('li');
    const no = document.createElement('b');
    no.textContent = i + 1;
    li.append(no, name);
    return li;
  }));
  el.drawnEmpty.hidden = state.drawn.length > 0;
}

function renderHistory() {
  const total = state.history.length;
  el.historyList.replaceChildren(...state.history.map((h, i) => {
    const li = document.createElement('li');
    const no = document.createElement('span');
    no.className = 'h-no';
    no.textContent = `#${total - i}`;
    const name = document.createElement('span');
    name.className = 'h-name';
    name.textContent = h.name;
    const meta = document.createElement('span');
    meta.className = 'h-meta';
    const mode = document.createElement('span');
    mode.className = 'h-mode';
    mode.textContent = h.mode === 'noreplace' ? '不放回' : '放回';
    const time = new Date(h.t).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    meta.append(mode, ` · ${time}`);
    li.append(no, name, meta);
    return li;
  }));
  el.historyEmpty.hidden = total > 0;
}

function setLocked(locked) {
  el.entries.disabled = locked;
  el.modeInputs.forEach((i) => { i.disabled = locked; });
  el.lockables.forEach((b) => { b.disabled = locked; });
  el.wheel.classList.toggle('is-spinning', locked);
}

// ---------- spin ----------
function spin() {
  if (wheel.spinning) return;
  if (!el.modal.hidden) closeModal();

  const items = remaining();
  if (!items.length) {
    sfx.error();
    mascot.wake();
    mascot.poke();
    mascot.say(entries().length ? '全部抽完囉！按「全部放回」再來一輪' : '先在名單輸入一些選項吧！');
    return;
  }

  const index = randInt(items.length);
  setLocked(true);
  el.spinBtn.disabled = true;
  sfx.start();
  mascot.setState('cheer');
  mascot.say(pick(['轉啊轉～', '會是誰呢？', '緊張緊張！', '衝啊！', '好運降臨！']), 0);

  wheel.spinTo(index, {
    onTick: () => sfx.tick(),
    onDone: () => finish(items[index]),
  });
}

function finish(name) {
  state.history.unshift({ name, mode: state.mode, t: Date.now() });
  state.history.length = Math.min(state.history.length, MAX_HISTORY);
  if (state.mode === 'noreplace') state.drawn.push(name);
  save();

  setLocked(false);
  sfx.win();
  if (!reduceMotion) confetti.burst();
  mascot.setState('celebrate');
  mascot.say(`抽到「${name}」！`, 4000);

  renderDrawn();
  renderHistory();
  openModal(name);
}

// ---------- modal ----------
function openModal(name) {
  el.modalName.textContent = name;
  if (state.mode === 'noreplace') {
    const left = remaining().length;
    el.modalNote.textContent = left ? `已從轉盤移除，還剩 ${left} 個` : '這是最後一個了！';
  } else {
    el.modalNote.textContent = '放回模式：下次還可能抽到';
  }
  el.modal.hidden = false;
  $('#againBtn').disabled = state.mode === 'noreplace' && remaining().length === 0;
  $('#closeBtn').focus();
}

function closeModal() {
  el.modal.hidden = true;
  refresh();
  el.spinBtn.focus();
}

// ---------- events ----------
let editTimer = 0;
el.entries.value = state.text;
el.entries.addEventListener('input', () => {
  clearTimeout(editTimer);
  editTimer = setTimeout(() => {
    state.text = el.entries.value;
    save();
    refresh();
  }, 150);
});

function setText(text) {
  state.text = text;
  el.entries.value = text;
  save();
  refresh();
}

$('#shuffleBtn').addEventListener('click', () => {
  setText(shuffle(entries()).join('\n'));
  sfx.pop();
  mascot.poke();
});
$('#sortBtn').addEventListener('click', () => {
  setText(entries().sort((a, b) => a.localeCompare(b, 'zh-Hant')).join('\n'));
  sfx.pop();
});
$('#sampleBtn').addEventListener('click', () => {
  setText(SAMPLE.join('\n'));
  sfx.pop();
});
$('#clearBtn').addEventListener('click', () => {
  if (!state.text.trim() || confirm('確定要清空名單嗎？')) setText('');
});
$('#resetBtn').addEventListener('click', () => {
  state.drawn = [];
  save();
  refresh();
  sfx.pop();
  mascot.poke();
  mascot.say('全部放回去了！');
});
$('#clearHistBtn').addEventListener('click', () => {
  if (!state.history.length || !confirm('確定要清除所有紀錄嗎？')) return;
  state.history = [];
  save();
  renderHistory();
});

el.modeInputs.forEach((input) => input.addEventListener('change', () => {
  state.mode = input.value;
  save();
  refresh();
  sfx.pop();
  mascot.say(state.mode === 'noreplace' ? '不放回模式：抽到就移除' : '放回模式：可以重複抽中');
}));

el.spinBtn.addEventListener('click', spin);
el.wheel.addEventListener('click', spin);
$('#againBtn').addEventListener('click', spin);
$('#closeBtn').addEventListener('click', closeModal);
el.modal.addEventListener('click', (e) => { if (e.target === el.modal) closeModal(); });

el.mascot.addEventListener('click', () => {
  mascot.wake();
  mascot.poke();
  sfx.pop();
  mascot.say(pick(['嗨！', '要抽籤嗎？', '點轉盤就能開始喔', '我是抽籤小幫手', '別戳我啦～']));
});

el.muteBtn.addEventListener('click', () => {
  state.muted = sfx.muted = !sfx.muted;
  syncMute();
  save();
});
function syncMute() {
  el.muteBtn.textContent = sfx.muted ? '♪ OFF' : '♪ ON';
  el.muteBtn.setAttribute('aria-pressed', String(sfx.muted));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.modal.hidden) {
    closeModal();
    return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === 'TEXTAREA' || tag === 'INPUT') return;
  if (e.code === 'Space' && !(tag === 'BUTTON' && el.modal.hidden)) {
    e.preventDefault();
    spin();
  }
});

document.addEventListener('pointerdown', () => mascot.wake());

// ---------- loop ----------
function loop(now) {
  wheel.update(now);
  mascot.update(now);
  confetti.update(now);
  requestAnimationFrame(loop);
}

syncMute();
refresh();
requestAnimationFrame(loop);
document.fonts?.ready.then(() => wheel.draw(performance.now()));
setTimeout(() => mascot.say('嗨！點轉盤開始抽籤吧'), 600);
