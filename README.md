# 像素抽籤機 PIXEL DRAW

像素風轉盤抽籤，純 HTML / CSS / JS，不需要安裝或建置。

- **放回 / 不放回** 兩種模式；不放回時抽中的項目會從轉盤移除，可「全部放回」重來
- 會動的像素小人：待機呼吸眨眼、轉盤時歡呼、抽中跳躍，放著不動會睡著，點它會跳
- 8-bit 音效（WebAudio 即時合成）、像素彩帶、跑馬燈
- 抽籤使用 `crypto.getRandomValues`，每個選項機率相同
- 名單、模式、紀錄存在瀏覽器 localStorage
- **中文 / English** 介面，右上角切換；也可以用網址 `?lang=en` 或 `?lang=zh` 指定

## 本機執行

ES modules 不能用 `file://` 直接開，需要起一個本機伺服器：

```bash
python3 -m http.server 8000
```

然後打開 <http://localhost:8000>

## 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "Pixel draw wheel"
git branch -M main
git remote add origin https://github.com/<帳號>/<repo>.git
git push -u origin main
```

到 repo 的 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main` / `(root)`，儲存後約一分鐘即可在
`https://<帳號>.github.io/<repo>/` 看到。

## 檔案結構

```
index.html
css/style.css
js/main.js      狀態、UI、事件
js/wheel.js     轉盤繪製與旋轉動畫
js/mascot.js    像素小人 sprite 與動畫
js/confetti.js  像素彩帶
js/sound.js     8-bit 音效
js/rng.js       亂數工具
js/i18n.js      中英文字串
```
