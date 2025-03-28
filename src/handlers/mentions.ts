import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { generateResponse } from '../services/anthropic';

type AppMentionEvent = SlackEventMiddlewareArgs<'app_mention'>;

export async function handleAppMention({
  event,
  say,
}: AppMentionEvent & AllMiddlewareArgs): Promise<void> {
  console.log('Received app_mention event:', JSON.stringify(event, null, 2));

  try {
    // メンションを除去してプロンプトを作成
    const prompt = event.text.replace(/<@[^>]+>/g, '').trim();

    if (!prompt) {
      await say({
        text: `<@${event.user}>さん、何かご質問はありますか？`,
      });
      return;
    }

    // ユーザーに応答中であることを通知
    await say({
      text: `<@${event.user}>さん、考えています...`,
    });

    // Anthropic APIを使用して応答を生成
    const response = await generateResponse(prompt);

    // 応答を送信
    await say({
      text: `<@${event.user}>さん\n${response}`,
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

    console.log('Sent response to mention from user:', event.user);
  } catch (error) {
    console.error('Error responding to mention:', error);

    // エラーメッセージを送信
    await say({
      text: `<@${event.user}>さん、申し訳ありません。エラーが発生しました。`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${event.user}>さん、申し訳ありません。エラーが発生しました。\nしばらく待ってからもう一度お試しください。`,
          },
        },
      ],
    });
  }
}
