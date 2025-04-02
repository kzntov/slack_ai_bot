import { ChatMessage } from '../types/chat';

export function formatMessageForHistory(text: string, isBot: boolean): ChatMessage {
  return {
    role: isBot ? 'assistant' : 'user',
    content: text.replace(/<@[^>]+>/g, '').trim(), // メンションを除去
  };
}

export function cleanMessageText(text: string): string {
  return text.replace(/<@[^>]+>/g, '').trim();
}
