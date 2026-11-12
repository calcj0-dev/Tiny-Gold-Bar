// 計測（設計書 5.4）。ページの表示は Vercel Analytics、イベントは GA4。
// 失敗しても例外を出さない（広告ブロックなどで読み込めなくても遊べるように）。
// タップごとのイベントは送らない

import { inject } from '@vercel/analytics';
import { getLocale } from './i18n';

export type SpentBand = '1man' | '100man' | '1oku' | '100oku' | 'more';

export type AnalyticsEvent =
  | { name: 'start'; props: { from: 'title' | 'retry' } }
  | { name: 'finish'; props: { passed: number; spent_band: SpentBand; max_amount: number } }
  | { name: 'share_click'; props: { method: 'x_intent' | 'web_share' | 'save_image' } }
  | { name: 'main_app_click'; props: { target: 'tameru' | 'follow' } }
  | { name: 'retry'; props: Record<string, never> }
  | { name: 'basis_open'; props: { from: string } };

type Gtag = (...args: unknown[]) => void;
type GtagWindow = { dataLayer?: unknown[]; gtag?: Gtag };

/** GA4 の測定ID（環境変数 VITE_GA_ID）。空なら GA4 は読み込まない */
export function gaId(): string {
  return ((import.meta.env.VITE_GA_ID as string | undefined) ?? '').trim();
}

/** 起動時に1回呼ぶ */
export function initAnalytics(): void {
  try {
    // Vercel Analytics（ページの表示）。公開版だけ
    if (import.meta.env.PROD) inject({ mode: 'production', framework: 'vanilla' });
  } catch {
    // 読み込めなくても遊べる
  }
  const id = gaId();
  if (!id) return;
  try {
    const w = window as unknown as GtagWindow;
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() {
      // gtag.js は arguments をそのまま受け取る決まり
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', id);
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(s);
  } catch {
    // 読み込めなくても遊べる
  }
}

/** イベントを送る。全イベントに lang を付ける */
export function track<N extends AnalyticsEvent['name']>(name: N, props: Extract<AnalyticsEvent, { name: N }>['props']): void {
  try {
    const gtag = (window as unknown as GtagWindow).gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', name, { ...props, lang: getLocale() });
  } catch {
    // 計測の失敗で遊びを止めない
  }
}

/** 使ったお金の区分（〜1万／〜100万／〜1億／〜100億／それ以上） */
export function spentBand(yen: number): SpentBand {
  if (yen <= 10_000) return '1man';
  if (yen <= 1_000_000) return '100man';
  if (yen <= 100_000_000) return '1oku';
  if (yen <= 10_000_000_000) return '100oku';
  return 'more';
}
