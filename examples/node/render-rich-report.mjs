import { render } from '../../packages/runtime/dist/index.js';

const request = {
  screen: 'orders.report',
  theme: 'business',
  locale: 'en-US',
  data: {
    customer: '<Acme & Co>',
    total: '100 USD'
  },
  content: {
    mode: 'auto',
    blocks: [
      { type: 'heading', text: { i18n: 'report.title', fallback: '订单报告：{{ customer }}' } },
      { type: 'paragraph', text: { i18n: 'report.total', fallback: '金额：{{ total }}' } },
      {
        type: 'table',
        bordered: true,
        striped: true,
        rows: [
          [
            { text: { i18n: 'report.column.item', fallback: '项目' }, header: true },
            { text: { i18n: 'report.column.value', fallback: '数值' }, header: true }
          ],
          [
            { text: { i18n: 'report.row.total', fallback: '合计' } },
            { text: '{{ total }}' }
          ]
        ]
      },
      {
        type: 'details',
        summary: { i18n: 'report.details', fallback: '更多信息' },
        blocks: [
          { type: 'paragraph', text: { i18n: 'report.customer', fallback: '客户：{{ customer }}' } }
        ]
      }
    ]
  },
  actions: [
    { text: { i18n: 'navigation.back', fallback: '返回' }, action: 'navigation.back', style: 'default' }
  ]
};

const translations = {
  'en-US': {
    'report.title': 'Order report: {{ customer }}',
    'report.total': 'Amount: {{ total }}',
    'report.column.item': 'Item',
    'report.column.value': 'Value',
    'report.row.total': 'Total',
    'report.details': 'More details',
    'report.customer': 'Customer: {{ customer }}',
    'navigation.back': 'Back'
  }
};

console.log(JSON.stringify(render(request, {
  chatId: 555555,
  translations
}), null, 2));
