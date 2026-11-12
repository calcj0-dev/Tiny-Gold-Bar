// 計算（設計書 3.1）：T-01・T-02・T-03・T-05
import { describe, expect, it } from 'vitest';
import { allGold, buy, grams, newGame, nextObject, objectGrams, objectPrice, passedCount, sideCm } from '../src/core/gold';
import { formatApproxYen, formatSize, formatWeight, formatYen } from '../src/core/format';
import { config, objects } from '../src/data';

const p = config.gold;
const OKU = 100_000_000;

describe('T-01 計算', () => {
  it('1億円 → 5kg・一辺6.37cm', () => {
    expect(grams(OKU, p)).toBe(5000);
    expect(formatWeight(grams(OKU, p))).toBe('5kg');
    expect(formatSize(sideCm(OKU, p))).toBe('6.37cm');
  });

  it('100円 → 0.005g', () => {
    expect(formatWeight(grams(100, p))).toBe('0.005g');
  });

  it('文庫本を追い越すのは9,119万400円以上（236cm³×19.32×2万円）', () => {
    const book = objects.findIndex((o) => o.id === 'book');
    expect(passedCount(91_190_400, objects, p)).toBe(book + 1);
    expect(passedCount(91_190_399, objects, p)).toBe(book);
  });

  it('設計書 1.3 の表：同じ大きさの金の重さと値段', () => {
    const rows = objects.map((o) => [o.id, formatWeight(objectGrams(o, p)), formatApproxYen(objectPrice(o, p))]);
    expect(rows).toEqual([
      ['sesame', '0.058g', '約1,200円'],
      ['rice', '0.48g', '約9,700円'],
      ['coin1', '7.15g', '約14万円'],
      ['dice', '79.2g', '約160万円'],
      ['battery', '160g', '約320万円'],
      ['egg', '1.06kg', '約2,100万円'],
      ['phone', '1.93kg', '約3,900万円'],
      ['book', '4.56kg', '約9,100万円'],
      ['milk', '19.3kg', '約3.9億円'],
      ['bottle2l', '38.6kg', '約7.7億円'],
      ['bucket', '193kg', '約39億円'],
      ['bathtub', '3.86t', '約770億円'],
    ]);
  });

  it('設計書 1.3 の表：1,000万円で何回押すと追い越すか', () => {
    const taps = objects.map((o) => Math.ceil(objectPrice(o, p) / 10_000_000 - 1e-9));
    expect(taps).toEqual([1, 1, 1, 1, 1, 3, 4, 10, 39, 78, 387, 7728]);
    expect(Math.ceil(objectPrice(objects[0]!, p) / 100)).toBe(12);
  });
});

describe('T-02 追い越し', () => {
  it('体積がちょうど同じで追い越し扱い', () => {
    for (const o of objects) {
      // 物と同じ体積になる金額（円の整数にならない物は切り上げ）
      const yen = Math.ceil(objectPrice(o, p) - 1e-6);
      expect(passedCount(yen, objects, p)).toBe(objects.indexOf(o) + 1);
    }
  });

  it('1回で2つ以上追い越したとき、数が正しく、一言は一番大きい物', () => {
    const g = { ...newGame(10_000_000) };
    const r = buy(g, objects, p);
    expect(r.game.passed).toBe(5);
    expect(r.newlyPassedCount).toBe(5);
    expect(r.newlyPassed?.id).toBe('battery');
  });

  it('追い越さなかったタップでは一言なし。使ったお金・タップ数が更新される。金額を変えると次のタップから変わる', () => {
    let g = newGame(100);
    g = buy(g, objects, p).game;
    const r = buy({ ...g, amount: 1000 }, objects, p);
    expect(r.newlyPassed).toBeNull();
    expect(r.game).toEqual({ spent: 1100, taps: 2, amount: 1000, passed: 0 });
  });

  it('元の状態は変えない', () => {
    const g = newGame(100);
    buy(g, objects, p);
    expect(g).toEqual(newGame(100));
  });
});

describe('T-03 次の物', () => {
  it('最初はゴマ、文庫本を追い越したら牛乳パック', () => {
    expect(nextObject(0, objects)?.id).toBe('sesame');
    expect(nextObject(passedCount(OKU, objects, p), objects)?.id).toBe('milk');
  });

  it('全部追い越したら「なし」', () => {
    const spent = 800_000_000_000; // 8,000億円（設計書 1.6 の例）
    expect(passedCount(spent, objects, p)).toBe(objects.length);
    expect(nextObject(objects.length, objects)).toBeNull();
    expect(formatWeight(grams(spent, p))).toBe('40t');
  });
});

describe('T-05 人類の全部', () => {
  it('一辺22.6m、約4,484兆円', () => {
    const a = allGold(config.allGold.tonnes, p);
    expect(formatSize(a.sideCm)).toBe('22.6m');
    expect(formatYen(a.yen)).toBe('4,484兆円');
  });
});
