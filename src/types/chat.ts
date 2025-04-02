export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ThreadHistory {
  messages: ChatMessage[];
}
