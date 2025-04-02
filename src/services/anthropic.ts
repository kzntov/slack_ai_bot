import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { apiLogger } from '../utils/apiLogger';

dotenv.config();

// 環境変数のチェック
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY が設定されていません。.envファイルを確認してください。');
}

// Anthropicクライアントの初期化
const anthropic = new Anthropic({
  apiKey,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateResponse(
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  try {
    // 型アサーションを使用して、APIが期待する形式にキャスト
    const messages = [
      ...history,
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const model = 'claude-3-7-sonnet-20250219';
    const maxTokens = 1024;

    apiLogger.logRequest({
      model,
      maxTokens,
      contextLength: history.length,
      messageLength: prompt.length,
      history: messages,
      prompt,
    });

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: messages,
    });

    apiLogger.logResponse({
      inputTokens: message.usage?.input_tokens || 0,
      outputTokens: message.usage?.output_tokens || 0,
      totalTokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
      model: message.model,
      role: message.role,
      contentType: message.content[0].type,
    });

    const content = message.content[0];
    if ('text' in content) {
      return content.text;
    }
    throw new Error('予期しない応答形式を受信しました。');
  } catch (error) {
    console.error('Anthropic APIエラー:', error);
    throw new Error('申し訳ありません。応答の生成中にエラーが発生しました。');
  }
}

// メッセージを会話履歴用のフォーマットに変換
export function formatMessageForHistory(text: string, isBot: boolean): ChatMessage {
  return {
    role: isBot ? 'assistant' : 'user',
    content: text.replace(/<@[^>]+>/g, '').trim(), // メンションを除去
  };
}
