import { describe, expect, it } from 'vitest';
import { compileTelegram } from './compiler.js';

describe('compileTelegram', () => {
  it('compiles safe HTML and semantic inline buttons into sendMessage', () => {
    const plan = compileTelegram({
      content: { format: 'html', text: '<b>订单详情</b>' },
      buttons: [[
        { text: '立即购买', action: 'order.buy', style: 'primary' },
        { text: '返回', action: 'navigation.back', style: 'default' }
      ]]
    }, { mode: 'send', chatId: 555 });

    expect(plan.version).toBe('1');
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]).toEqual({
      type: 'sendMessage',
      payload: {
        chat_id: 555,
        text: '<b>订单详情</b>',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '立即购买', callback_data: 'order.buy', style: 'primary' },
            { text: '返回', callback_data: 'navigation.back' }
          ]]
        }
      }
    });
  });

  it('compiles an existing message target into editMessageText', () => {
    const plan = compileTelegram({
      content: { format: 'html', text: '第 2 页' },
      buttons: []
    }, { mode: 'edit', chatId: 555, messageId: 99 });

    expect(plan.operations[0]?.type).toBe('editMessageText');
    expect(plan.operations[0]?.payload).toMatchObject({
      chat_id: 555,
      message_id: 99,
      text: '第 2 页'
    });
  });

  it('rejects callback_data above Telegram 64-byte limit', () => {
    expect(() => compileTelegram({
      content: { format: 'html', text: 'x' },
      buttons: [[{ text: 'x', action: '页'.repeat(30), style: 'default' }]]
    }, { mode: 'send', chatId: 1 })).toThrow(/64/);
  });
});
