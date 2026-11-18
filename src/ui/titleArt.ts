// タイトル画面の絵（UI 改善 C1。オーナー 2026-11-18）：牛乳パックと、1億円の金塊（一辺6.37cm）を同じ縮尺で並べる。
// OGP の画像と同じ構図。金塊はゆっくりきらめく（動きを減らす設定では止める）

import { sideCm } from '../core/gold';
import { config, objects } from '../data';
import { drawArt, drawGoldCube, groundShadow } from './art';
import { reducedMotion } from './effects';

const W = 240;
const H = 200;
const DEPTH = 0.35;
/** 1億円 */
const SPENT = 100_000_000;

export function createTitleArt(): { el: HTMLCanvasElement; destroy(): void } {
  const canvas = document.createElement('canvas');
  canvas.className = 'title-art';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const milk = objects.find((o) => o.id === 'milk');
  let raf = 0;

  const draw = (sparkle: number) => {
    if (!ctx || !milk) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const ground = H - 6;
    // 牛乳パックの高さが絵の高さの85%になる縮尺
    const s = ((H - 16) * 0.85) / milk.h;
    const mw = milk.w * s;
    const mh = milk.h * s;
    const side = sideCm(SPENT, config.gold) * s;
    const total = mw + 20 + side * (1 + DEPTH);
    const mx = (W - total) / 2;
    const gx = mx + mw + 20;
    groundShadow(ctx, mx + mw / 2, ground, mw);
    groundShadow(ctx, gx + (side * (1 + DEPTH)) / 2, ground, side * (1 + DEPTH));
    drawArt(ctx, 'milk', mx, ground - mh, mw, mh, 2);
    drawGoldCube(ctx, gx, ground, side, DEPTH, sparkle);
  };

  if (reducedMotion()) draw(0.4);
  else {
    const loop = (now: number) => {
      // 2.4秒ごとに、きらめきが強くなったり弱くなったりする
      draw(0.5 + 0.5 * Math.sin((now / 2400) * Math.PI * 2));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  return {
    el: canvas,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
