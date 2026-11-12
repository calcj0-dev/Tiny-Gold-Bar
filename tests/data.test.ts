// T-06 データの検査（設計書 4章）
import { describe, expect, it } from 'vitest';
import configJson from '../src/data/config.json';
import jaJson from '../src/data/i18n/ja.json';
import objectsJson from '../src/data/objects.json';
import { type GameConfig, type ObjectsData, validateData } from '../src/data';

const clone = <T>(x: T): T => structuredClone(x);
const cfg = (): GameConfig => clone(configJson);
const objs = (): ObjectsData => clone(objectsJson);
const ja = () => clone(jaJson) as Record<string, unknown>;

describe('T-06 データの検査', () => {
  it('正しいデータで通る', () => {
    expect(validateData(cfg(), objs(), { ja: ja() })).toEqual([]);
  });

  it('体積の順番が崩れていると止まる', () => {
    const o = objs();
    [o.objects[2], o.objects[3]] = [o.objects[3]!, o.objects[2]!];
    expect(validateData(cfg(), o, { ja: ja() }).join()).toMatch(/volumeCm3 must be larger/);
  });

  it('defaultAmount が段階にないと止まる', () => {
    const c = cfg();
    c.defaultAmount = 500;
    expect(validateData(c, objs(), { ja: ja() }).join()).toMatch(/defaultAmount/);
  });

  it('金額の段階が小さい順でない・正の整数でないと止まる', () => {
    const c = cfg();
    c.amounts = [100, 100, 0.5];
    const e = validateData(c, objs(), { ja: ja() }).join();
    expect(e).toMatch(/amounts\[1\] must be larger/);
    expect(e).toMatch(/amounts\[2\] must be a positive integer/);
  });

  it('値段・密度・人類の金の量が正でないと止まる', () => {
    const c = cfg();
    c.gold.pricePerGram = 0;
    c.gold.densityGPerCm3 = -1;
    c.allGold.tonnes = 0;
    expect(validateData(c, objs(), { ja: ja() })).toHaveLength(3);
  });

  it('物の id の重なり・知らない形・w と h が正でないと止まる', () => {
    const o = objs();
    o.objects[1]!.id = o.objects[0]!.id;
    o.objects[2]!.shape = 'star';
    o.objects[3]!.h = 0;
    const e = validateData(cfg(), o, { ja: ja() }).join();
    expect(e).toMatch(/duplicated/);
    expect(e).toMatch(/shape "star"/);
    expect(e).toMatch(/w and h must be positive/);
  });

  it('物の名前・文言のキーが足りないと止まる', () => {
    const m = ja();
    delete (m.objects as Record<string, string>).milk;
    const en = ja();
    delete (en.play as Record<string, string>).buy;
    const e = validateData(cfg(), objs(), { ja: m, en }).join();
    expect(e).toMatch(/i18n\/ja: missing name "objects\.milk"/);
    expect(e).toMatch(/i18n\/en: missing "play\.buy"/);
  });

  it('リンクが https:// で始まらないと止まる', () => {
    const c = cfg();
    c.links.follow = 'http://x.com/';
    expect(validateData(c, objs(), { ja: ja() }).join()).toMatch(/links\.follow/);
  });
});
