// 計測（設計書 5.4）
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gaId, initAnalytics, spentBand, track } from '../src/analytics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('計測', () => {
  it('全イベントに lang を付けて GA4 に送る', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    track('finish', { passed: 8, spent_band: '1oku', max_amount: 10_000_000 });
    expect(gtag).toHaveBeenCalledWith('event', 'finish', { passed: 8, spent_band: '1oku', max_amount: 10_000_000, lang: 'ja' });
  });

  it('GA4 を読み込めていない・失敗しても例外を出さない', () => {
    vi.stubGlobal('window', {});
    expect(() => track('retry', {})).not.toThrow();
    vi.stubGlobal('window', {
      gtag: () => {
        throw new Error('blocked');
      },
    });
    expect(() => track('main_app_click', { target: 'tameru' })).not.toThrow();
  });

  it('VITE_GA_ID が空なら GA4 は読み込まない', () => {
    expect(gaId()).toBe('');
    const append = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { head: { append }, createElement: () => ({}) });
    initAnalytics();
    expect(append).not.toHaveBeenCalled();
  });

  it('使ったお金の区分は 〜1万／〜100万／〜1億／〜100億／それ以上', () => {
    const yen = [100, 10_000, 10_100, 1_000_000, 100_000_000, 100_000_100, 10_000_000_000, 10_010_000_000];
    expect(yen.map(spentBand)).toEqual(['1man', '1man', '100man', '100man', '1oku', '100oku', '100oku', 'more']);
  });
});
