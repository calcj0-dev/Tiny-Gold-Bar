// S3 結果（設計書 2章）。笑いどころは「まだ〇〇より小さい」。シェアは作業 #6 で足す

import { sfx } from '../../audio';
import { allGold, sideCm } from '../../core/gold';
import { formatNumberJa, formatSize, formatYen } from '../../core/format';
import { config, objects } from '../../data';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, externalLink, h, linkButton } from '../dom';
import { openBasis, openPrivacy } from '../modals';
import { soundButton } from '../parts';
import { summarize } from '../resultText';
import { createScene } from '../scene';

export const resultScreen: ScreenFactory = (app) => {
  const g = session.game;
  const s = summarize(g);
  sfx.result();

  const scene = createScene();
  const all = allGold(config.allGold.tonnes, config.gold);

  const tameru = externalLink(t('links.tameruButton'), config.links.tameru);
  tameru.className = 'btn btn-link-out';
  const follow = externalLink(t('links.follow'), config.links.follow);

  const el = h('div', { className: 'screen result' }, [
    h('div', { className: 'top-bar' }, [h('h2', { className: 'result-heading', text: t('result.heading') }), h('span', { className: 'spacer' }), soundButton()]),

    h('p', { className: 'stat-label', text: t('result.spent') }),
    h('p', { className: 'result-spent', text: s.spent }),
    h('p', { className: 'result-weight' }, [
      h('span', { className: 'stat-label', text: t('result.weight') }),
      ' ',
      h('strong', { text: s.weight }),
    ]),
    h('p', { className: 'result-size', text: t('result.size', { size: formatSize(sideCm(g.spent, config.gold)) }) }),

    h('div', { className: 'scene-wrap result-scene' }, [scene.el]),
    h('p', { className: 'result-line', text: s.line }),
    h('p', { className: 'result-meta', text: t('result.passedCount', { n: g.passed, total: objects.length }) }),
    h('p', { className: 'result-meta', text: t('result.taps', { n: formatNumberJa(g.taps) }) }),

    h('section', { className: 'aside' }, [
      h('h3', { className: 'aside-heading', text: t('result.allGoldHeading') }),
      h('p', { text: t('result.allGold', { side: formatSize(all.sideCm), price: formatYen(config.gold.pricePerGram), yen: formatYen(all.yen) }) }),
    ]),

    h('div', { className: 'result-actions' }, [
      button(t('result.retry'), () => {
        session.reset();
        app.go('play');
      }, 'btn btn-primary'),
    ]),

    h('section', { className: 'promo' }, [
      h('h3', { className: 'promo-heading', text: t('links.heading') }),
      h('p', { text: t('links.tameru') }),
      tameru,
      h('p', { className: 'promo-follow' }, [follow]),
    ]),

    h('p', { className: 'price-note', text: t('common.priceNote', { price: formatYen(config.gold.pricePerGram) }) }),
    h('p', { className: 'footer-links' }, [linkButton(t('common.basisLink'), openBasis), linkButton(t('common.privacyLink'), openPrivacy)]),
  ]);

  // 絵は画面に置かれて大きさが決まってから描く（ResizeObserver が描く）
  scene.update(g.spent, g.passed, false);

  return { el, unmount: () => scene.destroy() };
};
