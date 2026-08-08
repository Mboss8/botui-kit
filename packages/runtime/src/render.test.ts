import { describe, expect, it } from 'vitest';
import { render } from './render.js';

describe('render facade', () => {
  it('renders escaped content, semantic actions, pagination, and navigation in one plan', () => {
    const plan = render({
      screen: 'orders.list',
      theme: 'default',
      locale: 'zh-CN',
      data: {
        customer: '<大哥 & Co>'
      },
      content: {
        mode: 'regular',
        title: '订单中心',
        text: '客户：{{ customer }}'
      },
      actions: [
        { text: '新建订单', action: 'order.create', style: 'primary' },
        { text: '返回', action: 'navigation.back', style: 'default' }
      ],
      pagination: {
        mode: 'page',
        session: 'ORD',
        page: 2,
        page_size: 8,
        total_pages: 3,
        total_items: 18
      }
    }, { chatId: 555 });

    const operation = plan.operations[0];
    expect(operation?.type).toBe('sendMessage');
    if (operation?.type !== 'sendMessage') throw new Error('unexpected operation');

    expect(operation.payload.text).toContain('&lt;大哥 &amp; Co&gt;');
    expect(operation.payload.reply_markup?.inline_keyboard.map((row) => row.map((item) => item.text))).toEqual([
      ['新建订单'],
      ['⏮', '◀️', '2/3', '▶️', '⏭'],
      ['返回']
    ]);
  });

  it('rejects an invalid DSL before compilation', () => {
    expect(() => render({
      screen: 'x',
      data: {},
      content: { mode: 'regular', title: 'x' },
      actions: [{ text: 'x', action: 'x', style: '#pink' }]
    })).toThrow();
  });
});
