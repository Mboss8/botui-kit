# HTTP Adapter 接入规范

`@botui/adapter-http` 用于让 Go、Python、PHP、Java、Rust 或其他语言共享同一套 BotUI Renderer。

它不持有 Telegram Bot Token，也不会主动请求 Telegram。

## 默认接口

```text
GET  /healthz
POST /v1/render
```

业务机器人向 `/v1/render` 提交 BotUI DSL，服务返回 `RenderPlan`。

## 为什么需要服务端共享配置

跨语言机器人不应该每次请求都重复提交完整翻译表和主题定义。

因此 v0.2 支持在启动 HTTP Adapter 时一次配置：

```text
translations
defaultLocale
themeOverrides
custom themes
```

之后 Go/Python/PHP 等客户端只需要提交：

```text
screen
theme
locale
data
content
actions
pagination
```

## Node 启动示例

```js
import { buildServer } from '@botui/adapter-http';

const app = buildServer({
  logger: true,
  renderOptions: {
    defaultLocale: 'zh-CN',
    translations: {
      'zh-CN': {
        'navigation.back': '返回',
        'report.title': '订单报告：{{ customer }}'
      },
      'en-US': {
        'navigation.back': 'Back',
        'report.title': 'Order report: {{ customer }}'
      }
    },
    themeOverrides: {
      rich: {
        defaultHeadingSize: 3
      }
    }
  }
});

await app.listen({ host: '127.0.0.1', port: 8787 });
```

## 客户端请求

```json
{
  "screen": "report.detail",
  "theme": "business",
  "locale": "en-US",
  "data": {
    "customer": "Acme"
  },
  "content": {
    "mode": "rich",
    "blocks": [
      {
        "type": "heading",
        "text": {"i18n":"report.title"}
      }
    ]
  },
  "actions": [
    {
      "text": {"i18n":"navigation.back"},
      "action": "navigation.back",
      "style": "default"
    }
  ]
}
```

客户端不需要知道具体英文/中文文案，也不需要知道 Rich heading 默认 size。

服务端根据 `locale` 与 Theme Engine 统一生成 RenderPlan。

## Go / Python / PHP 的职责边界

客户端只负责：

```text
业务状态
业务数据
用户操作
Telegram Bot Token
最终调用 Telegram Bot API
```

BotUI HTTP Service 负责：

```text
DSL 校验
主题
多语言
Regular/Rich 选择
安全文本插值
按钮布局
分页控制
Telegram Payload / RenderPlan 编译
```

## 安全边界

建议 HTTP Adapter 默认仅监听：

```text
127.0.0.1
或私网地址
```

如果跨主机部署，应由你的网关层负责：

```text
私网 ACL
TLS
认证
限流
审计
```

不要因为 BotUI 本身不保存 Bot Token，就把 `/v1/render` 无限制暴露到公网。

## 错误格式

非法 DSL 当前返回：

```json
{
  "error": {
    "code": "INVALID_RENDER_REQUEST",
    "message": "Invalid BotUI render request"
  }
}
```

业务客户端不需要解析内部 Zod/TypeScript 错误细节。

## 版本兼容

HTTP endpoint 保持：

```text
/v1/render
```

v0.2 的 Rich/Theme/i18n 都是 BotUI DSL v1 的向后兼容扩展，因此没有新增 `/v2/render`。
