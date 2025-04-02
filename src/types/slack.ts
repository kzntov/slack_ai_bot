import { AppMentionEvent } from '@slack/bolt';

export interface SlackMessage {
  type: 'message';
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
}

// AppMentionEventを継承して必要なプロパティを確実に含める
export interface SlackEventPayload extends Omit<AppMentionEvent, 'user'> {
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  channel: string;
}
