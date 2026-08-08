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
