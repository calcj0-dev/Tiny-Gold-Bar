// 結果画像 1200×630（設計書 1.6）。画面に出さない Canvas に描いて PNG にする。
// 中身：作品名、「〇円で金を買ったら」、金塊と次の物を同じ縮尺で並べた絵、
// 「金塊（〇kg）は、まだ〇〇より小さい」、作品のURL、免責1行。
// 見た目は結果画面のカードにそろえる（UI 改善 ★6：温かい地・丸ゴシック・「ちっさ…」のハンコ・「一辺〇cm」の札）

import type { Game } from '../core/gold';
import { siteUrl } from '../data';
import { t } from '../i18n';
import { summarize } from '../ui/resultText';
import { paintScene } from '../ui/scene';

export const IMAGE_W = 1200;
export const IMAGE_H = 630;
const FONT = '"TGB Rounded", system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
const TEXT = '#2b2418';
const SUB = '#7a6e5a';
const GOLD_DARK = '#a87b0a';
const BG = '#fffaf0';
const RED = '#d0453b';

/** 「ちっさ…」のハンコ（中心 cx, cy。少し傾けて押す） */
function paintStamp(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.font = `800 46px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const w = tw + 40;
  const h = 72;
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 16);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 3);
  ctx.restore();
}

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
    // 丸ゴシックは使うときに読み込まれるので、描く前に読み込んでおく
    await Promise.all([
      document.fonts?.load(`800 40px ${FONT}`),
      document.fonts?.load(`700 40px ${FONT}`),
      document.fonts?.load(`500 26px ${FONT}`),
    ]);
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

  // 地：結果画面と同じ温かい色と、左上の金色の光（UI 改善 ★6）
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, IMAGE_W, IMAGE_H);
  const glow = ctx.createRadialGradient(280, 180, 0, 280, 180, 560);
  glow.addColorStop(0, 'rgba(255,233,170,0.75)');
  glow.addColorStop(1, 'rgba(255,233,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, IMAGE_W, IMAGE_H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // 左：文字
  const left = 64;
  const textW = 500;
  ctx.fillStyle = GOLD_DARK;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(t('image.heading'), left, 60);

  ctx.fillStyle = TEXT;
  fitText(ctx, t('image.line1', { spent: s.spent }), textW, 58, 800);
  ctx.fillText(t('image.line1', { spent: s.spent }), left, 156);

  // 2行目は文言の中の改行（\n）で分ける（「金塊（5kg）は、」／「まだ牛乳パックより小さい」）。
  // 長すぎる行は幅で折り返す
  const line2 = s.next ? t('image.line2Still', { weight: s.weight, next: s.next }) : t('image.line2All', { weight: s.weight, last: s.last });
  const parts = line2.split('\n');
  let y = 256;
  for (const part of parts) {
    fitText(ctx, part, textW, 44, 800, 32);
    y += wrapText(ctx, part, left, y, textW, 60, 2) * 60;
  }

  // 「ちっさ…」のハンコ（結果画面と同じ）
  paintStamp(ctx, t('result.stamp'), left + 230, Math.max(y + 60, 450));

  // 右：金塊と次の物（同じ縮尺）のカード
  const card = { x: 608, y: 40, w: 548, h: 486 };
  ctx.save();
  ctx.shadowColor = 'rgba(120,90,30,0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 28);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 28);
  ctx.clip();
  const cardBg = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
  cardBg.addColorStop(0, '#fff6d8');
  cardBg.addColorStop(0.45, '#ffffff');
  ctx.fillStyle = cardBg;
  ctx.fillRect(card.x, card.y, card.w, card.h);
  paintScene(ctx, { x: card.x + 12, y: card.y + 20, w: card.w - 24, h: card.h - 32 }, game.spent, game.passed, undefined, {
    fontPx: 24,
    lineWidth: 3,
    pad: 14,
    gap: 40,
    sizeTag: true,
    tagPx: 22,
  });
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f0dca4';
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 28);
  ctx.stroke();

  // 下：作品のURLと免責（絵を描くと文字の揃えが中央になるので、左揃えに戻す）
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = SUB;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(displayUrl(), left, 560);
  ctx.font = `500 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(t('image.footer'), IMAGE_W - 44, 566);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
