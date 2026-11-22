// 画面をまたいで使う部品

import { t } from '../i18n';
import { onSettingsChange, settings } from '../settings';
import { h } from './dom';

/** 免責の帯（全画面の下。設計書 1.5） */
export function disclaimer(): HTMLElement {
  return h('footer', { className: 'disclaimer', text: t('common.disclaimer') });
}

/** 左上の「ホーム」ボタン（オーナー要望 2026-11-13：各画面にホームへ戻るボタン）。タイトル画面へ戻る */
export function homeButton(onClick: () => void): HTMLButtonElement {
  const b = h('button', { className: 'btn btn-small home-btn', attrs: { type: 'button' }, on: { click: onClick } });
  // 家の絵（線だけの簡単なもの）
  b.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>';
  b.append(h('span', { text: t('common.home') }));
  return b;
}

/** スピーカーの絵（音あり：音の波、音なし：×） */
const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/>';
const WAVES = '<path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>';
const MUTED = '<path d="M17 9l5 6"/><path d="M22 9l-5 6"/>';

/** 右上の音のボタン（設計書 1.4）。押すたびにオン・オフ。設定は端末に保存。
 *  文字ではなくスピーカーの絵で出す（UI 改善 ★10。読み上げ用に「音あり／音なし」を付ける） */
export function soundButton(): HTMLButtonElement {
  const b = h('button', { className: 'btn btn-small sound-btn', attrs: { type: 'button' } });
  const sync = () => {
    const label = settings.sound ? t('common.soundOn') : t('common.soundOff');
    b.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SPEAKER}${settings.sound ? WAVES : MUTED}</svg>`;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.setAttribute('aria-pressed', String(settings.sound));
    b.classList.toggle('muted', !settings.sound);
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
