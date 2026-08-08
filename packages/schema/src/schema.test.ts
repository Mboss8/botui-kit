import { describe, expect, it } from 'vitest';
import { parseRenderRequest } from './schema.js';

describe('parseRenderRequest', () => {
  it('accepts a minimal V1 screen request', () => {
    const value = parseRenderRequest({
      screen: 'order.detail',
      theme: 'default',
      locale: 'zh-CN',
      data: { order_id: 'A10086' },
      content: { mode: 'regular', title: '订单详情' },
      actions: [{ text: '返回', action: 'navigation.back', style: 'default' }]
    });

    expect(value.screen).toBe('order.detail');
    expect(value.actions[0]?.style).toBe('default');
  });

  it('rejects unsupported button styles', () => {
    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: { mode: 'regular', title: 'x' },
      actions: [{ text: 'x', action: 'x', style: '#ff00ff' }]
    })).toThrow();
  });

  it('accepts page pagination state', () => {
    const value = parseRenderRequest({
      screen: 'orders.list',
      data: {},
      content: { mode: 'regular', title: '订单' },
      pagination: {
        mode: 'page',
        session: 'ORD8K2',
        page: 2,
        page_size: 8,
        total_pages: 5,
        total_items: 39
      }
    });

    expect(value.pagination?.mode).toBe('page');
  });
});
