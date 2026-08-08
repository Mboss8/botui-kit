import { render } from '../../packages/runtime/dist/index.js';

const request = {
  screen: 'orders.list',
  theme: 'default',
  locale: 'zh-CN',
  data: { customer: '示例客户' },
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
};

console.log(JSON.stringify(render(request, { chatId: 555555 }), null, 2));
