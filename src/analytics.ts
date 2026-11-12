// 計測。ページの表示を Vercel Analytics で数えるだけ（GA4 は使わない。オーナー決定 2026-11-12）。
// 失敗しても例外を出さない（広告ブロックなどで読み込めなくても遊べるように）

import { inject } from '@vercel/analytics';

/** 起動時に1回呼ぶ。公開版だけ読み込む */
export function initAnalytics(): void {
  try {
    if (import.meta.env.PROD) inject({ mode: 'production', framework: 'vanilla' });
  } catch {
    // 読み込めなくても遊べる
  }
}
