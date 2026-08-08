# BotUI Kit

BotUI Kit 是一套面向 Telegram 机器人的**语言无关 UI/UX 与交互基础设施**。业务代码只提供 `screen + data + actions + pagination`，BotUI 负责安全文本渲染、按钮布局、分页、Telegram Payload 编译和跨语言调用。

> 当前版本：`0.1.0` Foundation。当前仓库已经实现 V1 的基础闭环；Rich Message 高阶块、SVG 图文卡片、主题包、i18n、持久化 StateStore、grammY/aiogram 专用 Adapter 和 Mini App Surface 属于后续迭代。

## 核心原则

- **语言无关**：长期公共契约是 BotUI DSL / RenderPlan，而不是某个 Telegram 框架。
- **Token-Free Core**：核心渲染链不保存 Bot Token，也不会主动请求 Telegram。
- **平台语义化**：按钮使用 `primary | success | danger | default`，不向业务层承诺任意 HEX/RGB。
- **分页一级能力**：Page / Cursor 分页由独立 Pagination Engine 负责。
- **安全模板**：业务数据插值会进行 Telegram HTML 转义，不使用 `eval`。
- **短回调协议**：分页 Action Codec 强制检查 Telegram `callback_data` 的 64 UTF-8 bytes 上限。

## 包结构

| Package | 职责 |
|---|---|
| `@botui/schema` | BotUI DSL v1 校验与类型 |
| `@botui/core` | HTML 转义、模板插值、Regular Renderer、按钮布局 |
| `@botui/pagination` | Page/Cursor 控件与短 Action Codec |
| `@botui/telegram` | Telegram Inline Keyboard 与 RenderPlan 编译 |
| `@botui/runtime` | 对外 `render()` 组合层 |
| `@botui/adapter-http` | `GET /healthz`、`POST /v1/render` HTTP API |

`@botui/runtime` 单独作为组合层，避免 `core <-> telegram` 循环依赖。

## 环境

- Node.js `>= 24`
- pnpm `10.17.0`

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## 最小 DSL

```json
{
  "screen": "orders.list",
  "theme": "default",
  "locale": "zh-CN",
  "data": {
    "customer": "示例客户"
  },
  "content": {
    "mode": "regular",
    "title": "订单中心",
    "text": "客户：{{ customer }}"
  },
  "actions": [
    {
      "text": "新建订单",
      "action": "order.create",
      "style": "primary"
    },
    {
      "text": "返回",
      "action": "navigation.back",
      "style": "default"
    }
  ],
  "pagination": {
    "mode": "page",
    "session": "ORD",
    "page": 2,
    "page_size": 8,
    "total_pages": 3,
    "total_items": 18
  }
}
```

## 直接调用 Runtime

先执行：

```bash
pnpm build
node examples/node/render-order.mjs
```

`render()` 返回 RenderPlan，不发送消息：

```js
import { render } from './packages/runtime/dist/index.js';

const plan = render(request, {
  chatId: 555555
});
```

Adapter 可以把 `operations` 交给 grammY、aiogram、Go/PHP/Java 自己的 Telegram 客户端或原始 Bot API。

## HTTP Adapter

构建后运行示例服务：

```bash
pnpm build
node examples/node/http-server.mjs
```

默认监听：

```text
127.0.0.1:8787
```

接口：

```text
GET  /healthz
POST /v1/render
```

HTTP Adapter 只返回 RenderPlan，不需要 Bot Token。Python、Go 和 curl 示例位于：

```text
examples/python/render_order.py
examples/go/main.go
examples/raw-http/render-order.sh
```

## 按钮布局规则

1. `primary` 独占一行；
2. `danger` 独占一行，降低误触；
3. 两个普通短按钮可同行；
4. 长按钮自动独占一行；
5. `navigation.*` 自动移动到底部；
6. 分页控制单独占稳定控制行；
7. `default` 不向 Telegram 写入 `style` 字段；`primary/success/danger` 会映射语义样式。

## 分页

### Page Pagination

```json
{
  "mode": "page",
  "session": "ORD",
  "page": 3,
  "page_size": 8,
  "total_pages": 10,
  "total_items": 79
}
```

中间页控制：

```text
[ ⏮ ] [ ◀️ ] [ 3/10 ] [ ▶️ ] [ ⏭ ]
```

第一页和最后一页会自动移除不可能执行的方向。

### Cursor Pagination

```json
{
  "mode": "cursor",
  "session": "LOG",
  "cursor": "c_02",
  "prev_cursor": "c_01",
  "next_cursor": "c_03",
  "has_prev": true,
  "has_next": true,
  "page_size": 20
}
```

适用于订单流水、消息记录、日志等实时变化或大数据集合。

### Action Token

分页按钮使用：

```text
v1:p:<session>:<op>
```

例如：

```text
v1:p:ORD8K2:n
```

Codec 会按 UTF-8 字节数检查 64-byte 上限。

## 安全边界

- 不保存 Telegram Bot Token；
- 不连接数据库；
- 不依赖 Redis；
- 不执行模板中的 JavaScript；
- 不使用 `eval`；
- 对插入 Telegram HTML 的业务数据执行转义；
- 对 Callback 长度执行硬校验；
- HTTP Adapter 对非法 DSL 返回稳定的 `400 INVALID_RENDER_REQUEST`。

## RenderPlan

当前支持：

```text
sendMessage
editMessageText
editMessageReplyMarkup
```

因此分页、刷新和菜单切换可以优先编辑原消息，避免聊天窗口刷屏。

## 版本策略

- BotUI DSL：`version: "1"`
- npm packages：SemVer
- Callback Action Protocol：`v1`
- 破坏 DSL 或 Callback 兼容性的变化必须提升协议版本。

## 下一阶段

```text
Rich Message Renderer
Theme Engine
I18n
SVG / resvg / Sharp Media Cards
Navigation Back Stack
StateStore (Memory / SQLite / Redis / Custom)
Search / Filter / Sort
Keyboard Pagination / Detail Pagination / Content Pagination
grammY Adapter
aiogram Adapter
Mini App Surface
```

设计基线与实施计划位于：

```text
docs/superpowers/specs/
docs/superpowers/plans/
```
