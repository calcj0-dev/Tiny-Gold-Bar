// JSON のデータを読み込む窓口（設計書 4章）。
// 型は satisfies でビルド時に確かめる。値の検査（小さい順・重なりなど）は作業 #2 で足す

import type { Locale, Messages } from './i18n/types';
import configJson from './data/config.json';
import jaJson from './data/i18n/ja.json';
import objectsJson from './data/objects.json';

export type GameConfig = {
  version: number;
  gold: { pricePerGram: number; priceIsFictional: boolean; densityGPerCm3: number };
  amounts: number[];
  defaultAmount: number;
  allGold: { tonnes: number; asOf: string; source: string };
  view: { nextObjectHeightRatio: number; zoomMs: number };
  sounds: { buy: string; pass: string; result: string };
  hashtag: string;
  links: { tameru: string; follow: string };
};

export type CompareObject = { id: string; volumeCm3: number; shape: string; w: number; h: number };
export type ObjectsData = { version: number; note?: string; objects: CompareObject[] };

export const config = configJson satisfies GameConfig;
export const objectsData = objectsJson satisfies ObjectsData;

/** 言語ごとの文言。言語を足すときは JSON を作ってここに1行足す */
export const messagesByLocale = { ja: jaJson } satisfies Record<Locale, Messages>;

/** 作品のURL（環境変数 VITE_SITE_URL。設計書 5.1）。未設定なら今のページのURL */
export function siteUrl(): string {
  const v = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (v) return v;
  return typeof location === 'undefined' ? '' : location.origin + location.pathname;
}
