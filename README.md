# BotUI Kit

BotUI Kit 是一套面向 Telegram 机器人的**语言无关 UI/UX 与交互基础设施**。业务代码只负责提供 `screen + data + actions + pagination`，BotUI 统一处理消息结构、富文本、主题、多语言、按钮布局、分页和 Telegram RenderPlan 编译。

> 当前开发版本：`0.2.0` Phase A。v0.1 Foundation 已在 `main`；本阶段在不破坏 BotUI DSL v1 的前提下加入 Rich Message、Theme Engine 和 i18n。

## 设计目标

以后任何机器人，无论使用 Node.js、Go、Python、PHP、Java 还是其他语言，都不需要重复实现：

```text
消息排版
富文本
按钮语义样式
按钮自动布局
分页
系统返回/首页
品牌主题
多语言
Telegram Payload 编译
```

业务程序只需要决定：

```text
现在显示哪个 screen？
这个 screen 的业务 data 是什么？
```

## 核心原则

- **语言无关**：长期公共契约是 BotUI DSL / RenderPlan，而不是 grammY、aiogram 或某一种语言。
- **Token-Free Core**：核心渲染链不保存 Bot Token，也不会主动请求 Telegram。
- **DSL v1 向后兼容**：v0.2 新能力通过可选字段扩展，v0.1 Regular 请求继续可用。
- **平台语义化**：按钮使用 `primary | success | danger | default`，不承诺任意 HEX/RGB Telegram 聊天按钮颜色。
- **分页一级能力**：Page / Cursor 分页由独立 Pagination Engine 负责。
- **两套文本安全规则**：Regular 使用 Telegram HTML-safe 插值；RichText String 使用结构化纯文本插值。
- **短回调协议**：分页 Action Codec 强制检查 Telegram `callback_data` 的 64 UTF-8 bytes 上限。

## 包结构

| Package | 职责 |
|---|---|
| `@botui/schema` | BotUI DSL v1、LocalizedText、Rich Blocks 校验与类型 |
| `@botui/core` | Regular Renderer、Rich Renderer、文本插值、按钮布局 |
| `@botui/i18n` | locale fallback、翻译注册表与 LocalizedText 解析 |
| `@botui/themes` | 内置主题、语义 Token、主题覆盖与校验 |
| `@botui/pagination` | Page/Cursor 控件、主题化分页图标、短 Action Codec |
| `@botui/telegram` | Telegram Inline Keyboard 与 Regular/Rich RenderPlan 编译 |
| `@botui/runtime` | 对外统一 `render()` 组合层 |
| `@botui/adapter-http` | `GET /healthz`、`POST /v1/render` 跨语言 HTTP API |

## 环境

- Node.js `>= 24`
- pnpm `10.17.0`

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## 1. Regular Message

原有 v0.1 DSL 保持兼容：

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
  ]
}
```

Regular Message 使用 Telegram HTML，业务数据插值会执行 HTML 转义。

## 2. LocalizedText / i18n

凡是 DSL 中支持文本的位置，都可以使用普通字符串：

```json
"text": "返回"
```

也可以使用：

```json
{
  "i18n": "navigation.back",
  "fallback": "返回"
}
```

支持位置包括：

```text
按钮文字
标题
正文
字段 label/value
footer
Rich Block text/summary/caption/credit
```

### locale fallback 顺序

```text
精确 locale
  ↓
基础语言
  ↓
配置的 defaultLocale
  ↓
LocalizedText.fallback
  ↓
i18n key
```

例如：

```text
zh-HK
 ↓
zh
 ↓
zh-CN
 ↓
fallback
 ↓
key
```

### Runtime 注入翻译

```js
const plan = render(request, {
  translations: {
    'zh-CN': {
      'report.title': '订单报告：{{ customer }}',
      'navigation.back': '返回'
    },
    'en-US': {
      'report.title': 'Order report: {{ customer }}',
      'navigation.back': 'Back'
    }
  }
});
```

同一份 DSL 可以通过 `locale` 输出不同语言，不改变业务 `data`。

## 3. Rich Message

使用：

```json
{
  "content": {
    "mode": "rich",
    "blocks": [
      {
        "type": "heading",
        "text": "订单报告：{{ customer }}"
      },
      {
        "type": "paragraph",
        "text": "状态：已完成"
      },
      {
        "type": "divider"
      },
      {
        "type": "table",
        "bordered": true,
        "striped": true,
        "rows": [
          [
            {"text": "项目", "header": true},
            {"text": "金额", "header": true}
          ],
          [
            {"text": "合计"},
            {"text": "{{ total }}"}
          ]
        ]
      }
    ]
  }
}
```

Phase A 支持的语义 Rich Blocks：

```text
heading
paragraph
preformatted
footer
divider
quote
list
table
details
```

### Rich 自动选择

```json
{
  "content": {
    "mode": "auto",
    "blocks": [
      {"type": "paragraph", "text": "内容"}
    ]
  }
}
```

只要 `mode=auto` 且存在 Rich Blocks，Runtime 自动选择 Rich Renderer。

### Regular 与 Rich 的转义区别

Regular Message：

```text
Template
  ↓
Telegram HTML-safe interpolation
```

Rich Message：

```text
Semantic Rich Block
  ↓
structured plain-text interpolation
```

RichText String 本身不是 HTML 字符串，因此 BotUI 不会错误地把 `<Acme>` 变成可见的 `&lt;Acme&gt;`。

## 4. Theme Engine

内置主题：

```text
default
business
minimal
luxury
gaming
finance
proxy
```

主题控制的是**语义 Token**，不是任意 Telegram 按钮颜色。

当前主题 Token：

```text
icons
  success/error/warning
  home/back
  first/previous/next/last/refresh

labels
  home/back
  first/previous/next/last/refresh

layout
  maxPerRow
  longTextThreshold

regular
  divider

rich
  defaultHeadingSize
```

调用：

```json
{
  "theme": "minimal"
}
```

也可以在 Runtime 层做局部覆盖：

```js
render(request, {
  themeOverrides: {
    labels: {
      back: '退回'
    },
    layout: {
      maxPerRow: 1
    },
    regular: {
      divider: '***'
    }
  }
});
```

未覆盖的 Token 自动继承基础主题。

## 5. 按钮系统

语义样式：

```text
primary
success
danger
default
```

自动布局规则：

1. `primary` 独占一行；
2. `danger` 独占一行，降低误触；
3. 两个普通短按钮可同行；
4. 长按钮自动独占一行；
5. `navigation.*` 自动沉到底部；
6. 系统 `navigation.back/home` 可由 Theme + i18n 统一接管文案；
7. 分页控制使用主题图标并保持稳定控制行。

## 6. Pagination Engine

### Page Pagination

```json
{
  "pagination": {
    "mode": "page",
    "session": "ORD",
    "page": 3,
    "page_size": 8,
    "total_pages": 10,
    "total_items": 79
  }
}
```

默认主题：

```text
[ ⏮ ] [ ◀️ ] [ 3/10 ] [ ▶️ ] [ ⏭ ]
```

`minimal` 主题可以自动变为：

```text
[ « ] [ ‹ ] [ 3/10 ] [ › ] [ » ]
```

第一页和最后一页自动去掉不可能执行的方向。

### Cursor Pagination

```json
{
  "pagination": {
    "mode": "cursor",
    "session": "LOG",
    "cursor": "c_02",
    "prev_cursor": "c_01",
    "next_cursor": "c_03",
    "has_prev": true,
    "has_next": true,
    "page_size": 20
  }
}
```

适合订单流水、充值记录、日志、消息记录等实时变化集合。

### Action Token

```text
v1:p:<session>:<op>
```

Codec 按 UTF-8 字节数检查 Telegram `callback_data` 的 64-byte 上限。

## 7. RenderPlan

当前操作类型：

```text
sendMessage
sendRichMessage
editMessageText
editMessageReplyMarkup
```

Regular 发送：

```json
{
  "type": "sendMessage",
  "payload": {
    "text": "...",
    "parse_mode": "HTML"
  }
}
```

Rich 发送：

```json
{
  "type": "sendRichMessage",
  "payload": {
    "rich_message": {
      "blocks": []
    }
  }
}
```

Rich 原消息更新仍使用 `editMessageText`，但 payload 中携带 `rich_message`，而不是 `text/parse_mode`。

## 8. 直接调用 Runtime

Regular 示例：

```bash
pnpm build
node examples/node/render-order.mjs
```

Rich + Theme + i18n 示例：

```bash
pnpm build
node examples/node/render-rich-report.mjs
```

`render()` 只返回 RenderPlan，不发送 Telegram 消息：

```js
import { render } from './packages/runtime/dist/index.js';

const plan = render(request, {
  chatId: 555555,
  translations,
  themeOverrides
});
```

## 9. HTTP Adapter

启动：

```bash
pnpm build
node examples/node/http-server.mjs
```

默认监听：

```text
127.0.0.1:8787
```

接口保持不变：

```text
GET  /healthz
POST /v1/render
```

v0.2 Rich DSL 不需要增加新 endpoint，仍走 `/v1/render`。

示例：

```bash
bash examples/raw-http/render-order.sh
bash examples/raw-http/render-rich-report.sh
```

HTTP Adapter 不需要 Bot Token，也不会主动访问 Telegram。

## 10. 安全边界

- 不保存 Telegram Bot Token；
- 不连接数据库；
- 不强制依赖 Redis；
- 不执行模板中的 JavaScript；
- 不使用 `eval`；
- Regular 插入 Telegram HTML 的业务数据执行转义；
- RichText String 保持结构化纯文本语义；
- Callback 长度执行硬校验；
- 主题只能改变 UI Token，不能修改业务数据；
- HTTP Adapter 对非法 DSL 返回稳定的 `400 INVALID_RENDER_REQUEST`。

## 11. 版本策略

```text
BotUI DSL              v1
Callback Protocol      v1
Packages                SemVer
当前开发版本            0.2.0
```

破坏 DSL 或 Callback 兼容性的变化必须提升协议版本；新增向后兼容字段只提升 Package SemVer。

## 12. v0.2 后续子阶段

Phase A 完成 Rich Message + Theme + i18n 后，继续拆分实现：

```text
SVG / resvg / Sharp Media Cards
Navigation Back Stack
StateStore (Memory / SQLite / Redis / Custom)
Search / Filter / Sort
Keyboard Pagination
Content Pagination
Detail Pagination
grammY Adapter
aiogram Adapter
Mini App Surface
```

相关设计与实施记录：

```text
docs/superpowers/specs/
docs/superpowers/plans/
docs/architecture/
```
