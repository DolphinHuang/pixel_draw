// 介面文字。用 {name} 代入變數，陣列代表隨機挑一句
const STRINGS = {
  zh: {
    title: '像素抽籤機',
    logoSub: '像素抽籤機',
    langBtn: 'EN',
    langTitle: 'Switch to English',
    muteTitle: '音效開關',
    themeTitle: '背景效果：{name}（點擊切換）',
    theme_stars: '★ 星空',
    theme_snow: '❄ 下雪',
    theme_off: '背景關',
    wheelLabel: '抽籤轉盤，點擊開始抽籤',
    mascotTitle: '戳我一下',
    modeGroup: '抽籤模式',
    modeReplace: '放回',
    modeNoReplace: '不放回',
    hintReplace: '放回：抽到的會留在轉盤上，可重複抽中',
    hintNoReplace: '不放回：抽到的會從轉盤上移除',
    spin: '開始抽籤',
    allDrawn: '全部抽完了',
    keyHint: '點轉盤或按 <kbd>空白鍵</kbd> 也可以抽',
    statusReplace: '共 {total} 個選項',
    statusNoReplace: '剩餘 {left} / 共 {total}',
    list: '名單',
    count: '{n} 個',
    placeholder: '一行輸入一個選項',
    shuffle: '打亂',
    sort: '排序',
    sample: '範例',
    clear: '清空',
    drawn: '已抽出',
    resetDrawn: '全部放回',
    drawnEmpty: '還沒有抽出任何項目',
    history: '紀錄',
    clearHistory: '清除',
    historyEmpty: '轉一下就會留下紀錄',
    again: '再抽一次',
    close: '關閉',
    noteRemoved: '已從轉盤移除，還剩 {left} 個',
    noteLast: '這是最後一個了！',
    noteReplace: '放回模式：下次還可能抽到',
    confirmClear: '確定要清空名單嗎？',
    confirmClearHistory: '確定要清除所有紀錄嗎？',
    wheelEmpty: '名單是空的',
    hub: '抽',
    sayHello: '嗨！點轉盤開始抽籤吧',
    sayEmpty: '先在名單輸入一些選項吧！',
    sayAllDrawn: '全部抽完囉！按「全部放回」再來一輪',
    sayResult: '抽到「{name}」！',
    sayReset: '全部放回去了！',
    sayModeReplace: '放回模式：可以重複抽中',
    sayModeNoReplace: '不放回模式：抽到就移除',
    saySpin: ['轉啊轉～', '會是誰呢？', '緊張緊張！', '衝啊！', '好運降臨！'],
    sayPoke: ['嗨！', '要抽籤嗎？', '點轉盤就能開始喔', '我是抽籤小幫手', '別戳我啦～'],
    sayBuddyGrab: ['放開它啦！', '它在發抖耶…', '輕一點輕一點！', '它好像很緊張'],
    sayBuddyDrop: ['沒事吧？', '飛好遠！', '它暈了…'],
    samples: ['小明', '小華', '阿美', '志明', '春嬌', '阿傑', '小芳', '大頭'],
  },
  en: {
    title: 'Pixel Draw',
    logoSub: 'Random Picker Wheel',
    langBtn: '中文',
    langTitle: '切換成中文',
    muteTitle: 'Toggle sound',
    themeTitle: 'Background: {name} (click to change)',
    theme_stars: '★ Stars',
    theme_snow: '❄ Snow',
    theme_off: 'BG off',
    wheelLabel: 'Picker wheel, click to spin',
    mascotTitle: 'Poke me',
    modeGroup: 'Draw mode',
    modeReplace: 'Keep',
    modeNoReplace: 'Remove',
    hintReplace: 'Keep: picked items stay on the wheel and can win again',
    hintNoReplace: 'Remove: picked items are taken off the wheel',
    spin: 'SPIN',
    allDrawn: 'All drawn',
    keyHint: 'You can also click the wheel or press <kbd>Space</kbd>',
    statusReplace: '{total} entries',
    statusNoReplace: '{left} left of {total}',
    list: 'Entries',
    count: '{n}',
    placeholder: 'One entry per line',
    shuffle: 'Shuffle',
    sort: 'Sort',
    sample: 'Sample',
    clear: 'Clear',
    drawn: 'Drawn',
    resetDrawn: 'Put all back',
    drawnEmpty: 'Nothing drawn yet',
    history: 'History',
    clearHistory: 'Clear',
    historyEmpty: 'Spin once to start a history',
    again: 'Spin again',
    close: 'Close',
    noteRemoved: 'Removed from the wheel, {left} left',
    noteLast: 'That was the last one!',
    noteReplace: 'Keep mode: it can be picked again',
    confirmClear: 'Clear the whole list?',
    confirmClearHistory: 'Clear all history?',
    wheelEmpty: 'The list is empty',
    hub: 'GO',
    sayHello: 'Hi! Click the wheel to spin',
    sayEmpty: 'Add some entries to the list first!',
    sayAllDrawn: 'All drawn! Press "Put all back" for another round',
    sayResult: 'It\'s "{name}"!',
    sayReset: 'Everything is back on the wheel!',
    sayModeReplace: 'Keep mode: winners can repeat',
    sayModeNoReplace: 'Remove mode: winners leave the wheel',
    saySpin: ['Round and round~', 'Who will it be?', 'So exciting!', 'Go go go!', 'Good luck!'],
    sayPoke: ['Hi!', 'Wanna spin?', 'Click the wheel to start', 'I\'m your picker buddy', 'Hey, stop poking~'],
    sayBuddyGrab: ['Put it down!', 'It\'s shaking…', 'Gently, gently!', 'It looks nervous'],
    sayBuddyDrop: ['You okay?', 'Wheee!', 'It\'s dizzy…'],
    samples: ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'],
  },
};

export const LANGS = Object.keys(STRINGS);

let current = 'zh';

export function setLang(lang) {
  current = STRINGS[lang] ? lang : 'zh';
  return current;
}

export function getLang() {
  return current;
}

// 網址 ?lang= 優先，其次是上次的選擇，最後看瀏覽器語言
export function detectLang(saved) {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (STRINGS[fromUrl]) return fromUrl;
  if (STRINGS[saved]) return saved;
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function t(key, vars) {
  const s = STRINGS[current][key] ?? STRINGS.zh[key] ?? key;
  if (!vars || typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// 套用 data-i18n（textContent）、data-i18n-html、data-i18n-attr="attr:key;attr:key"
export function applyDom(root = document) {
  document.documentElement.lang = current === 'zh' ? 'zh-Hant' : 'en';
  document.title = t('title');
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr, t(key));
    }
  });
}
