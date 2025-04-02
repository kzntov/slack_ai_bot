import { App } from '@slack/bolt';
import { SlackMessage } from '../types/slack';
import { generateResponse } from '../services/anthropic';
import { getThreadHistory } from '../services/slack';
import { hasThreadMention } from '../utils/threadChecker';

export async function handleThreadMessage(
  app: App,
  message: SlackMessage,
  say: any
): Promise<void> {
  try {
    // スレッド内にボットへのメンションがあるか確認
    const shouldRespond = await hasThreadMention(app, message.channel, message.thread_ts!);

    if (!shouldRespond) {
      return;
    }

    await say({
      text: `考えています...`,
      thread_ts: message.thread_ts,
    });

    // スレッド内の会話履歴を取得
    const history = await getThreadHistory(app, message.channel, message.thread_ts!);

    // Anthropic APIを使用して応答を生成
    const response = await generateResponse(message.text, history);

    // 応答を送信
    await say({
      text: `<@${message.user}>さん\n${response}`,
      thread_ts: message.thread_ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${message.user}>さん\n${response}`,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error responding to thread:', error);
    await say({
      text: `<@${message.user}>さん、申し訳ありません。エラーが発生しました。`,
      thread_ts: message.thread_ts,
    });
  }
}
