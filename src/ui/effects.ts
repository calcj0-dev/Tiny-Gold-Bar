// プレイ画面の手ごたえの演出（UI 改善 A1〜A3。オーナー 2026-11-18）。
// 動きを減らす設定（prefers-reduced-motion）では、どれも動かさない

import { h } from './dom';

export function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 同時に出す数の上限（連打しても重くならず、重なって読めなくならないように） */
const MAX_FLOATS = 3;
const MAX_COINS = 36;
const FLOAT_SLOTS = [50, 22, 78];
let floatSlot = 0;

/** A1：「+100円」をボタンの上にふわっと浮かべて消す。host は position: relative の要素 */
export function spawnPlus(host: HTMLElement, text: string): void {
  if (reducedMotion()) return;
  const live = host.querySelectorAll('.float-plus');
  if (live.length >= MAX_FLOATS) live[0]?.remove();
  const el = h('span', { className: 'float-plus', text, attrs: { 'aria-hidden': 'true' } });
  // 左右・上下にずらして、連打したときに重ならないようにする（真ん中・左・右を順に回す）
  floatSlot = (floatSlot + 1) % FLOAT_SLOTS.length;
  el.style.left = `${FLOAT_SLOTS[floatSlot]! + (Math.random() - 0.5) * 4}%`;
  el.style.top = `${(Math.random() - 0.5) * 12}px`;
  el.addEventListener('animationend', () => el.remove());
  host.append(el);
}

/**
 * A2：金の粒を from（画面の座標）から to へ、山なりに飛ばす。count 個。
 * layer は画面いっぱいの重ね（position: fixed、pointer-events: none）
 */
export function spawnCoins(layer: HTMLElement, from: DOMRect, to: { x: number; y: number }, count: number): void {
  if (reducedMotion() || typeof Element.prototype.animate !== 'function') return;
  for (let i = 0; i < count; i++) {
    if (layer.childElementCount >= MAX_COINS) layer.firstElementChild?.remove();
    const x0 = from.left + from.width * (0.3 + Math.random() * 0.4);
    const y0 = from.top + from.height * 0.3;
    const x1 = to.x + (Math.random() - 0.5) * 10;
    const y1 = to.y + (Math.random() - 0.5) * 10;
    // 山の高さ：上へふくらむ
    const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 80;
    const my = Math.min(y0, y1) - 40 - Math.random() * 60;
    const el = h('span', { className: 'coin' });
    layer.append(el);
    const anim = el.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0 },
        { transform: `translate(${x0}px, ${y0 - 10}px) scale(1)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${mx}px, ${my}px) scale(1.1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.2 },
      ],
      { duration: 420 + Math.random() * 160, delay: i * 30, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'both' },
    );
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
  }
}

/**
 * A3：数字を from から to へ、少しだけカウントアップして見せる（ms ミリ秒）。
 * 途中で次の値が来たら、今見えている値から続ける。戻り値の stop で止める
 */
export function createCounter(onValue: (v: number) => void, ms = 260) {
  let shown = 0;
  let target = 0;
  let start = 0;
  let from = 0;
  let raf = 0;
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    const e = 1 - (1 - p) ** 3;
    shown = from + (target - from) * e;
    onValue(p >= 1 ? target : shown);
    raf = p < 1 ? requestAnimationFrame(step) : 0;
  };
  return {
    set(v: number, animate: boolean) {
      target = v;
      if (!animate || reducedMotion() || v === shown) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        shown = v;
        onValue(v);
        return;
      }
      from = shown;
      start = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
