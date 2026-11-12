// S3 結果（仮）。使ったお金と「もう一回」だけ。中身は作業 #5 で作る

import { track } from '../../analytics';
import { sfx } from '../../audio';
import { formatYen } from '../../core/format';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';
import { soundButton } from '../parts';

export const resultScreen: ScreenFactory = (app) => {
  sfx.result();
  const el = h('div', { className: 'screen result' }, [
    h('div', { className: 'top-bar' }, [h('h2', { className: 'result-heading', text: t('result.heading') }), h('span', { className: 'spacer' }), soundButton()]),
    h('p', { className: 'stat-label', text: t('result.spent') }),
    h('p', { className: 'result-spent', text: formatYen(session.game.spent) }),
    button(t('result.retry'), () => {
      track('retry', {});
      session.reset('retry');
      app.go('play');
    }, 'btn btn-primary'),
  ]);
  return { el };
};
