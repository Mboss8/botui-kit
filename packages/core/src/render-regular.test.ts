import { describe, expect, it } from 'vitest';
import { escapeTelegramHtml } from './html.js';
import { renderRegular } from './render-regular.js';
import { interpolate } from './template.js';

describe('regular renderer', () => {
  it('escapes Telegram HTML metacharacters in business data', () => {
    expect(escapeTelegramHtml('<Tom & Jerry>')).toBe('&lt;Tom &amp; Jerry&gt;');
  });

  it('interpolates dotted paths without eval and escapes inserted values', () => {
    expect(interpolate('你好，{{ user.name }}', {
      user: { name: '<Alice & Bob>' }
    })).toBe('你好，&lt;Alice &amp; Bob&gt;');
  });

  it('renders a regular screen as safe Telegram HTML', () => {
    const rendered = renderRegular({
      version: '1',
      screen: 'order.detail',
      theme: 'default',
      locale: 'zh-CN',
      data: {
        order_id: 'A<10086>',
        product: '香港 & 美国'
      },
      content: {
        mode: 'regular',
        title: '订单 {{ order_id }}',
        text: '以下是订单详情',
        fields: [
          { label: '产品', value: '{{ product }}' }
        ],
        divider: true,
        footer: 'BotUI'
      },
      actions: []
    });

    expect(rendered.format).toBe('html');
    expect(rendered.text).toContain('<b>订单 A&lt;10086&gt;</b>');
    expect(rendered.text).toContain('香港 &amp; 美国');
    expect(rendered.text).not.toContain('A<10086>');
  });
});
