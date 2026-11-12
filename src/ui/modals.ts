// 重ね表示：M2 計算の前提・M3 プライバシーについて（設計書 2章・1.5・5.5）

import { gaId, track } from '../analytics';
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

/** M2 計算の前提。from は計測の basis_open に使う（title／result） */
export function openBasis(from: 'title' | 'result'): void {
  track('basis_open', { from });
  const g = config.gold;
  const lines = [
    t('basis.price', { price: formatYen(g.pricePerGram) }),
    t('basis.density', { density: g.densityGPerCm3 }),
    t('basis.objects'),
    t('basis.allGold', { tonnes: formatNumberJa(config.allGold.tonnes), asOf: config.allGold.asOf, source: config.allGold.source }),
  ];
  open(t('basis.heading'), [h('ul', { className: 'modal-list' }, lines.map((s) => h('li', { text: s })))]);
}

/** M3 プライバシーについて。GA4 を使うときと使わないときで文言を替える（前作と同じ） */
export function openPrivacy(): void {
  const useGa = gaId() !== '';
  const keys: MessageKey[] = useGa
    ? ['privacy.ga.p1', 'privacy.ga.p2', 'privacy.ga.p3', 'privacy.ga.p4', 'privacy.ga.p5']
    : ['privacy.basic.p1', 'privacy.basic.p2', 'privacy.basic.p3', 'privacy.basic.p4'];
  const links = useGa
    ? [externalLink(t('privacy.googlePolicy'), config.links.googlePrivacy), externalLink(t('privacy.optout'), config.links.gaOptout)]
    : [externalLink(t('privacy.vercelPolicy'), config.links.vercelPrivacy)];
  open(t('privacy.heading'), [...keys.map((k) => h('p', { className: 'modal-p', text: t(k) })), ...links.map((a) => h('p', { className: 'modal-p' }, [a]))]);
}
