import { App, LogLevel } from '@slack/bolt';
import dotenv from 'dotenv';
import { handleAppMention } from './handlers/mentions';

// 環境変数を読み込む
dotenv.config();

// 環境変数のチェック
const token = process.env.SLACK_BOT_TOKEN;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const appToken = process.env.SLACK_APP_TOKEN;

if (!token || !signingSecret || !appToken) {
  throw new Error('必要な環境変数が設定されていません。.envファイルを確認してください。');
}

// アプリケーションの初期化（ソケットモード使用）
const app = new App({
  token,
  signingSecret,
  appToken,
  socketMode: true,
  logLevel: LogLevel.DEBUG,
});

// すべてのメッセージをデバッグ用にログ出力
app.message(async ({ message }) => {
  console.log('Received message event:', JSON.stringify(message, null, 2));
});

// メンション時の応答
app.event('app_mention', handleAppMention);

// エラーハンドリング
app.error(async error => {
  console.error('An error occurred:', error);
});

// アプリを起動
(async () => {
  try {
    await app.start();
    console.log('⚡️ Bolt app is running in socket mode!');
  } catch (error) {
    console.error('アプリケーションの起動に失敗しました:', error);
    process.exit(1);
  }
})();
