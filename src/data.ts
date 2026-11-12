// JSON のデータを読み込み、検査して渡す窓口（設計書 4章）。
// 型は satisfies でビルド時に、値（小さい順・重なりなど）は読み込み時に検査する。
// 間違いがあれば例外を出し、テストとビルドで止める（T-06）

import type { Locale, Messages } from './i18n/types';
import configJson from './data/config.json';
import jaJson from './data/i18n/ja.json';
import objectsJson from './data/objects.json';

export const SHAPES = ['ellipse', 'circle', 'rect', 'roundRect', 'trapezoid'] as const;
export type Shape = (typeof SHAPES)[number];

export type GameConfig = {
  version: number;
  gold: { pricePerGram: number; priceIsFictional: boolean; densityGPerCm3: number };
  amounts: number[];
  defaultAmount: number;
  allGold: { tonnes: number; asOf: string; source: string };
  view: { nextObjectHeightRatio: number; zoomMs: number };
  sounds: { buy: string; pass: string; result: string };
  hashtag: string;
  links: { tameru: string; follow: string; googlePrivacy: string; gaOptout: string; vercelPrivacy: string };
};

export type CompareObject = { id: string; volumeCm3: number; shape: Shape; w: number; h: number };
export type ObjectsData = { version: number; note?: string; objects: { id: string; volumeCm3: number; shape: string; w: number; h: number }[] };

/** 入れ子の文言の JSON から、点区切りのキーを全部取り出す */
function leafKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix.slice(0, -1)];
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : leafKeys(v, `${prefix}${k}.`)));
}

const isPositive = (x: unknown): boolean => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** データの検査。間違いの一覧を返す（空なら正しい） */
export function validateData(cfg: GameConfig, objs: ObjectsData, locales: Record<string, unknown>): string[] {
  const errors: string[] = [];

  // 金額の段階：正の整数で小さい順。最初の金額は段階の中にある
  if (cfg.amounts.length === 0) errors.push('amounts is empty');
  cfg.amounts.forEach((a, i) => {
    if (!Number.isInteger(a) || a <= 0) errors.push(`amounts[${i}] must be a positive integer`);
    const prev = cfg.amounts[i - 1];
    if (prev !== undefined && a <= prev) errors.push(`amounts[${i}] must be larger than amounts[${i - 1}]`);
  });
  if (!cfg.amounts.includes(cfg.defaultAmount)) errors.push('defaultAmount must be one of amounts');

  // 値段・密度・人類の金の量は正
  if (!isPositive(cfg.gold.pricePerGram)) errors.push('gold.pricePerGram must be positive');
  if (!isPositive(cfg.gold.densityGPerCm3)) errors.push('gold.densityGPerCm3 must be positive');
  if (!isPositive(cfg.allGold.tonnes)) errors.push('allGold.tonnes must be positive');
  if (!isPositive(cfg.view.nextObjectHeightRatio) || cfg.view.nextObjectHeightRatio > 1) errors.push('view.nextObjectHeightRatio must be in (0, 1]');
  if (!(cfg.view.zoomMs >= 0)) errors.push('view.zoomMs must be >= 0');

  // 比べる物：id が重ならない、体積が正で小さい順、形が決まった5つのどれか、w・h が正
  const ids = new Set<string>();
  if (objs.objects.length === 0) errors.push('objects is empty');
  objs.objects.forEach((o, i) => {
    if (ids.has(o.id)) errors.push(`objects[${i}].id "${o.id}" is duplicated`);
    ids.add(o.id);
    if (!isPositive(o.volumeCm3)) errors.push(`objects[${i}].volumeCm3 must be positive`);
    const prev = objs.objects[i - 1];
    if (prev && o.volumeCm3 <= prev.volumeCm3) errors.push(`objects[${i}].volumeCm3 must be larger than objects[${i - 1}]`);
    if (!(SHAPES as readonly string[]).includes(o.shape)) errors.push(`objects[${i}].shape "${o.shape}" is unknown`);
    if (!isPositive(o.w) || !isPositive(o.h)) errors.push(`objects[${i}].w and h must be positive`);
  });

  // 文言：全言語が日本語と同じキーを持ち、全部の物の名前がある
  const baseKeys = leafKeys(locales.ja);
  for (const [lang, msgs] of Object.entries(locales)) {
    const keys = new Set(leafKeys(msgs));
    for (const k of baseKeys) if (!keys.has(k)) errors.push(`i18n/${lang}: missing "${k}"`);
    for (const id of ids) if (!keys.has(`objects.${id}`)) errors.push(`i18n/${lang}: missing name "objects.${id}"`);
  }

  // リンクは https://
  for (const [k, url] of Object.entries(cfg.links)) if (!url.startsWith('https://')) errors.push(`links.${k} must start with https://`);

  return errors;
}

/** 言語ごとの文言。言語を足すときは JSON を作ってここに1行足す */
export const messagesByLocale = { ja: jaJson } satisfies Record<Locale, Messages>;

const rawConfig = configJson satisfies GameConfig;
const rawObjects = objectsJson satisfies ObjectsData;

const errors = validateData(rawConfig, rawObjects, messagesByLocale);
if (errors.length > 0) throw new Error(`Invalid game data:\n- ${errors.join('\n- ')}`);

export const config: GameConfig = rawConfig;
/** 比べる物（体積の小さい順。検査済み） */
export const objects: readonly CompareObject[] = rawObjects.objects as CompareObject[];

/** 作品のURL（環境変数 VITE_SITE_URL。設計書 5.1）。未設定なら今のページのURL */
export function siteUrl(): string {
  const v = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (v) return v;
  return typeof location === 'undefined' ? '' : location.origin + location.pathname;
}
