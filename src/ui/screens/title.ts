// S1 タイトル（設計書 2章）：作品名、一言、「はじめる」、右上にバージョンと音、
// 「計算の前提」「プライバシーについて」、クレジット。免責は全画面の下の帯。
// UI 改善 C（オーナー 2026-11-18）：牛乳パックと金塊の絵（C1）、遊び方の一言（C2）

import { config } from '../../data';
import { t } from '../../i18n';
import { session } from '../../session';
import { APP_VERSION } from '../../version';
import type { ScreenFactory } from '../app';
import { button, externalLink, h, linkButton } from '../dom';
import { openBasis, openPrivacy } from '../modals';
import { soundButton } from '../parts';
import { createTitleArt } from '../titleArt';

export const titleScreen: ScreenFactory = (app) => {
  const art = createTitleArt();
  const el = h('div', { className: 'screen title' }, [
    h('div', { className: 'top-bar' }, [
      h('span', { className: 'spacer' }),
      h('span', { className: 'version', text: t('app.version', { version: APP_VERSION }) }),
      soundButton(),
    ]),
    h('div', { className: 'title-hero' }, [
      h('div', { className: 'title-art-wrap' }, [art.el]),
      h('h1', { className: 'app-name', text: t('app.name') }),
      h('p', { className: 'tagline', text: t('app.tagline') }),
    ]),
    button(t('title.start'), () => {
      session.reset();
      app.go('play');
    }, 'btn btn-primary start-btn'),
    h('p', { className: 'howto', text: t('title.howto') }),
    h('span', { className: 'spacer' }),
    h('p', { className: 'footer-links' }, [linkButton(t('common.basisLink'), openBasis), linkButton(t('common.privacyLink'), openPrivacy)]),
    // つくった人は X のプロフィールへのリンク（オーナー要望 2026-11-13）
    h('p', { className: 'credit' }, [externalLink(t('app.credit'), config.links.follow)]),
  ]);
  return { el, unmount: () => art.destroy() };
};
