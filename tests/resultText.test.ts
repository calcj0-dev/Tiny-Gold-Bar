// T-03 結果の文：全部追い越したら allPassed に替わる
import { describe, expect, it } from 'vitest';
import { newGame, passedCount } from '../src/core/gold';
import { config, objects } from '../src/data';
import { summarize } from '../src/ui/resultText';

const gameAt = (spent: number) => ({ ...newGame(10_000_000), spent, taps: 1, passed: passedCount(spent, objects, config.gold) });

describe('T-03 結果の文', () => {
  it('1億円：金塊（5kg）は、まだ牛乳パックより小さい', () => {
    const s = summarize(gameAt(100_000_000));
    expect(s).toMatchObject({ spent: '1億円', weight: '5kg', next: '牛乳パック' });
    expect(s.line).toBe('金塊は、まだ牛乳パックより小さいです');
  });

  it('全部追い越したら「〇〇より大きくなりました」に替わる', () => {
    const s = summarize(gameAt(800_000_000_000));
    expect(s.next).toBeNull();
    expect(s.line).toBe('金塊は、浴槽より大きくなりました');
  });
});
