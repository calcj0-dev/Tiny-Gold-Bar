// 端末への保存（設計書 5.3）。保存するのは音の設定だけ。
// 保存できない環境（プライベートブラウズなど）では初期値で動く

const PREFIX = 'baka071.';

export type StorageKey = 'sound';

export function load(key: StorageKey, fallback: string): string {
  try {
    return globalThis.localStorage?.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key: StorageKey, value: string): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, value);
  } catch {
    // 保存できなくても遊べるようにする
  }
}
