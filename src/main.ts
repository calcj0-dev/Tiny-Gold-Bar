// 作業 #1 の空ページ：作品名・バージョン・免責だけを出す。画面は作業 #3・#5 で作る
import './style.css';
import { initAnalytics } from './analytics';
import { unlockAudio } from './audio';
import { setLocale, t } from './i18n';
import { h } from './ui/dom';
import { APP_VERSION } from './version';

setLocale('ja');
initAnalytics();
document.title = t('app.name');
// iOS では利用者が触ったときに音を鳴らせるようにする（設計書 5.6）
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  root.replaceChildren(
    h('div', { className: 'screen' }, [
      h('div', { className: 'top-bar' }, [h('span', { className: 'version', text: t('app.version', { version: APP_VERSION }) })]),
      h('h1', { className: 'app-name', text: t('app.name') }),
      h('p', { className: 'tagline', text: t('app.tagline') }),
    ]),
    h('footer', { className: 'disclaimer', text: t('common.disclaimer') }),
  );
}
