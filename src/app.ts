import { App, LogLevel } from '@slack/bolt';
import dotenv from 'dotenv';

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
app.message(async ({ message, say }) => {
  console.log('Received message event:', JSON.stringify(message, null, 2));
});

// 特定のメッセージ（hello）への応答
app.message(/hello/i, async ({ message, say }) => {
  console.log('Received hello message:', JSON.stringify(message, null, 2));
  // メッセージがユーザーからのものであることを確認
  if ('user' in message) {
    try {
      await say({
        text: `こんにちは！ <@${message.user}>さん！`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `こんにちは！ <@${message.user}>さん！\n何かお手伝いできることはありますか？`,
            },
          },
        ],
      });
      console.log('Sent response to user:', message.user);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
});

// メンション時の応答
app.event('app_mention', async ({ event, say }) => {
  console.log('Received app_mention event:', JSON.stringify(event, null, 2));
  try {
    await say({
      text: `<@${event.user}>さん、呼びましたか？`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${event.user}>さん、呼びましたか？\n何かお手伝いできることはありますか？`,
          },
        },
      ],
    });
    console.log('Sent response to mention from user:', event.user);
  } catch (error) {
    console.error('Error responding to mention:', error);
  }
});

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
