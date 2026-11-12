// 今のプレイの状態（設計書 5.3）。メモリの中だけ。リロードしたらタイトルから

import { type Game, newGame } from './core/gold';
import { config } from './data';

let game: Game = newGame(config.defaultAmount);

export const session = {
  get game(): Game {
    return game;
  },
  set game(g: Game) {
    game = g;
  },
  /** 新しいプレイを始める */
  reset(): void {
    game = newGame(config.defaultAmount);
  },
};
