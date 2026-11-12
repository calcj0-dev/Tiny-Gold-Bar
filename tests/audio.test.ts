// 効果音（設計書 1.4）：チャリンは金額が大きいほど低く重い（6段階）
import { describe, expect, it, vi } from 'vitest';
import { chariTones, sfx } from '../src/audio';

describe('効果音', () => {
  it('チャリンは金額の段階が上がるほど低く、長く、大きい', () => {
    const tones = [0, 1, 2, 3, 4, 5].map((l) => chariTones(l, 6)[0]!);
    for (let i = 1; i < tones.length; i++) {
      expect(tones[i]!.freq).toBeLessThan(tones[i - 1]!.freq);
      expect(tones[i]!.dur).toBeGreaterThan(tones[i - 1]!.dur);
      expect(tones[i]!.gain!).toBeGreaterThan(tones[i - 1]!.gain!);
    }
  });

  it('音を鳴らせない環境（AudioContext なし・解放前）でも例外を出さない', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => {
      sfx.buy(0, 6);
      sfx.pass();
      sfx.result();
    }).not.toThrow();
    vi.unstubAllGlobals();
  });
});
