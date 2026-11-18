// 振動（A6）。対応している端末（主に Android）だけ。iPhone のブラウザは対応していないので何もしない。
// 音を消しているときも振動はする（音とは別の手ごたえなので）

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // 対応していなくても遊べる
  }
}
