// 文言のキーの型。日本語の JSON の形を基準にし、ほかの言語も同じ形を持つ（足りなければビルドエラー）

import type jaJson from '../data/i18n/ja.json';

export type Messages = typeof jaJson;

/** 入れ子の JSON を "play.buy" のような点区切りのキーにした型 */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends object ? Leaves<T[K], `${P}${K}.`> : never;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

export type Locale = 'ja';
