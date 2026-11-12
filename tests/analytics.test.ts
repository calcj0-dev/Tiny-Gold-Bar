// 計測：Vercel Analytics だけ。GA4 は読み込まない
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { initAnalytics } from '../src/analytics';

describe('計測', () => {
  it('開発中・テスト中は何も読み込まず、例外も出さない', () => {
    expect(() => initAnalytics()).not.toThrow();
  });

  it('GA4（gtag）を読み込むコードがない', () => {
    const src = readFileSync(new URL('../src/analytics.ts', import.meta.url), 'utf-8');
    expect(src).not.toMatch(/googletagmanager|gtag\(/);
  });
});
