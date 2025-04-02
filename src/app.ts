import { App, LogLevel } from '@slack/bolt';
import dotenv from 'dotenv';
import { generateResponse, formatMessageForHistory } from './services/anthropic';

// 環境変数を読み込む
dotenv.config();

// 環境変数のチェック
const token = process.env.SLACK_BOT_TOKEN;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const appToken = process.env.SLACK_APP_TOKEN;

if (!token || !signingSecret || !appToken) {
  throw new Error('必要な環境変数が設定されていません。.envファイルを確認してください。');
}

// Slackメッセージの型定義
interface SlackMessage {
  type: 'message';
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
}

// アプリケーションの初期化（ソケットモード使用）
const app = new App({
  token,
  signingSecret,
  appToken,
  socketMode: true,
  logLevel: LogLevel.DEBUG,
});

// アクティブなスレッドを追跡
const activeThreads = new Set<string>();

// スレッドの会話履歴を取得
async function getThreadHistory(channel: string, threadTs: string) {
  try {
    const result = await app.client.conversations.replies({
      channel: channel,
      ts: threadTs,
    });

    const messages = result.messages || [];
    return messages
      .filter(msg => msg.text) // テキストのあるメッセージのみ
      .map(msg => formatMessageForHistory(msg.text!, 'bot_id' in msg));
  } catch (error) {
    console.error('Error fetching thread history:', error);
    return [];
  }
}

// メンション時の応答
app.event('app_mention', async ({ event, say }) => {
  console.log('Received app_mention event:', JSON.stringify(event, null, 2));
  try {
    // スレッドを記録
    const threadId = event.thread_ts || event.ts;
    activeThreads.add(threadId);
    console.log('Thread activated:', threadId);
    console.log('Current active threads:', Array.from(activeThreads));

    // メンションを除去してプロンプトを作成
    const prompt = event.text.replace(/<@[^>]+>/g, '').trim();

    if (!prompt) {
      await say({
        text: `<@${event.user}>さん、何かご質問はありますか？`,
        thread_ts: threadId,
      });
      return;
    }

    // ユーザーに応答中であることを通知
    await say({
      text: `<@${event.user}>さん、考えています...`,
      thread_ts: threadId,
    });

    // スレッド内の会話履歴を取得（スレッド内の場合のみ）
    const history = event.thread_ts ? await getThreadHistory(event.channel, event.thread_ts) : [];

    // Anthropic APIを使用して応答を生成
    const response = await generateResponse(prompt, history);

    // 応答を送信
    await say({
      text: `<@${event.user}>さん\n${response}`,
      thread_ts: threadId,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${event.user}>さん\n${response}`,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error responding to mention:', error);
    await say({
      text: `<@${event.user}>さん、申し訳ありません。エラーが発生しました。`,
      thread_ts: event.thread_ts || event.ts,
    });
  }
});

// スレッド内のメッセージを監視（正規表現を使用してすべてのメッセージにマッチ）
app.message(/.*/, async ({ message, say }) => {
  const msg = message as SlackMessage;
  console.log('Received message:', JSON.stringify(msg, null, 2));

  // スレッド内のメッセージかつボット自身のメッセージでない場合のみ処理
  if (
    msg.thread_ts &&
    activeThreads.has(msg.thread_ts) &&
    !msg.bot_id &&
    !msg.subtype &&
    // メンションを含むメッセージはスキップ（別のハンドラーで処理される）
    !/<@[^>]+>/.test(msg.text)
  ) {
    try {
      console.log('Processing thread message:', JSON.stringify(msg, null, 2));

      // ユーザーに応答中であることを通知
      await say({
        text: `<@${msg.user}>さん、考えています...`,
        thread_ts: msg.thread_ts,
      });

      // スレッド内の会話履歴を取得
      const history = await getThreadHistory(msg.channel, msg.thread_ts);

      // Anthropic APIを使用して応答を生成
      const response = await generateResponse(msg.text, history);

      // 応答を送信
      await say({
        text: `<@${msg.user}>さん\n${response}`,
        thread_ts: msg.thread_ts,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${msg.user}>さん\n${response}`,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error responding to thread:', error);
      await say({
        text: `<@${msg.user}>さん、申し訳ありません。エラーが発生しました。`,
        thread_ts: msg.thread_ts,
      });
    }
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
