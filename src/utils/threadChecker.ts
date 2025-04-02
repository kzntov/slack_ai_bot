import { App } from '@slack/bolt';

export async function hasThreadMention(
  app: App,
  channel: string,
  threadTs: string
): Promise<boolean> {
  try {
    const result = await app.client.conversations.replies({
      channel,
      ts: threadTs,
    });

    // ボットのユーザーIDを取得
    const authResult = await app.client.auth.test();
    const botUserId = authResult.user_id;

    // スレッド内のメッセージをチェック
    return (result.messages || []).some(msg => msg.text && msg.text.includes(`<@${botUserId}>`));
  } catch (error) {
    console.error('Error checking thread mentions:', error);
    return false;
  }
}
