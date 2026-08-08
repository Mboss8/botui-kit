import { describe, expect, it } from 'vitest';
import { parseRenderRequest } from '@botui/schema';
import { renderRich } from './render-rich.js';

describe('renderRich', () => {
  it('renders the supported semantic blocks to Telegram-neutral rich blocks', () => {
    const request = parseRenderRequest({
      screen: 'report.detail',
      locale: 'zh-CN',
      data: {
        customer: '<Acme & Co>',
        total: '100 USD'
      },
      content: {
        mode: 'rich',
        is_rtl: true,
        blocks: [
          { type: 'heading', text: '报告：{{ customer }}' },
          { type: 'paragraph', text: '金额：{{ total }}' },
          { type: 'preformatted', text: 'const total = 100;', language: 'typescript' },
          { type: 'divider' },
          {
            type: 'quote',
            credit: 'Ops',
            blocks: [{ type: 'paragraph', text: '稳定运行' }]
          },
          {
            type: 'list',
            ordered: true,
            items: [
              { text: '第一项' },
              { text: '第二项', checked: true }
            ]
          },
          {
            type: 'table',
            bordered: true,
            striped: true,
            caption: '汇总',
            rows: [
              [
                { text: '项目', header: true, align: 'left', valign: 'top' },
                { text: '金额', header: true }
              ],
              [
                { text: '合计', colspan: 1 },
                { text: '{{ total }}' }
              ]
            ]
          },
          {
            type: 'details',
            summary: '更多信息',
            open: true,
            blocks: [{ type: 'paragraph', text: '客户：{{ customer }}' }]
          },
          { type: 'footer', text: 'BotUI' }
        ]
      }
    });

    const rendered = renderRich(request, { defaultHeadingSize: 3 });

    expect(rendered.format).toBe('rich');
    expect(rendered.richMessage.is_rtl).toBe(true);
    expect(rendered.richMessage.blocks).toEqual([
      { type: 'heading', text: '报告：&lt;Acme &amp; Co&gt;', size: 3 },
      { type: 'paragraph', text: '金额：100 USD' },
      { type: 'pre', text: 'const total = 100;', language: 'typescript' },
      { type: 'divider' },
      {
        type: 'blockquote',
        blocks: [{ type: 'paragraph', text: '稳定运行' }],
        credit: 'Ops'
      },
      {
        type: 'list',
        items: [
          {
            blocks: [{ type: 'paragraph', text: '第一项' }],
            value: 1,
            type: '1'
          },
          {
            blocks: [{ type: 'paragraph', text: '第二项' }],
            has_checkbox: true,
            is_checked: true,
            value: 2,
            type: '1'
          }
        ]
      },
      {
        type: 'table',
        cells: [
          [
            { text: '项目', is_header: true, align: 'left', valign: 'top' },
            { text: '金额', is_header: true }
          ],
          [
            { text: '合计' },
            { text: '100 USD' }
          ]
        ],
        is_bordered: true,
        is_striped: true,
        caption: '汇总'
      },
      {
        type: 'details',
        summary: '更多信息',
        blocks: [{ type: 'paragraph', text: '客户：&lt;Acme &amp; Co&gt;' }],
        is_open: true
      },
      { type: 'footer', text: 'BotUI' }
    ]);
  });

  it('uses a supplied localized resolver before business-data interpolation', () => {
    const request = parseRenderRequest({
      screen: 'report.localized',
      locale: 'en-US',
      data: { customer: '<Alice>' },
      content: {
        mode: 'rich',
        blocks: [
          { type: 'heading', text: { i18n: 'report.title', fallback: '报告 {{ customer }}' }, size: 2 },
          { type: 'paragraph', text: { i18n: 'report.body', fallback: '客户 {{ customer }}' } }
        ]
      }
    });

    const dictionary = new Map([
      ['report.title', 'Report {{ customer }}'],
      ['report.body', 'Customer {{ customer }}']
    ]);

    const rendered = renderRich(request, {
      resolveText(value) {
        if (typeof value === 'string') return value;
        return dictionary.get(value.i18n) ?? value.fallback ?? value.i18n;
      }
    });

    expect(rendered.richMessage.blocks).toEqual([
      { type: 'heading', text: 'Report &lt;Alice&gt;', size: 2 },
      { type: 'paragraph', text: 'Customer &lt;Alice&gt;' }
    ]);
  });

  it('omits false-only Telegram flags and optional values that have no effect', () => {
    const request = parseRenderRequest({
      screen: 'report.compact',
      data: {},
      content: {
        mode: 'rich',
        is_rtl: false,
        blocks: [
          {
            type: 'list',
            items: [{ text: 'unchecked', checked: false }]
          },
          {
            type: 'table',
            bordered: false,
            striped: false,
            rows: [[{ text: 'x', colspan: 1, rowspan: 1 }]]
          },
          {
            type: 'details',
            summary: 'closed',
            open: false,
            blocks: [{ type: 'paragraph', text: 'hidden' }]
          }
        ]
      }
    });

    const rendered = renderRich(request);

    expect(rendered.richMessage).not.toHaveProperty('is_rtl');
    expect(rendered.richMessage.blocks).toEqual([
      {
        type: 'list',
        items: [
          {
            blocks: [{ type: 'paragraph', text: 'unchecked' }],
            has_checkbox: true
          }
        ]
      },
      {
        type: 'table',
        cells: [[{ text: 'x' }]]
      },
      {
        type: 'details',
        summary: 'closed',
        blocks: [{ type: 'paragraph', text: 'hidden' }]
      }
    ]);
  });
});
