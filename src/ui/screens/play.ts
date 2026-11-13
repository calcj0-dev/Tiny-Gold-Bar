// S2 プレイ（設計書 2章・1.4）。
// 「金を買う」は pointerdown で反応（連打の遅れをなくす。設計書 5.6）

import { sfx } from '../../audio';
import { buy, grams, objectPrice, passedCount } from '../../core/gold';
import { formatApproxYen, formatNumberJa, formatWeight, formatYen } from '../../core/format';
import { config, objects } from '../../data';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';
import { createScene, objectName } from '../scene';
import { soundButton } from '../parts';
import { createProgress } from '../progress';

const TOAST_MS = 1500;

export const playScreen: ScreenFactory = (app) => {
  // 開発用の早送り：?spent=800000000000 のように使ったお金から始める（公開版では無視する。設計書 6.2）
  if (import.meta.env.DEV) {
    const v = Number(new URLSearchParams(location.search).get('spent'));
    if (Number.isInteger(v) && v > 0 && session.game.spent === 0) {
      session.game = { ...session.game, spent: v, taps: 1, passed: passedCount(v, objects, config.gold) };
    }
  }

  const toResult = button(t('play.toResult'), () => app.go('result'), 'btn btn-small');
  const back = button('←', () => app.go('title'), 'icon-btn');
  back.setAttribute('aria-label', t('play.back'));

  const spentEl = h('span', { className: 'stat-value' });
  const weightEl = h('span', { className: 'stat-value' });
  const progress = createProgress();
  const toastMain = h('p', { className: 'toast-main' });
  const toastSub = h('p', { className: 'toast-sub' });
  const toast = h('div', { className: 'toast', attrs: { role: 'status', 'aria-live': 'polite' } }, [toastMain, toastSub]);

  // 物の名前は並びの下に大きく出すので、絵の下には書かない
  const scene = createScene({ label: false });

  const amountButtons = config.amounts.map((a) => {
    const b = button(formatYen(a), () => {
      session.game = { ...session.game, amount: a };
      render(false);
    }, 'amount-btn');
    b.dataset.amount = String(a);
    return b;
  });

  const buyBtn = h('button', { className: 'buy-btn', text: t('play.buy'), attrs: { type: 'button' } });
  // 指・マウスは押した瞬間に買う。キーボード（Enter・Space）は click で買う
  buyBtn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onBuy();
  });
  buyBtn.addEventListener('click', (e) => {
    if (e.detail === 0) onBuy();
  });

  let toastTimer = 0;

  function onBuy() {
    const r = buy(session.game, objects, config.gold);
    session.game = r.game;
    if (r.newlyPassed) {
      // 2つ以上追い越しても、一言と音は1回（一番大きい物）
      showToast(r.newlyPassed);
      sfx.pass();
    } else {
      sfx.buy(config.amounts.indexOf(r.game.amount), config.amounts.length);
    }
    render(true);
  }

  function showToast(o: (typeof objects)[number]) {
    const name = objectName(o);
    toastMain.textContent = t('play.pass', { name });
    toastSub.textContent = t('play.passSub', { name, price: formatApproxYen(objectPrice(o, config.gold)) });
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), TOAST_MS);
  }

  function render(bounce: boolean) {
    const g = session.game;
    spentEl.textContent = formatYen(g.spent);
    weightEl.textContent = t('play.weightValue', {
      weight: formatWeight(grams(g.spent, config.gold)),
      taps: t('play.taps', { n: formatNumberJa(g.taps) }),
    });
    progress.update(g.passed);
    toResult.disabled = g.taps === 0;
    for (const b of amountButtons) {
      const on = Number(b.dataset.amount) === g.amount;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    }
    scene.update(g.spent, g.passed, bounce);
  }

  const el = h('div', { className: 'screen play' }, [
    h('div', { className: 'top-bar' }, [back, toResult, h('span', { className: 'spacer' }), soundButton()]),
    h('div', { className: 'stats' }, [
      h('div', { className: 'stat' }, [h('span', { className: 'stat-label', text: t('play.spent') }), spentEl]),
      h('div', { className: 'stat' }, [h('span', { className: 'stat-label', text: t('play.weight') }), weightEl]),
    ]),
    h('div', { className: 'scene-wrap' }, [progress.el, scene.el, toast]),
    h('p', { className: 'amount-label', text: t('play.amountLabel') }),
    h('div', { className: 'amounts' }, amountButtons),
    buyBtn,
    h('p', { className: 'price-note', text: t('common.priceNote', { price: formatYen(config.gold.pricePerGram) }) }),
  ]);

  render(false);

  return {
    el,
    unmount() {
      clearTimeout(toastTimer);
      scene.destroy();
    },
  };
};
