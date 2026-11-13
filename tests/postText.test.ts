// T-07 投稿文：12個それぞれ＋全部追い越したあと、長い金額でも X の上限（280）以内
import { describe, expect, it } from 'vitest';
import { newGame, objectPrice, passedCount } from '../src/core/gold';
import { config, objects } from '../src/data';
import { postText, X_LIMIT, xLength } from '../src/share/postText';
import { xIntentUrl } from '../src/share/share';

const gameAt = (spent: number) => ({ ...newGame(10_000_000), spent, taps: 1, passed: passedCount(spent, objects, config.gold) });

describe('T-07 投稿文', () => {
  it('1億円：設計書 1.6 の例のとおり', () => {
    expect(postText(gameAt(100_000_000))).toBe('1億円で金を買ったら、金塊（5kg）はまだ牛乳パックより小さかった #金塊ちっさ');
  });

  it('浴槽を追い越したあと：設計書 1.6 の例のとおり', () => {
    expect(postText(gameAt(800_000_000_000))).toBe('8,000億円で金を買ったら、金塊（40t）は浴槽より大きくなった #金塊ちっさ');
  });

  // 円の整数を正確に持てるのは約9,007兆円まで（Number.MAX_SAFE_INTEGER）。1,000万円で約9億回押す額なので、それ以上は考えない
  it('12個それぞれの手前・全部追い越したあと・長い金額（8,999兆9,999億9,999万9,900円）でも280以内', () => {
    const spents = [100, ...objects.map((o) => Math.floor(objectPrice(o, config.gold)) - 100), 800_000_000_000, 8_999_999_999_999_900];
    for (const spent of spents) {
      const text = postText(gameAt(spent));
      expect(xLength(text), text).toBeLessThanOrEqual(X_LIMIT);
    }
  });

  it('X の投稿画面の URL に投稿文と作品の URL が入る', () => {
    const url = xIntentUrl('a b #金塊ちっさ');
    expect(url.startsWith('https://x.com/intent/post?text=a%20b%20%23')).toBe(true);
    expect(url).toContain('&url=');
  });
});
