# たい焼き文化祭オーダー

たい焼きと合格体験記を一緒に受け付ける、Vercel / Neon 対応の注文ツールです。

## 起動

```bash
npm install
npm run dev
```

Neon に保存する場合は `.env.local` に `DATABASE_URL` を設定してください。テーブルは API が初回注文時に自動作成します。手動で作成する場合は `db/schema.sql` を Neon SQL Editor で実行します。

## 画面

- `/` 注文受付、購入者情報、注文確認
- `/orders` 保存済み注文の確認（Neon 接続時）
