# OGP 画像とアイコンの作り方

`public/og-default.png`（1200×630）、`public/icon-192.png`・`icon-512.png`・`apple-touch-icon.png` は、ここの `og.html` と `public/favicon.svg` から作る。
`og.html` の絵は、ゲームと同じ `src/ui/art.ts` で描く。文言や絵を変えたら作り直す。

```
npm i --no-save playwright-core   # Chrome がインストールされている前提
npm run dev                       # 別のターミナルで（例：http://localhost:5173/）
node tools/og/render_assets.mjs http://localhost:5173/tools/og/og.html public/favicon.svg public
```
