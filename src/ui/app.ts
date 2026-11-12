// 画面の切り替え（設計書 2章）。ページの読み込みは起こさない

export type ScreenName = 'title' | 'play' | 'result';

export type App = {
  go(screen: ScreenName): void;
  readonly screen: ScreenName;
};

export type ScreenView = { el: HTMLElement; unmount?: () => void };
export type ScreenFactory = (app: App) => ScreenView;

export function createApp(root: HTMLElement, screens: Record<ScreenName, ScreenFactory>, footer: HTMLElement): App {
  const main = document.createElement('div');
  main.className = 'screen-host';
  root.replaceChildren(main, footer);

  let current: ScreenView | null = null;
  let screenName: ScreenName = 'title';

  const app: App = {
    get screen() {
      return screenName;
    },
    go(next) {
      current?.unmount?.();
      screenName = next;
      current = screens[next](app);
      main.replaceChildren(current.el);
      main.dataset.screen = next;
      window.scrollTo(0, 0);
    },
  };
  return app;
}
