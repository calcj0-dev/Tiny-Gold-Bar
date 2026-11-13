// OGP 画像とアイコンを PNG にする。
// og.html はゲームの絵（src/ui/art.ts）を読み込むので、開発サーバー（npm run dev）の URL で開く
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const [, , ogUrl, faviconSvg, outDir] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(ogUrl);
  // 絵を描き終わるまで待つ
  await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${outDir}/og-default.png` });

  const svg = readFileSync(faviconSvg, 'utf-8');
  for (const size of [180, 192, 512]) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:#fff">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    await p.screenshot({ path: `${outDir}/${name}`, omitBackground: false });
  }
} finally {
  await browser.close();
}
console.log('ok');
