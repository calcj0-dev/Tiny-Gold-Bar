// S2 プレイ（設計書 2章・1.4）。
// 「金を買う」は pointerdown で反応（連打の遅れをなくす。設計書 5.6）。
// 手ごたえの演出（UI 改善 A1〜A6）：「+100円」・金の粒・数字のカウントアップ・延べ棒風のボタン・追い越しのきらめき・振動

import { sfx } from '../../audio';
import { buy, grams, objectPrice, passedCount } from '../../core/gold';
import { formatApproxYen, formatNumberJa, formatWeight, formatYen } from '../../core/format';
import { config, objects } from '../../data';
import { vibrate } from '../../haptics';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { iconCanvas } from '../art';
import { button, h } from '../dom';
import { createCounter, spawnCoins, spawnPlus } from '../effects';
import { homeButton, soundButton } from '../parts';
import { createProgress } from '../progress';
import { createScene, objectName } from '../scene';

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
  const home = homeButton(() => app.go('title'));

  const spentEl = h('span', { className: 'stat-value' });
  const weightEl = h('span', { className: 'stat-value' });
  const progress = createProgress();
  const toastIcon = h('span', { className: 'toast-icon', attrs: { 'aria-hidden': 'true' } });
  const toastMain = h('p', { className: 'toast-main' });
  const toastSub = h('p', { className: 'toast-sub' });
  const toast = h('div', { className: 'toast', attrs: { role: 'status', 'aria-live': 'polite' } }, [
    toastIcon,
    h('div', {}, [toastMain, toastSub]),
  ]);

  // 物の名前は並びの下に大きく出すので、絵の下には書かない
  // 床にものさし、金塊に「一辺〇cm」の札（UI 改善 ★1・★2）
  const scene = createScene({ label: false, ruler: true, sizeTag: true });

  const amountButtons = config.amounts.map((a, i) => {
    const b = button('', () => {
      session.game = { ...session.game, amount: a };
      render(false);
    }, 'amount-btn');
    // 金額が大きいほど、金の延べ棒の印が増える（1〜3本）
    const bars = h('span', { className: 'amount-bars', attrs: { 'aria-hidden': 'true' } });
    for (let k = 0; k < Math.ceil(((i + 1) / config.amounts.length) * 3); k++) bars.append(h('i'));
    b.append(bars, h('span', { text: formatYen(a) }));
    b.dataset.amount = String(a);
    return b;
  });

  const buyBtn = h('button', { className: 'buy-btn', attrs: { type: 'button' } }, [h('span', { className: 'buy-label', text: t('play.buy') })]);
  const buyWrap = h('div', { className: 'buy-wrap' }, [buyBtn]);
  // 金の粒を飛ばす、画面いっぱいの重ね
  const fxLayer = h('div', { className: 'fx-layer', attrs: { 'aria-hidden': 'true' } });

  // 指・マウスは押した瞬間に買う。キーボード（Enter・Space）は click で買う
  buyBtn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onBuy();
  });
  buyBtn.addEventListener('click', (e) => {
    if (e.detail === 0) onBuy();
  });

  // A3：使ったお金・重さは少しカウントアップして見せる
  const counter = createCounter((v) => {
    const spent = Math.round(v);
    spentEl.textContent = formatYen(spent);
    weightEl.textContent = t('play.weightValue', {
      weight: formatWeight(grams(spent, config.gold)),
      taps: t('play.taps', { n: formatNumberJa(session.game.taps) }),
    });
  });

  let toastTimer = 0;

  function onBuy() {
    const amount = session.game.amount;
    const level = config.amounts.indexOf(amount);
    const r = buy(session.game, objects, config.gold);
    session.game = r.game;
    spawnPlus(buyWrap, t('play.plus', { amount: formatYen(amount) }));
    const to = scene.goldPoint();
    if (to) spawnCoins(fxLayer, buyBtn.getBoundingClientRect(), to, 1 + level);
    if (r.newlyPassed) {
      // 2つ以上追い越しても、一言と音は1回（一番大きい物）
      showToast(r.newlyPassed);
      sfx.pass();
      scene.burst();
      vibrate([12, 40, 24]);
    } else {
      sfx.buy(level, config.amounts.length);
      vibrate(8);
    }
    render(true);
  }

  function showToast(o: (typeof objects)[number]) {
    const name = objectName(o);
    toastIcon.replaceChildren(iconCanvas(o, 40, 3, 1.2));
    toastMain.textContent = t('play.pass', { name });
    toastSub.textContent = t('play.passSub', { name, price: formatApproxYen(objectPrice(o, config.gold)) });
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), TOAST_MS);
  }

  function render(animate: boolean) {
    const g = session.game;
    counter.set(g.spent, animate);
    progress.update(g.passed);
    toResult.disabled = g.taps === 0;
    for (const b of amountButtons) {
      const on = Number(b.dataset.amount) === g.amount;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    }
    scene.update(g.spent, g.passed, animate);
  }

  const el = h('div', { className: 'screen play' }, [
    h('div', { className: 'top-bar' }, [home, toResult, h('span', { className: 'spacer' }), soundButton()]),
    h('div', { className: 'stats card' }, [
      h('div', { className: 'stat' }, [h('span', { className: 'stat-label', text: t('play.spent') }), spentEl]),
      h('div', { className: 'stat' }, [h('span', { className: 'stat-label', text: t('play.weight') }), weightEl]),
    ]),
    h('div', { className: 'scene-wrap' }, [progress.el, scene.el, toast]),
    h('p', { className: 'amount-label', text: t('play.amountLabel') }),
    h('div', { className: 'amounts' }, amountButtons),
    buyWrap,
    h('p', { className: 'price-note', text: t('common.priceNote', { price: formatYen(config.gold.pricePerGram) }) }),
    fxLayer,
  ]);

  render(false);

  return {
    el,
    unmount() {
      clearTimeout(toastTimer);
      counter.stop();
      scene.destroy();
    },
  };
};
