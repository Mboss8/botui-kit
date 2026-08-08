import { describe, expect, it } from 'vitest';
import { buildServer } from './server.js';

describe('HTTP adapter', () => {
  it('reports health without Telegram credentials', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', service: 'botui' });
    await app.close();
  });

  it('renders BotUI DSL through POST /v1/render', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/render',
      payload: {
        screen: 'order.detail',
        data: { order_id: 'A10086' },
        content: { mode: 'regular', title: '订单 {{ order_id }}' },
        actions: [{ text: '返回', action: 'navigation.back', style: 'default' }]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().version).toBe('1');
    expect(response.json().operations[0].type).toBe('sendMessage');
    await app.close();
  });

  it('renders the extended rich DSL through the same POST /v1/render endpoint', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/render',
      payload: {
        screen: 'report.detail',
        theme: 'business',
        locale: 'zh-CN',
        data: { customer: '<Acme & Co>' },
        content: {
          mode: 'rich',
          blocks: [
            { type: 'heading', text: { i18n: 'report.title', fallback: '订单报告：{{ customer }}' } },
            { type: 'paragraph', text: '状态：已完成' }
          ]
        },
        actions: [
          { text: { i18n: 'navigation.back', fallback: '返回' }, action: 'navigation.back', style: 'default' }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.version).toBe('1');
    expect(body.operations[0].type).toBe('sendRichMessage');
    expect(body.operations[0].payload.rich_message.blocks).toEqual([
      { type: 'heading', text: '订单报告：<Acme & Co>', size: 2 },
      { type: 'paragraph', text: '状态：已完成' }
    ]);
    expect(body.operations[0].payload.reply_markup.inline_keyboard[0][0].text).toBe('返回');
    await app.close();
  });

  it('returns a stable 400 envelope for invalid DSL', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/render',
      payload: {
        screen: 'x',
        data: {},
        content: { mode: 'regular', title: 'x' },
        actions: [{ text: 'x', action: 'x', style: '#pink' }]
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_RENDER_REQUEST',
        message: 'Invalid BotUI render request'
      }
    });
    await app.close();
  });
});
