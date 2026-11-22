// 画面の縮尺（設計書 3.3・確認事項 Q2）。
// 物は立体に描くので（2026-11-22）、奥行きを含めた見た目の大きさ（artExtent）で並べる
import { describe, expect, it } from 'vitest';
import { sideCm } from '../src/core/gold';
import { config, objects } from '../src/data';
import { artExtent } from '../src/ui/art';
import { computeScale, DEPTH, GAP_PX } from '../src/ui/scene';

const area = { w: 390, h: 400 };
const ratio = config.view.nextObjectHeightRatio;
const last = objects[objects.length - 1]!;
const byId = (id: string) => objects.find((o) => o.id === id)!;

describe('縮尺', () => {
  it('次の物の見た目の高さ（奥行きを含む）が領域の60%になる', () => {
    const milk = byId('milk');
    const s = computeScale(area, sideCm(100_000_000, config.gold), milk, last, ratio);
    expect(artExtent(milk).h * s).toBeCloseTo(area.h * ratio);
  });

  it('奥行きのない物は、高さそのものが60%になる', () => {
    const egg = byId('egg');
    expect(artExtent(egg)).toEqual({ w: egg.w, h: egg.h });
    // 幅の決まりが先に効かないよう、横に広い領域で確かめる
    const wide = { w: 800, h: 400 };
    const s = computeScale(wide, sideCm(10_000_000, config.gold), egg, last, ratio);
    expect(egg.h * s).toBeCloseTo(wide.h * ratio);
  });

  it('金塊が次の物より大きく描かれるときは、金塊が入るように下げる', () => {
    const battery = byId('battery');
    // 電池（高さ5cm）の手前：上面を含めた金塊の高さが電池より大きい
    const side = 5 / (1 + DEPTH) + 1;
    const s = computeScale(area, side, battery, last, ratio);
    expect(side * (1 + DEPTH) * s).toBeCloseTo(area.h * ratio);
  });

  it('浴槽のような横長の物は、物（奥行きを含む）と金塊が幅に収まるように下げる（Q2）', () => {
    const tub = byId('bathtub');
    const side = sideCm(70_000_000_000, config.gold);
    const s = computeScale(area, side, tub, last, ratio);
    const total = artExtent(tub).w * s + GAP_PX + side * (1 + DEPTH) * s;
    expect(total).toBeLessThanOrEqual(area.w - 32 + 1e-9);
    expect(artExtent(tub).h * s).toBeLessThan(area.h * ratio);
  });

  it('全部追い越したあとは、金塊が領域に収まり、浴槽と並ぶ', () => {
    const side = sideCm(800_000_000_000, config.gold);
    const s = computeScale(area, side, null, last, ratio);
    expect(side * (1 + DEPTH) * s).toBeLessThanOrEqual(area.h * ratio + 1e-9);
    expect(artExtent(last).w * s + GAP_PX + side * (1 + DEPTH) * s).toBeLessThanOrEqual(area.w - 32 + 1e-9);
  });
});
