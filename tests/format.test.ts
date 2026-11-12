// T-04 表示の形（設計書 3.2）
import { describe, expect, it } from 'vitest';
import { formatApproxYen, formatNumberJa, formatSize, formatWeight, formatYen } from '../src/core/format';

describe('T-04 表示の形', () => {
  it('金額：兆・億・万で区切り、それぞれの中はカンマ。0の区切りは省く', () => {
    expect([100, 12_300, 100_000_000, 120_000_000, 4_484_000_000_000_000].map(formatYen)).toEqual([
      '100円',
      '1万2,300円',
      '1億円',
      '1億2,000万円',
      '4,484兆円',
    ]);
    expect(formatYen(0)).toBe('0円');
    expect(formatYen(99_990_000_000_000_000 / 10)).toBe('9,999兆円');
  });

  it('円の付かない数（人類の金の量）：22万4,200', () => {
    expect(formatNumberJa(224_200)).toBe('22万4,200');
  });

  it('重さ：設計書 3.2 の例', () => {
    const g = [0.005, 0.05796, 7.1484, 160.356, 5000, 4559.52, 19_320, 3_864_000];
    expect(g.map(formatWeight)).toEqual(['0.005g', '0.058g', '7.15g', '160g', '5kg', '4.56kg', '19.3kg', '3.86t']);
  });

  it('重さ：丸めて単位が繰り上がるときは上の単位にする', () => {
    expect(formatWeight(0.9996)).toBe('1g');
    expect(formatWeight(999.6)).toBe('1kg');
    expect(formatWeight(999_600)).toBe('1t');
    expect(formatWeight(12_345_678)).toBe('12.3t');
    expect(formatWeight(1_234_567_890)).toBe('1,230t');
  });

  it('大きさ：0.64mm、6.37cm、22.6m', () => {
    expect([0.0637, 6.3728, 2264].map(formatSize)).toEqual(['0.64mm', '6.37cm', '22.6m']);
    expect(formatSize(0.9996)).toBe('1cm');
    expect(formatSize(99.96)).toBe('1m');
  });

  it('物の値段：「約」＋有効数字2けた', () => {
    expect([1159.2, 38_640_000, 386_400_000].map(formatApproxYen)).toEqual(['約1,200円', '約3,900万円', '約3.9億円']);
  });
});
