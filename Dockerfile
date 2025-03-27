FROM node:20-slim

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードをコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# 実行時の環境変数を設定
ENV NODE_ENV=production

# アプリケーションの起動
CMD ["npm", "start"]