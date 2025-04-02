import fs from 'fs';
import path from 'path';

interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestLogParams {
  model: string;
  maxTokens: number;
  contextLength: number;
  messageLength: number;
  history: MessageHistory[];
  prompt: string;
}

interface ResponseLogParams {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  role: string;
  contentType: string;
}

class ApiLogger {
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName() {
    const date = new Date();
    return path.join(
      this.logDir,
      `anthropic-api-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.log`
    );
  }

  private formatTimestamp() {
    return new Date().toISOString();
  }

  private appendToLog(content: string) {
    const logFile = this.getLogFileName();
    fs.appendFileSync(logFile, `${content}\n`);
  }

  logRequest(params: {
    model: string;
    maxTokens: number;
    contextLength: number;
    messageLength: number;
    history: Array<{ role: string; content: string }>;
    prompt: string;
  }) {
    const recentMessages = params.history.slice(-5);
    const olderMessages = params.history.slice(0, -5);

    const log = `
=== Anthropic API Request (${this.formatTimestamp()}) ===
Model: ${params.model}
Max Tokens: ${params.maxTokens}
Context Messages: ${params.contextLength}
Message Length: ${params.messageLength} chars

${
  olderMessages.length > 0
    ? `Older Messages:
${olderMessages.map((m, i) => `[${i + 1}] ${m.role}: ${m.content.length} chars`).join('\n')}

`
    : ''
}Latest 5 Messages:
${recentMessages
  .map(
    (m, i) => `[${olderMessages.length + i + 1}] ${m.role} (${m.content.length} chars):
${m.content}`
  )
  .join('\n\n')}

New Request:
${params.prompt}
===============================`;

    this.appendToLog(log);
  }

  logResponse(params: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    role: string;
    contentType: string;
  }) {
    const log = `
=== Anthropic API Response (${this.formatTimestamp()}) ===
Input Tokens: ${params.inputTokens}
Output Tokens: ${params.outputTokens}
Total Tokens: ${params.totalTokens}
Model: ${params.model}
Role: ${params.role}
Content Type: ${params.contentType}
===============================`;

    this.appendToLog(log);
  }
}

export const apiLogger = new ApiLogger();
