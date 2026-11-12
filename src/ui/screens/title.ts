// S1 タイトル（仮）。作品名・一言・「はじめる」・バージョン・音だけ。
// 計算の前提・プライバシー・クレジットは作業 #5 で足す

import { session } from '../../session';
import { t } from '../../i18n';
import { APP_VERSION } from '../../version';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';
import { soundButton } from '../parts';

export const titleScreen: ScreenFactory = (app) => {
  const el = h('div', { className: 'screen title' }, [
    h('div', { className: 'top-bar' }, [
      h('span', { className: 'spacer' }),
      h('span', { className: 'version', text: t('app.version', { version: APP_VERSION }) }),
      soundButton(),
    ]),
    h('h1', { className: 'app-name', text: t('app.name') }),
    h('p', { className: 'tagline', text: t('app.tagline') }),
    button(t('title.start'), () => {
      session.reset('title');
      app.go('play');
    }, 'btn btn-primary start-btn'),
  ]);
  return { el };
};
