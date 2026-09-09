# Discord Canvas

Slack Canvas風のリアルタイム共同編集エディター（Discord認証付き）

## セットアップ

### 1. Discord Applicationの作成

1. https://discord.com/developers/applications にアクセス
2. 「New Application」をクリック
3. 「OAuth2」→「General」に移動
4. Client ID と Client Secret をコピー
5. Redirects に `http://localhost:3001/auth/discord/callback` を追加して保存

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して以下を設定:
```
DISCORD_CLIENT_ID=（DiscordのClient ID）
DISCORD_CLIENT_SECRET=（DiscordのClient Secret）
DISCORD_CALLBACK_URL=http://localhost:3001/auth/discord/callback
SESSION_SECRET=（任意のランダム文字列）
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. 起動

ターミナル1（バックエンド）:
```bash
cd discord-canvas
npm start
```

ターミナル2（フロントエンド）:
```bash
cd discord-canvas/client
npm run dev
```

4. ブラウザで http://localhost:5173 を開く

## 機能

- **Discord OAuthログイン** — Discordアカウントで認証
- **リッチテキスト編集** — フォントサイズ、太字、斜体、下線、取り消し線、見出し
- **文字色・ハイライト** — カラーピッカーで色を選択
- **画像挿入** — ファイルアップロード対応
- **リアルタイム共同編集** — 同じキャンバスを複数人で同時編集
- **編集中ユーザー表示** — Discordアイコンと名前でリアルタイム表示
- **自動保存** — 500ms後に自動保存
