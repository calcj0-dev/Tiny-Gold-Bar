// 表示の形（設計書 3.2）。単位の文字（円・万・億・兆・約）は文言の format から取る。
// g・kg・t・mm・cm・m は言語によらない記号なのでここで持つ

import { t } from '../i18n';

const MAN = 1e4;
const OKU = 1e8;
const CHO = 1e12;

/** 有効数字 n けたに丸める */
function sig(x: number, n: number): number {
  return Number(x.toPrecision(n));
}

/** 整数部を3けたごとのカンマで区切る。末尾の0は String() で消える */
function num(x: number): string {
  const [int = '0', frac] = String(x).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
}

/** 兆・億・万で区切り、それぞれの中はカンマ。0の区切りは省く（円は付けない）。例：22万4,200 */
export function formatNumberJa(n: number): string {
  const v = Math.round(n);
  const parts: [number, string][] = [
    [Math.floor(v / CHO), t('format.cho')],
    [Math.floor((v % CHO) / OKU), t('format.oku')],
    [Math.floor((v % OKU) / MAN), t('format.man')],
    [v % MAN, ''],
  ];
  const s = parts.map(([x, unit]) => (x > 0 ? num(x) + unit : '')).join('');
  return s || '0';
}

/** 金額。例：100円、1万2,300円、1億2,000万円、4,484兆円 */
export function formatYen(yen: number): string {
  return t('format.yen', { n: formatNumberJa(yen) });
}

/** 物の値段（追い越したときの一言）：「約」＋有効数字2けた。例：約1,200円、約3,900万円、約3.9億円 */
export function formatApproxYen(yen: number): string {
  const r = sig(yen, 2);
  let body: string;
  if (r < MAN) body = num(r);
  else {
    const [unit, label] = r >= CHO ? [CHO, t('format.cho')] : r >= OKU ? [OKU, t('format.oku')] : [MAN, t('format.man')];
    body = num(sig(r / unit, 2)) + label;
  }
  return t('format.approx', { n: t('format.yen', { n: body }) });
}

/** 重さ。1g未満：有効数字2けた（g）／1g〜1kg未満：3けた（g）／1kg〜1t未満：3けた（kg）／1t以上：3けた（t） */
export function formatWeight(g: number): string {
  if (g <= 0) return '0g';
  if (g < 1) {
    const r = sig(g, 2);
    if (r < 1) return `${num(r)}g`;
  }
  const v = sig(g, 3);
  if (v < 1e3) return `${num(v)}g`;
  if (v < 1e6) return `${num(sig(v / 1e3, 3))}kg`;
  return `${num(sig(g / 1e6, 3))}t`;
}

/** 大きさ（一辺）。1cm未満：mm（有効数字2けた）／1m未満：cm（3けた）／それ以上：m（3けた） */
export function formatSize(cm: number): string {
  if (cm <= 0) return '0mm';
  if (cm < 1) {
    const mm = sig(cm * 10, 2);
    if (mm < 10) return `${num(mm)}mm`;
  }
  const v = sig(cm, 3);
  if (v < 100) return `${num(v)}cm`;
  return `${num(sig(cm / 100, 3))}m`;
}
