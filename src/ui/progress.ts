// 比べる物の並び（オーナー案 2026-11-13）：12個の小さなイラストを「›」でつなぎ、
// 追い越した物・次の物・まだ先の物が分かるようにする。「次は〇〇」の文字の代わり

import { objects } from '../data';
import { t } from '../i18n';
import { drawArt } from './art';
import { h } from './dom';
import { objectName } from './scene';

const ICON = 22;
const PAD = 2;

export type Progress = { el: HTMLElement; update(passed: number): void };

export function createProgress(): Progress {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const items = objects.map((o) => {
    const c = document.createElement('canvas');
    c.width = Math.round(ICON * dpr);
    c.height = Math.round(ICON * dpr);
    c.style.width = `${ICON}px`;
    c.style.height = `${ICON}px`;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      // 物の縦横比のまま、枠に収める
      const k = Math.min((ICON - PAD * 2) / o.w, (ICON - PAD * 2) / o.h);
      const w = o.w * k;
      const hh = o.h * k;
      drawArt(ctx, o.id, (ICON - w) / 2, (ICON - hh) / 2, w, hh, 0.8);
    }
    return h('span', { className: 'prog-item', attrs: { title: objectName(o) } }, [c]);
  });
  const row = h('div', { className: 'progress', attrs: { role: 'img' } });
  items.forEach((it, i) => {
    if (i > 0) row.append(h('span', { className: 'prog-arrow', text: '›', attrs: { 'aria-hidden': 'true' } }));
    row.append(it);
  });
  // 比べている物の名前を大きく（オーナー案 2026-11-13）。全部追い越したら「全部追い越しました。まだ買えます」
  const nameEl = h('p', { className: 'prog-name', attrs: { 'aria-hidden': 'true' } });
  const el = h('div', { className: 'progress-wrap' }, [row, nameEl]);

  return {
    el,
    update(passed) {
      items.forEach((it, i) => {
        it.classList.toggle('passed', i < passed);
        it.classList.toggle('current', i === passed);
      });
      const next = objects[passed];
      row.setAttribute('aria-label', next ? t('play.next', { name: objectName(next) }) : t('play.allPassed'));
      nameEl.textContent = next ? objectName(next) : t('play.allPassed');
      nameEl.classList.toggle('all', !next);
    },
  };
}
