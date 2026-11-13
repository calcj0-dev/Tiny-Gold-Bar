// S1 タイトル（設計書 2章）：作品名、一言、「はじめる」、右上にバージョンと音、
// 「計算の前提」「プライバシーについて」、クレジット。免責は全画面の下の帯

import { session } from '../../session';
import { t } from '../../i18n';
import { APP_VERSION } from '../../version';
import type { ScreenFactory } from '../app';
import { config } from '../../data';
import { button, externalLink, h, linkButton } from '../dom';
import { openBasis, openPrivacy } from '../modals';
import { soundButton } from '../parts';

export const titleScreen: ScreenFactory = (app) => {
  const el = h('div', { className: 'screen title' }, [
    h('div', { className: 'top-bar' }, [
      h('span', { className: 'spacer' }),
      h('span', { className: 'version', text: t('app.version', { version: APP_VERSION }) }),
      soundButton(),
    ]),
    h('div', { className: 'title-hero' }, [
      h('h1', { className: 'app-name', text: t('app.name') }),
      h('p', { className: 'tagline', text: t('app.tagline') }),
    ]),
    button(t('title.start'), () => {
      session.reset();
      app.go('play');
    }, 'btn btn-primary start-btn'),
    h('span', { className: 'spacer' }),
    h('p', { className: 'footer-links' }, [linkButton(t('common.basisLink'), openBasis), linkButton(t('common.privacyLink'), openPrivacy)]),
    // つくった人は X のプロフィールへのリンク（オーナー要望 2026-11-13）
    h('p', { className: 'credit' }, [externalLink(t('app.credit'), config.links.follow)]),
  ]);
  return { el };
};
