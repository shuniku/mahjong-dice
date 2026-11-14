# 麻雀サイコロ

> このアプリは、M5Stack の Stopwatch から Claude Code を操作できるようになったので、そのテストのために作成したアプリです。

**アプリ: https://shuniku.github.io/mahjong-dice/**

麻雀用のサイコロ PWA。2 個のサイコロを振り、当たる人・配牌開始位置・割れ目を表示します。4人打ち／3人打ち、起家決め（1 度振り）、履歴（直近 20 回）に対応。オフラインで動きます。

## 使い方

- 開発: `npm run dev`
- ビルド: `npm run build`（`dist/` を静的ホスティングに置く。HTTPS が必要）
- 単体・結合テスト: `npm run test:coverage`
- E2E: `npx playwright install chromium webkit` のあと `npm run test:e2e`
- 型検査・Lint: `npm run typecheck` / `npm run lint`

初回に一度開くとファイルが端末に保存され、2 回目以降は機内モードでも使えます。iOS はホーム画面に追加して使うと保存が消えにくくなります。

## 同梱物

- フォント: Noto Serif JP（SIL OFL 1.1）を使用文字だけにサブセット化して `public/fonts/` に同梱。UI の文字を変えたら `npm run font` で作り直す。
- アイコン: `npm run icons` でローカル生成（外部サービスなし）。
