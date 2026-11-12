# 金塊、ちっさ！（Tiny Gold Bar）

お金で金を買うと、金塊はどのくらいの大きさになるかを、タップして確かめるブラウザゲーム（BAKA-071）。

- 設計：`design\BAKA-071_金塊を育てろ\`（要件定義書・設計書・data）
- 進捗：[docs/ロードマップ.md](docs/ロードマップ.md)

## 開発
Node.js 24 以降。

```
npm install
npm run dev        # 開発サーバー
npm test           # テスト
npm run build      # 型チェック＋ビルド（dist/）
```

- ゲームのデータと文言は `src/data/` の JSON で持つ（設計書 4章）
- バージョンは `package.json` の `version` で持ち、タイトル画面の右上に出る（設計書 5.7）
- 環境変数は `.env.example` を参照

本作はジョークであり、投資・税務の助言ではありません。金の値段は架空です。
