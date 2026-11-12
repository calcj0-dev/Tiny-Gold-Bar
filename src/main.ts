import './style.css';
import { initAnalytics } from './analytics';
import { unlockAudio } from './audio';
import { setLocale, t } from './i18n';
import { createApp } from './ui/app';
import { disclaimer } from './ui/parts';
import { playScreen } from './ui/screens/play';
import { resultScreen } from './ui/screens/result';
import { titleScreen } from './ui/screens/title';

setLocale('ja');
initAnalytics();
document.title = t('app.name');
// iOS では利用者が触ったときに音を鳴らせるようにする（設計書 5.6）
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const app = createApp(root, { title: titleScreen, play: playScreen, result: resultScreen }, disclaimer());
  app.go('title');

  // 開発用：?screen=play のように画面を直接開く（公開版では無視する）
  if (import.meta.env.DEV) {
    const screen = new URLSearchParams(location.search).get('screen');
    if (screen === 'play' || screen === 'result') app.go(screen);
  }
}
