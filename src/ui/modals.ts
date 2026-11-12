// 重ね表示：M2 計算の前提・M3 プライバシーについて（設計書 2章・1.5・5.5）

import { formatNumberJa, formatYen } from '../core/format';
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

/** M3 プライバシーについて（U4。計測は Vercel Analytics だけ） */
export function openPrivacy(): void {
  const keys: MessageKey[] = ['privacy.p1', 'privacy.p2', 'privacy.p3', 'privacy.p4'];
  open(t('privacy.heading'), [
    ...keys.map((k) => h('p', { className: 'modal-p', text: t(k) })),
    h('p', { className: 'modal-p' }, [externalLink(t('privacy.vercelPolicy'), config.links.vercelPrivacy)]),
  ]);
}
