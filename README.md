# Slack AI Bot

TypeScript で実装された Slack Bot アプリケーション。

## 機能

- Slack メッセージへの応答
- 簡単な対話機能

## 技術スタック

- TypeScript
- Node.js
- Slack Bolt Framework
- Docker

## 開発環境のセットアップ

1. リポジトリをクローン

```bash
git clone [repository-url]
cd slack_ai_bot
```

2. 依存関係のインストール

```bash
npm install
```

3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集し、必要な環境変数を設定:

- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`

4. 開発サーバーの起動

```bash
npm run dev
```

## ビルドと実行

### 開発環境

```bash
# 開発モードで実行（ホットリロード有効）
npm run dev

# TypeScriptのビルド
npm run build

# ビルドしたアプリケーションの実行
npm start
```

### Docker 環境

```bash
# Dockerイメージのビルド
docker build -t slack-ai-bot .

# コンテナの実行
docker run -d --env-file .env slack-ai-bot
```

## ライセンス

ISC
