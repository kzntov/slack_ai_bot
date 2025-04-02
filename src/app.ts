import { App, LogLevel } from '@slack/bolt';
import dotenv from 'dotenv';
import { handleAppMention } from './handlers/mentions';
import { handleThreadMessage } from './handlers/messages';
import { SlackMessage, SlackEventPayload } from './types/slack';

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

// メンション時の応答
app.event('app_mention', async ({ event, say }) => {
  console.log('Received app_mention event:', JSON.stringify(event, null, 2));
  // イベントを適切な型にキャスト
  const slackEvent = event as unknown as SlackEventPayload;
  await handleAppMention(app, slackEvent, say);
});

// スレッド内のメッセージを監視
app.message(/.*/, async ({ message, say }) => {
  const msg = message as SlackMessage;
  console.log('Received message:', JSON.stringify(msg, null, 2));

  // スレッド内のメッセージかつボット自身のメッセージでない場合のみ処理
  if (
    msg.thread_ts &&
    !msg.bot_id &&
    !msg.subtype &&
    // メンションを含むメッセージはスキップ（別のハンドラーで処理される）
    !/<@[^>]+>/.test(msg.text)
  ) {
    await handleThreadMessage(app, msg, say);
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
