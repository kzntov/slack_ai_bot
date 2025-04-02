import { App } from '@slack/bolt';
import { formatMessageForHistory } from '../utils/messageFormatter';
import { ChatMessage } from '../types/chat';

export async function getThreadHistory(
  app: App,
  channel: string,
  threadTs: string
): Promise<ChatMessage[]> {
  try {
    const result = await app.client.conversations.replies({
      channel,
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
