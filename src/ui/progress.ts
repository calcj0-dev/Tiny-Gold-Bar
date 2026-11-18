// 比べる物の並び（オーナー案 2026-11-13）：12個の小さなイラストを「›」でつなぎ、
// 追い越した物・次の物・まだ先の物が分かるようにする。「次は〇〇」の文字の代わり。
// 追い越したときは、追い越した物と次の物のアイコンがポンと跳ねる

import { objects } from '../data';
import { t } from '../i18n';
import { iconCanvas } from './art';
import { h } from './dom';
import { objectName } from './scene';

const ICON = 22;

export type Progress = { el: HTMLElement; update(passed: number): void };

export function createProgress(): Progress {
  const items = objects.map((o) => h('span', { className: 'prog-item', attrs: { title: objectName(o) } }, [iconCanvas(o, ICON)]));
  const row = h('div', { className: 'progress', attrs: { role: 'img' } });
  items.forEach((it, i) => {
    if (i > 0) row.append(h('span', { className: 'prog-arrow', text: '›', attrs: { 'aria-hidden': 'true' } }));
    row.append(it);
  });
  // 比べている物の名前を大きく（オーナー案 2026-11-13）。全部追い越したら「全部追い越しました。まだ買えます」
  const nameEl = h('p', { className: 'prog-name', attrs: { 'aria-hidden': 'true' } });
  const el = h('div', { className: 'progress-wrap' }, [row, nameEl]);
  let shown = -1;

  const pop = (it: HTMLElement | undefined) => {
    if (!it) return;
    it.classList.remove('pop');
    // 付け直してアニメーションをもう一度動かす
    void it.offsetWidth;
    it.classList.add('pop');
  };

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
      if (shown >= 0 && passed > shown) {
        pop(items[passed - 1]);
        pop(items[passed]);
        pop(nameEl);
      }
      shown = passed;
    },
  };
}
