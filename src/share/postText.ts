// 投稿文（設計書 1.6）。文面は i18n の share.* に置き、ここでは差し込む値を決めるだけ

import { config } from '../data';
import type { Game } from '../core/gold';
import { t } from '../i18n';
import { summarize } from '../ui/resultText';

/** 投稿文（URL は含めない。X の投稿画面・Web Share には URL を別に渡す） */
export function postText(game: Game): string {
  const s = summarize(game);
  const vars = { spent: s.spent, weight: s.weight, hashtag: config.hashtag };
  return s.next ? t('share.textStill', { ...vars, next: s.next }) : t('share.textAll', { ...vars, last: s.last });
}

/** X の文字数の数え方：URL は23、下の範囲の文字は1、それ以外（日本語など）は2。上限280 */
export const X_LIMIT = 280;
const X_URL_WEIGHT = 23;
const LIGHT_RANGES: [number, number][] = [
  [0, 4351],
  [8192, 8205],
  [8208, 8223],
  [8242, 8247],
];

export function xLength(text: string, withUrl = true): number {
  let n = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    n += LIGHT_RANGES.some(([a, b]) => code >= a && code <= b) ? 1 : 2;
  }
  // 本文と URL の間の空白1つ＋URL
  return withUrl ? n + 1 + X_URL_WEIGHT : n;
}
