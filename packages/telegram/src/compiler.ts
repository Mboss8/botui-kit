import { Buffer } from 'node:buffer';
import type { RenderedContent } from '@botui/core';
import type { BotUIButton } from '@botui/schema';

export type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
  style?: 'primary' | 'success' | 'danger';
};

export type TelegramInlineKeyboardMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

export type TelegramSendMessagePayload = {
  chat_id?: string | number;
  text: string;
  parse_mode: 'HTML';
  reply_markup?: TelegramInlineKeyboardMarkup;
};

export type TelegramEditMessageTextPayload = TelegramSendMessagePayload & {
  message_id: number;
};

export type TelegramEditReplyMarkupPayload = {
  chat_id?: string | number;
  message_id: number;
  reply_markup: TelegramInlineKeyboardMarkup;
};

export type RenderOperation =
  | { type: 'sendMessage'; payload: TelegramSendMessagePayload }
  | { type: 'editMessageText'; payload: TelegramEditMessageTextPayload }
  | { type: 'editMessageReplyMarkup'; payload: TelegramEditReplyMarkupPayload };

export type RenderPlan = {
  version: '1';
  operations: RenderOperation[];
};

export type CompileTelegramInput = {
  content: RenderedContent;
  buttons: BotUIButton[][];
};

export type CompileTelegramOptions = {
  mode?: 'send' | 'edit' | 'markup';
  chatId?: string | number;
  messageId?: number;
};

function compileButton(button: BotUIButton): TelegramInlineKeyboardButton {
  const compiled: TelegramInlineKeyboardButton = { text: button.text };

  if (button.url) {
    compiled.url = button.url;
  } else {
    if (Buffer.byteLength(button.action, 'utf8') > 64) {
      throw new Error('Telegram callback_data exceeds 64 UTF-8 bytes');
    }
    compiled.callback_data = button.action;
  }

  if (button.style !== 'default') {
    compiled.style = button.style;
  }

  return compiled;
}

function compileKeyboard(rows: BotUIButton[][]): TelegramInlineKeyboardMarkup | undefined {
  if (rows.length === 0) {
    return undefined;
  }

  return {
    inline_keyboard: rows.map((row) => row.map(compileButton))
  };
}

function withChatId<T extends object>(payload: T, chatId: string | number | undefined): T & { chat_id?: string | number } {
  if (chatId === undefined) {
    return payload;
  }
  return { ...payload, chat_id: chatId };
}

export function compileTelegram(input: CompileTelegramInput, options: CompileTelegramOptions = {}): RenderPlan {
  const mode = options.mode ?? 'send';
  const keyboard = compileKeyboard(input.buttons);

  if (mode === 'markup') {
    if (options.messageId === undefined) {
      throw new Error('messageId is required for markup edit');
    }

    const payload = withChatId({
      message_id: options.messageId,
      reply_markup: keyboard ?? { inline_keyboard: [] }
    }, options.chatId);

    return {
      version: '1',
      operations: [{ type: 'editMessageReplyMarkup', payload }]
    };
  }

  const base: TelegramSendMessagePayload = withChatId({
    text: input.content.text,
    parse_mode: 'HTML' as const
  }, options.chatId);

  if (keyboard) {
    base.reply_markup = keyboard;
  }

  if (mode === 'edit') {
    if (options.messageId === undefined) {
      throw new Error('messageId is required for message edit');
    }

    return {
      version: '1',
      operations: [{
        type: 'editMessageText',
        payload: { ...base, message_id: options.messageId }
      }]
    };
  }

  return {
    version: '1',
    operations: [{ type: 'sendMessage', payload: base }]
  };
}
