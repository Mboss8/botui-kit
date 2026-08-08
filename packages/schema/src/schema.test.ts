import { describe, expect, it } from 'vitest';
import { parseRenderRequest } from './schema.js';

// v0.2 contract tests intentionally land before implementation (TDD RED).
describe('parseRenderRequest', () => {
  it('keeps accepting the v0.1 regular screen shape', () => {
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

  it('accepts localized text and semantic rich blocks', () => {
    const value = parseRenderRequest({
      screen: 'report.detail',
      locale: 'en-US',
      data: { customer: 'Acme' },
      content: {
        mode: 'rich',
        is_rtl: false,
        blocks: [
          { type: 'heading', text: { i18n: 'report.title', fallback: 'Report' }, size: 2 },
          { type: 'paragraph', text: 'Customer: {{ customer }}' },
          { type: 'divider' },
          { type: 'preformatted', text: 'const ok = true;', language: 'typescript' },
          { type: 'footer', text: { i18n: 'report.footer' } }
        ]
      },
      actions: [
        { text: { i18n: 'navigation.back', fallback: 'Back' }, action: 'navigation.back', style: 'default' }
      ]
    });

    expect(value.content.blocks?.[0]?.type).toBe('heading');
    expect(value.actions[0]?.text).toEqual({ i18n: 'navigation.back', fallback: 'Back' });
  });

  it('accepts nested details, list, quote and table blocks', () => {
    const value = parseRenderRequest({
      screen: 'report.complex',
      data: {},
      content: {
        mode: 'rich',
        blocks: [
          {
            type: 'details',
            summary: 'More',
            open: true,
            blocks: [
              {
                type: 'quote',
                credit: 'Ops',
                blocks: [{ type: 'paragraph', text: 'Nested text' }]
              }
            ]
          },
          {
            type: 'list',
            ordered: true,
            items: [
              { text: 'First' },
              { text: 'Second', checked: true }
            ]
          },
          {
            type: 'table',
            bordered: true,
            striped: true,
            caption: 'Summary',
            rows: [
              [
                { text: 'Name', header: true, align: 'left', valign: 'top' },
                { text: 'Value', header: true }
              ],
              [{ text: 'A' }, { text: '1' }]
            ]
          }
        ]
      }
    });

    expect(value.content.blocks).toHaveLength(3);
    expect(value.content.blocks?.[0]?.type).toBe('details');
    expect(value.content.blocks?.[2]?.type).toBe('table');
  });

  it('rejects unsupported button styles', () => {
    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: { mode: 'regular', title: 'x' },
      actions: [{ text: 'x', action: 'x', style: '#ff00ff' }]
    })).toThrow();
  });

  it('rejects invalid rich heading sizes', () => {
    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: {
        mode: 'rich',
        blocks: [{ type: 'heading', text: 'x', size: 7 }]
      }
    })).toThrow();
  });

  it('rejects rich tables wider than Telegram supports', () => {
    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: {
        mode: 'rich',
        blocks: [{
          type: 'table',
          rows: [[...Array.from({ length: 21 }, (_, index) => ({ text: String(index) }))]]
        }]
      }
    })).toThrow();
  });

  it('requires at least one block when rich mode is explicit', () => {
    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: { mode: 'rich' }
    })).toThrow(/rich/i);
  });

  it('rejects more than 500 rich structural units including nested list items and table rows', () => {
    const blocks = Array.from({ length: 5 }, (_, group) => ({
      type: 'details',
      summary: `group-${group}`,
      blocks: Array.from({ length: 100 }, (_, index) => ({
        type: 'paragraph',
        text: `${group}-${index}`
      }))
    }));

    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: { mode: 'rich', blocks }
    })).toThrow(/500/);
  });

  it('rejects rich block nesting deeper than 16 levels', () => {
    let nested: Record<string, unknown> = { type: 'paragraph', text: 'leaf' };

    for (let depth = 0; depth < 16; depth += 1) {
      nested = {
        type: 'details',
        summary: `level-${depth}`,
        blocks: [nested]
      };
    }

    expect(() => parseRenderRequest({
      screen: 'x',
      data: {},
      content: { mode: 'rich', blocks: [nested] }
    })).toThrow(/16/);
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
