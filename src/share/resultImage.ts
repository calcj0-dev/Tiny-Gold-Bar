// 結果画像 1200×630（設計書 1.6）。画面に出さない Canvas に描いて PNG にする。
// 中身：作品名、「〇円で金を買ったら」、金塊と次の物を同じ縮尺で並べた絵、
// 「金塊（〇kg）は、まだ〇〇より小さい」、作品のURL、免責1行

import type { Game } from '../core/gold';
import { siteUrl } from '../data';
import { t } from '../i18n';
import { summarize } from '../ui/resultText';
import { paintScene } from '../ui/scene';

export const IMAGE_W = 1200;
export const IMAGE_H = 630;
const FONT = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
const TEXT = '#1f1d1a';
const SUB = '#6b665c';
const GOLD_DARK = '#a87b0a';
const SURFACE = '#f5f5f2';

/** 幅に収まるよう、文字を小さくする（最小 min px） */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number, min = 20): void {
  let s = size;
  for (; s > min; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = `${weight} ${s}px ${FONT}`;
}

/** 文字を幅で折り返して描く（日本語は1文字ずつ折り返せる）。描いた行数を返す */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineH: number, maxLines: number): number {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return Math.min(lines.length, maxLines);
}

/** 画面の作品URL から https:// と末尾の / を除いたもの（画像に書く） */
export function displayUrl(url = siteUrl()): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function renderResultImage(game: Game): Promise<Blob | null> {
  try {
    await document.fonts?.ready;
  } catch {
    // フォントの読み込みを待てなくても描く
  }
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_W;
  canvas.height = IMAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const s = summarize(game);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, IMAGE_W, IMAGE_H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // 左：文字
  const left = 64;
  const textW = 520;
  ctx.fillStyle = GOLD_DARK;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(t('image.heading'), left, 64);

  ctx.fillStyle = TEXT;
  fitText(ctx, t('image.line1', { spent: s.spent }), textW, 56, 700);
  ctx.fillText(t('image.line1', { spent: s.spent }), left, 170);

  // 2行目は文言の中の改行（\n）で分ける（「金塊（5kg）は、」／「まだ牛乳パックより小さい」）。
  // 長すぎる行は幅で折り返す
  const line2 = s.next ? t('image.line2Still', { weight: s.weight, next: s.next }) : t('image.line2All', { weight: s.weight, last: s.last });
  const parts = line2.split('\n');
  let y = 268;
  for (const part of parts) {
    fitText(ctx, part, textW, 44, 700, 32);
    y += wrapText(ctx, part, left, y, textW, 58, 2) * 58;
  }

  // 右：金塊と次の物（同じ縮尺）
  const panel = { x: 620, y: 48, w: 516, h: 470 };
  ctx.fillStyle = SURFACE;
  ctx.beginPath();
  ctx.roundRect(panel.x, panel.y, panel.w, panel.h, 24);
  ctx.fill();
  paintScene(ctx, { x: panel.x + 16, y: panel.y + 24, w: panel.w - 32, h: panel.h - 40 }, game.spent, game.passed, undefined, {
    fontPx: 24,
    lineWidth: 3,
    pad: 8,
    gap: 32,
  });

  // 下：作品のURLと免責（絵を描くと文字の揃えが中央になるので、左揃えに戻す）
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = SUB;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(displayUrl(), left, 556);
  ctx.font = `400 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(t('image.footer'), IMAGE_W - 64, 562);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
