// 重ね表示：M2 計算の前提・M3 プライバシーについて（設計書 2章・1.5・5.5）

import { formatNumberJa, formatYen } from '../core/format';
import type { Game } from '../core/gold';
import { postText } from '../share/postText';
import { renderResultImage } from '../share/resultImage';
import { canShareImage, saveImage, shareWithImage, toDataUrl } from '../share/share';
import { config } from '../data';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/types';
import { button, externalLink, h } from './dom';

let dialog: HTMLDialogElement | null = null;

function open(heading: string, body: HTMLElement[]): void {
  if (!dialog) {
    const created = document.createElement('dialog');
    created.className = 'modal';
    // 外側（背景）を押したら閉じる
    created.addEventListener('click', (e) => {
      if (e.target === created) created.close();
    });
    document.body.append(created);
    dialog = created;
  }
  const d = dialog;
  d.replaceChildren(
    h('div', { className: 'modal-inner' }, [
      h('h2', { className: 'modal-heading', text: heading }),
      ...body,
      button(t('common.close'), () => d.close(), 'btn modal-close'),
    ]),
  );
  if (!d.open) d.showModal();
}

/** M2 計算の前提 */
export function openBasis(): void {
  const g = config.gold;
  const lines = [
    t('basis.price', { price: formatYen(g.pricePerGram) }),
    t('basis.density', { density: g.densityGPerCm3 }),
    t('basis.objects'),
    t('basis.allGold', { tonnes: formatNumberJa(config.allGold.tonnes), asOf: config.allGold.asOf, source: config.allGold.source }),
  ];
  open(t('basis.heading'), [h('ul', { className: 'modal-list' }, lines.map((s) => h('li', { text: s })))]);
}

/**
 * M1 結果画像のプレビュー（設計書 2章）：画像、「画像を付けてシェア」（Web Share が使える端末だけ）、「画像を保存」。
 * 画像は描き終わってから出す
 */
export function openImagePreview(game: Game): void {
  const img = h('img', { className: 'image-preview', attrs: { alt: t('image.alt'), width: '1200', height: '630' } });
  let blob: Blob | null = null;
  const text = postText(game);
  const shareBtn = button(t('result.shareImage'), () => {
    if (blob) void shareWithImage(text, blob);
  }, 'btn btn-primary');
  const saveBtn = button(t('result.saveImage'), () => {
    if (blob) void saveImage(blob);
  });
  shareBtn.hidden = true;
  saveBtn.disabled = true;
  open(t('image.previewHeading'), [img, shareBtn, saveBtn, h('p', { className: 'modal-note', text: t('image.longPress') })]);
  void renderResultImage(game).then(async (b) => {
    blob = b;
    if (!b) return;
    shareBtn.hidden = !(matchMedia('(pointer: coarse)').matches && canShareImage(b));
    saveBtn.disabled = false;
    img.src = await toDataUrl(b);
  });
}

/** M3 プライバシーについて（U4。計測は Vercel Analytics だけ） */
export function openPrivacy(): void {
  const keys: MessageKey[] = ['privacy.p1', 'privacy.p2', 'privacy.p3', 'privacy.p4'];
  open(t('privacy.heading'), [
    ...keys.map((k) => h('p', { className: 'modal-p', text: t(k) })),
    h('p', { className: 'modal-p' }, [externalLink(t('privacy.vercelPolicy'), config.links.vercelPrivacy)]),
  ]);
}
