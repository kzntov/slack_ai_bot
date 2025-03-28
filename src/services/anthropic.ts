import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

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

export async function generateResponse(prompt: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
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
