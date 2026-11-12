// 計算（設計書 3.1）。画面に依存しない。
// 使ったお金は円の整数で持ち、重さ・体積・大きさは表示のたびに計算する（足し算で誤差をためない）

export type GoldParams = { pricePerGram: number; densityGPerCm3: number };
export type ObjectSpec = { id: string; volumeCm3: number; w: number; h: number; shape: string };

/** ゲームの状態（設計書 5.3。maxAmount は確認事項 Q4 で追加）。メモリの中だけ */
export type Game = {
  /** 使ったお金（円の整数） */
  spent: number;
  taps: number;
  /** 今選んでいる1回の金額 */
  amount: number;
  /** 追い越した物の数 */
  passed: number;
  /** このプレイで使った一番大きい1回の金額（計測の max_amount。まだ買っていなければ 0） */
  maxAmount: number;
};

/** 体積がちょうど同じときに、小数の誤差で「追い越していない」にならないための余裕 */
const EPS = 1e-9;

export function newGame(amount: number): Game {
  return { spent: 0, taps: 0, amount, passed: 0, maxAmount: 0 };
}

export function grams(spent: number, p: GoldParams): number {
  return spent / p.pricePerGram;
}

export function volumeCm3(spent: number, p: GoldParams): number {
  return grams(spent, p) / p.densityGPerCm3;
}

/** 金塊（立方体）の一辺（cm） */
export function sideCm(spent: number, p: GoldParams): number {
  return Math.cbrt(volumeCm3(spent, p));
}

/** 追い越した物の数。objects は体積の小さい順（data.ts で検査済み） */
export function passedCount(spent: number, objects: readonly ObjectSpec[], p: GoldParams): number {
  const v = volumeCm3(spent, p);
  let n = 0;
  for (const o of objects) {
    if (v >= o.volumeCm3 * (1 - EPS)) n++;
    else break;
  }
  return n;
}

/** 次に追い越す物。全部追い越したら null */
export function nextObject<T extends ObjectSpec>(passed: number, objects: readonly T[]): T | null {
  return objects[passed] ?? null;
}

/** その物と同じ大きさの金の重さ（g）と値段（円） */
export function objectGrams(o: ObjectSpec, p: GoldParams): number {
  return o.volumeCm3 * p.densityGPerCm3;
}

export function objectPrice(o: ObjectSpec, p: GoldParams): number {
  return objectGrams(o, p) * p.pricePerGram;
}

export type BuyResult<T extends ObjectSpec> = {
  game: Game;
  /** このタップで追い越した物のうち一番大きい物（1つも追い越していなければ null）。一言はこの物だけ出す */
  newlyPassed: T | null;
  /** このタップで追い越した数 */
  newlyPassedCount: number;
};

/** 「金を買う」を1回押す。元の状態は変えずに新しい状態を返す */
export function buy<T extends ObjectSpec>(game: Game, objects: readonly T[], p: GoldParams): BuyResult<T> {
  const spent = game.spent + game.amount;
  const passed = passedCount(spent, objects, p);
  const count = passed - game.passed;
  return {
    game: { ...game, spent, taps: game.taps + 1, passed, maxAmount: Math.max(game.maxAmount, game.amount) },
    newlyPassed: count > 0 ? (objects[passed - 1] ?? null) : null,
    newlyPassedCount: count,
  };
}

/** 人類が掘った金の全部（設計書 3.1）：一辺（cm）と値段（円） */
export function allGold(tonnes: number, p: GoldParams): { sideCm: number; yen: number } {
  const g = tonnes * 1_000_000;
  return { sideCm: Math.cbrt(g / p.densityGPerCm3), yen: g * p.pricePerGram };
}
