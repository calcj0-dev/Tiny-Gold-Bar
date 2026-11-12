// 結果の文（設計書 1.6・2章 S3）。結果画面・結果画像・投稿文で同じ判定を使う

import { grams, nextObject } from '../core/gold';
import { formatWeight, formatYen } from '../core/format';
import { config, objects } from '../data';
import type { Game } from '../core/gold';
import { t } from '../i18n';
import { objectName } from './scene';

export type ResultSummary = {
  spent: string;
  weight: string;
  /** 次の物（全部追い越したら null） */
  next: string | null;
  /** 最後の物（浴槽） */
  last: string;
  /** 「金塊は、まだ〇〇より小さいです」か「金塊は、〇〇より大きくなりました」 */
  line: string;
};

export function summarize(game: Game): ResultSummary {
  const next = nextObject(game.passed, objects);
  const last = objectName(objects[objects.length - 1]!);
  const nextName = next ? objectName(next) : null;
  return {
    spent: formatYen(game.spent),
    weight: formatWeight(grams(game.spent, config.gold)),
    next: nextName,
    last,
    line: nextName ? t('result.stillSmaller', { next: nextName }) : t('result.allPassed', { last }),
  };
}
