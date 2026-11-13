// 金塊と「次に追い越す物」を同じ縮尺で描く（設計書 3.3）。
// 物は輪郭と名前だけの簡単な図形【案】。金塊は正面と上面の2面の立方体。刻印・ロゴは入れない

import { sideCm } from '../core/gold';
import { type CompareObject, config, objects } from '../data';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/types';

/** 物の名前（ja.json の objects。全部の id の名前があることは data.ts で検査済み） */
export function objectName(o: CompareObject): string {
  return t(`objects.${o.id}` as MessageKey);
}

/** 上面の奥行き（一辺に対する割合）。上面は右上へずらして描く */
export const DEPTH = 0.35;
/** 物と金塊のあいだ（px） */
export const GAP_PX = 24;
/** 左右の余白（px） */
const SIDE_PAD = 16;
/** 物の名前を書く所の高さ（px） */
const LABEL_H = 28;
const BOUNCE_MS = 160;

type Size = { w: number; h: number };

/**
 * 縮尺（1cm あたりの px）。
 * - 次の物の高さが、絵の領域の高さ×ratio になる縮尺
 * - 金塊（上面の奥行きを含む）が次の物より大きく描かれるときは、金塊が入るように下げる
 * - 物＋あいだ＋金塊の幅が領域に入らないときも下げる（確認事項 Q2：浴槽など横長の物）
 * - 全部追い越したあとは、金塊が領域の ratio になる縮尺で、最後の物と並べる
 */
export function computeScale(
  area: Size,
  side: number,
  next: CompareObject | null,
  last: CompareObject,
  ratio: number,
  pad = SIDE_PAD,
  gap = GAP_PX,
): number {
  const goldExtent = side * (1 + DEPTH);
  const targetH = area.h * ratio;
  const obj = next ?? last;
  let s = next ? targetH / Math.max(next.h, goldExtent) : targetH / goldExtent;
  const availW = area.w - pad * 2 - gap;
  if (availW > 0) s = Math.min(s, availW / (obj.w + goldExtent));
  return s;
}

export type Scene = {
  el: HTMLCanvasElement;
  /** 状態が変わったら呼ぶ。bounce：タップで金塊を弾ませる */
  update(spent: number, passed: number, bounce: boolean): void;
  destroy(): void;
};

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createScene(): Scene {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  const ctx = canvas.getContext('2d');
  const last = objects[objects.length - 1]!;

  let size: Size = { w: 0, h: 0 };
  let spent = 0;
  let passed = 0;
  let scale = 0;
  // ズーム（次の物が替わったとき、zoomMs かけて縮尺を変える）
  let zoom: { from: number; start: number } | null = null;
  let bounceStart = -Infinity;
  let raf = 0;

  const next = () => objects[passed] ?? null;
  const side = () => sideCm(spent, config.gold);
  const target = () => (size.h > 0 ? computeScale({ w: size.w, h: size.h - LABEL_H }, side(), next(), last, config.view.nextObjectHeightRatio) : 0);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    size = { w: rect.width, h: rect.height };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    zoom = null;
    scale = target();
    draw(performance.now());
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function frame(now: number) {
    raf = 0;
    draw(now);
    const zooming = zoom !== null;
    const bouncing = now - bounceStart < BOUNCE_MS;
    if (zooming || bouncing) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function draw(now: number) {
    if (!ctx || size.w === 0) return;
    const goal = target();
    if (zoom) {
      const p = Math.min(1, (now - zoom.start) / config.view.zoomMs);
      const e = 1 - (1 - p) ** 3;
      // 縮尺は何百倍も変わるので、対数で補間して一定の速さで引いて見せる
      scale = zoom.from > 0 && goal > 0 ? Math.exp(Math.log(zoom.from) + (Math.log(goal) - Math.log(zoom.from)) * e) : goal;
      if (p >= 1) zoom = null;
    } else {
      scale = goal;
    }

    ctx.clearRect(0, 0, size.w, size.h);
    // 金塊（タップで少し弾む。下を軸に伸び縮み）
    const bp = (now - bounceStart) / BOUNCE_MS;
    const k = bp >= 0 && bp < 1 && !reducedMotion() ? 1 + 0.08 * Math.sin(Math.PI * bp) : 1;
    paintScene(ctx, { x: 0, y: 0, w: size.w, h: size.h }, spent, passed, scale, { bounce: k });
  }

  return {
    el: canvas,
    update(nextSpent, nextPassed, bounce) {
      const nextChanged = nextPassed !== passed;
      if (nextChanged && !reducedMotion() && scale > 0) zoom = { from: scale, start: performance.now() };
      spent = nextSpent;
      passed = nextPassed;
      if (bounce) bounceStart = performance.now();
      kick();
    },
    destroy() {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

type Box = { x: number; y: number; w: number; h: number };
type PaintOptions = { bounce?: number; fontPx?: number; lineWidth?: number; pad?: number; gap?: number };

/**
 * 枠 box の中に、地面・次の物（全部追い越したら最後の物）・物の名前・金塊を描く。
 * scale を省くと、その枠に合う縮尺（computeScale）で描く。プレイ・結果画面と結果画像で使う
 */
export function paintScene(ctx: CanvasRenderingContext2D, box: Box, spent: number, passed: number, scale?: number, opt: PaintOptions = {}): void {
  const fontPx = opt.fontPx ?? 13;
  const labelH = fontPx + 15;
  const pad = opt.pad ?? SIDE_PAD;
  const gap = opt.gap ?? GAP_PX;
  const k = opt.bounce ?? 1;
  const last = objects[objects.length - 1]!;
  const next = objects[passed] ?? null;
  const side = sideCm(spent, config.gold);
  const s = scale ?? computeScale({ w: box.w, h: box.h - labelH }, side, next, last, config.view.nextObjectHeightRatio, pad, gap);

  const ground = box.y + box.h - labelH;
  const obj = next ?? last;
  const sidePx = side * s;
  const objW = obj.w * s;
  const goldW = sidePx * (1 + DEPTH);
  const x0 = box.x + (box.w - (objW + gap + goldW)) / 2;

  // 地面
  ctx.strokeStyle = cssVar('--line', '#e6e3da');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + pad, ground + 0.5);
  ctx.lineTo(box.x + box.w - pad, ground + 0.5);
  ctx.stroke();

  drawObject(ctx, obj, x0, ground, objW, obj.h * s, opt.lineWidth ?? 2);

  // 物の名前
  ctx.fillStyle = cssVar('--text-sub', '#6b665c');
  ctx.font = `${fontPx}px system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(objectName(obj), x0 + objW / 2, ground + Math.round(fontPx * 0.45));

  drawGold(ctx, x0 + objW + gap + (goldW - goldW * k) / 2, ground, sidePx * k);
}

function drawObject(ctx: CanvasRenderingContext2D, obj: CompareObject, x: number, ground: number, w: number, h: number, lineWidth: number) {
  const y = ground - h;
  ctx.fillStyle = cssVar('--surface', '#f5f5f2');
  ctx.strokeStyle = cssVar('--text-sub', '#6b665c');
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  switch (obj.shape) {
    case 'ellipse':
    case 'circle':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'roundRect':
      ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.18);
      break;
    case 'trapezoid': {
      const inset = w * 0.12;
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - inset, ground);
      ctx.lineTo(x + inset, ground);
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
}

function drawGold(ctx: CanvasRenderingContext2D, x: number, ground: number, s: number) {
  const gold = cssVar('--gold', '#d4a017');
  // 1px 未満は 1px の点（設計書 3.3）
  if (s < 1) {
    ctx.fillStyle = gold;
    ctx.fillRect(Math.round(x), ground - 1, 1, 1);
    return;
  }
  const d = s * DEPTH;
  const top = ground - s;
  // 上面
  ctx.fillStyle = cssVar('--gold-light', '#f2c94c');
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + d, top - d);
  ctx.lineTo(x + s + d, top - d);
  ctx.lineTo(x + s, top);
  ctx.closePath();
  ctx.fill();
  // 正面
  const grad = ctx.createLinearGradient(x, top, x + s, ground);
  grad.addColorStop(0, gold);
  grad.addColorStop(1, cssVar('--gold-dark', '#a87b0a'));
  ctx.fillStyle = grad;
  ctx.fillRect(x, top, s, s);
}
