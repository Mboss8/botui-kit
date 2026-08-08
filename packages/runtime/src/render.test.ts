import { describe, expect, it } from 'vitest';
import { render } from './render.js';

const reportTranslations = {
  'zh-CN': {
    'report.title': '订单报告：{{ customer }}',
    'report.body': '状态：已完成',
    'navigation.back': '返回'
  },
  'en-US': {
    'report.title': 'Order report: {{ customer }}',
    'report.body': 'Status: completed',
    'navigation.back': 'Back'
  }
};

function richReport(locale: string, mode: 'rich' | 'auto' = 'rich') {
  return {
    screen: 'orders.report',
    theme: 'default',
    locale,
    data: { customer: '<Acme & Co>' },
    content: {
      mode,
      blocks: [
        { type: 'heading', text: { i18n: 'report.title' } },
        { type: 'paragraph', text: { i18n: 'report.body' } }
      ]
    },
    actions: [
      { text: { i18n: 'navigation.back' }, action: 'navigation.back', style: 'default' }
    ]
  };
}

describe('render facade', () => {
  it('keeps the v0.1 default regular output stable', () => {
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

  it('renders a Chinese structured rich report with localized system actions', () => {
    const plan = render(richReport('zh-CN'), {
      chatId: 555,
      translations: reportTranslations
    });

    const operation = plan.operations[0];
    expect(operation?.type).toBe('sendRichMessage');
    if (operation?.type !== 'sendRichMessage') throw new Error('unexpected operation');

    expect(operation.payload.rich_message.blocks).toEqual([
      { type: 'heading', text: '订单报告：<Acme & Co>', size: 2 },
      { type: 'paragraph', text: '状态：已完成' }
    ]);
    expect(operation.payload.reply_markup?.inline_keyboard[0]?.[0]?.text).toBe('返回');
  });

  it('renders the same DSL in English without changing business data', () => {
    const plan = render(richReport('en-US'), {
      chatId: 555,
      translations: reportTranslations
    });

    const operation = plan.operations[0];
    expect(operation?.type).toBe('sendRichMessage');
    if (operation?.type !== 'sendRichMessage') throw new Error('unexpected operation');

    expect(operation.payload.rich_message.blocks).toEqual([
      { type: 'heading', text: 'Order report: <Acme & Co>', size: 2 },
      { type: 'paragraph', text: 'Status: completed' }
    ]);
    expect(operation.payload.reply_markup?.inline_keyboard[0]?.[0]?.text).toBe('Back');
  });

  it('selects Rich Message automatically when auto mode contains blocks', () => {
    const plan = render(richReport('en-US', 'auto'), {
      chatId: 555,
      translations: reportTranslations
    });

    expect(plan.operations[0]?.type).toBe('sendRichMessage');
  });

  it('applies theme navigation labels, layout defaults, divider, and generated pagination icons', () => {
    const plan = render({
      screen: 'products.list',
      theme: 'minimal',
      locale: 'zh-CN',
      data: {},
      content: {
        mode: 'regular',
        title: '产品',
        divider: true
      },
      actions: [
        { text: '产品A', action: 'product.a', style: 'default' },
        { text: '产品B', action: 'product.b', style: 'default' },
        { text: 'ignored by theme', action: 'navigation.back', style: 'default' }
      ],
      pagination: {
        mode: 'page',
        session: 'PROD',
        page: 2,
        page_size: 8,
        total_pages: 3
      }
    }, {
      chatId: 555,
      themeOverrides: {
        labels: { back: '退回' },
        layout: { maxPerRow: 1 },
        regular: { divider: '***' }
      }
    });

    const operation = plan.operations[0];
    expect(operation?.type).toBe('sendMessage');
    if (operation?.type !== 'sendMessage') throw new Error('unexpected operation');

    expect(operation.payload.text).toContain('***');
    expect(operation.payload.reply_markup?.inline_keyboard.map((row) => row.map((item) => item.text))).toEqual([
      ['产品A'],
      ['产品B'],
      ['«', '‹', '2/3', '›', '»'],
      ['退回']
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
