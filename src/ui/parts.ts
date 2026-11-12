// 画面をまたいで使う部品

import { t } from '../i18n';
import { onSettingsChange, settings } from '../settings';
import { h } from './dom';

/** 免責の帯（全画面の下。設計書 1.5） */
export function disclaimer(): HTMLElement {
  return h('footer', { className: 'disclaimer', text: t('common.disclaimer') });
}

/** 右上の音のボタン（設計書 1.4）。押すたびにオン・オフ。設定は端末に保存 */
export function soundButton(): HTMLButtonElement {
  const b = h('button', { className: 'btn btn-small sound-btn', attrs: { type: 'button' } });
  const sync = () => {
    b.textContent = settings.sound ? t('common.soundOn') : t('common.soundOff');
    b.setAttribute('aria-pressed', String(settings.sound));
  };
  b.addEventListener('click', () => {
    settings.sound = !settings.sound;
  });
  const off = onSettingsChange(sync);
  // 画面から外れたら購読をやめる
  new MutationObserver((_, obs) => {
    if (!b.isConnected) {
      off();
      obs.disconnect();
    }
  }).observe(document.body, { childList: true, subtree: true });
  sync();
  return b;
}
