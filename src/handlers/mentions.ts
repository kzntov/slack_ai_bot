import { App } from '@slack/bolt';
import { SlackEventPayload } from '../types/slack';
import { generateResponse } from '../services/anthropic';
import { getThreadHistory } from '../services/slack';
import { cleanMessageText } from '../utils/messageFormatter';

export async function handleAppMention(
  app: App,
  event: SlackEventPayload,
  say: any
): Promise<void> {
  try {
    const threadId = event.thread_ts || event.ts;
    const prompt = cleanMessageText(event.text);

    if (!prompt) {
      await say({
        text: `<@${event.user}>さん、何かご質問はありますか？`,
        thread_ts: threadId,
      });
      return;
    }

    // スレッド内の会話履歴を取得（スレッド内の場合のみ）
    const history = event.thread_ts
      ? await getThreadHistory(app, event.channel, event.thread_ts)
      : [];

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
}
