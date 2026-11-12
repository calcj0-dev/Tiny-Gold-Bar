// 今のプレイの状態（設計書 5.3）。メモリの中だけ。リロードしたらタイトルから

import { type Game, newGame } from './core/gold';
import { config } from './data';

let game: Game = newGame(config.defaultAmount);
let startFrom: 'title' | 'retry' = 'title';

export const session = {
  get game(): Game {
    return game;
  },
  set game(g: Game) {
    game = g;
  },
  /** 新しいプレイを始める。from は計測の start に使う */
  reset(from: 'title' | 'retry'): void {
    game = newGame(config.defaultAmount);
    startFrom = from;
  },
  get startFrom(): 'title' | 'retry' {
    return startFrom;
  },
};
