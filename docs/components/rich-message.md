# Rich Message 组件规范

BotUI v0.2 Phase A 将 Telegram Rich Message 作为一级消息表面，但业务模板仍使用 BotUI 的语义 DSL，而不是直接拼 Telegram 原始 JSON。

## 支持的 Rich Blocks

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

BotUI Core 会映射为 Telegram Bot API 10.2 的结构化块：

```text
heading      -> heading
paragraph    -> paragraph
preformatted -> pre
footer       -> footer
divider      -> divider
quote        -> blockquote
list         -> list
table        -> table
details      -> details
```

## 平台硬限制

BotUI 在发送前主动执行 Telegram Rich Message 结构限制，避免把平台错误留给业务机器人处理。

当前固定校验：

```text
最大 Rich 文本字符数     32,768
最大结构单元数           500
最大嵌套层级             16
Table 最大列数            20
```

其中 500 个结构单元不仅计算顶层 `blocks`，还计算嵌套 `quote/details`、列表项生成的结构，以及 Table 行等 Telegram 会计入 Rich Message 复杂度的单位。

显式：

```json
{"mode":"rich"}
```

必须至少包含一个 Rich Block。

## 文本安全模型

Regular Message 与 Rich Message 使用不同的文本安全规则。

### Regular Message

Regular 使用 Telegram HTML：

```text
LocalizedText
   ↓
translation template
   ↓
HTML-safe interpolation
   ↓
sendMessage.parse_mode = HTML
```

例如业务数据：

```text
<Acme & Co>
```

在 Regular HTML 中会转义为：

```text
&lt;Acme &amp; Co&gt;
```

### Rich Message

RichText String 是结构化纯文本，不经过 HTML parser：

```text
LocalizedText
   ↓
translation template
   ↓
plain interpolation
   ↓
InputRichMessage.blocks
```

同样的业务数据：

```text
<Acme & Co>
```

会作为普通文字原样进入 RichText，不会被错误地显示成 `&lt;Acme &amp; Co&gt;`。

## 自动选择

```json
{
  "content": {
    "mode": "auto",
    "blocks": [
      {"type":"paragraph","text":"内容"}
    ]
  }
}
```

当 `mode=auto` 且 `blocks` 非空时，Runtime 自动选择 Rich Renderer。

否则继续使用 Regular Renderer。

## RenderPlan

Rich 新消息：

```json
{
  "type": "sendRichMessage",
  "payload": {
    "chat_id": 555555,
    "rich_message": {
      "blocks": []
    },
    "reply_markup": {
      "inline_keyboard": []
    }
  }
}
```

Rich 原消息更新继续使用 Telegram `editMessageText`：

```json
{
  "type": "editMessageText",
  "payload": {
    "chat_id": 555555,
    "message_id": 100,
    "rich_message": {
      "blocks": []
    }
  }
}
```

Rich edit 不同时发送 `text` 或 `parse_mode`。

## i18n 示例

```json
{
  "type": "heading",
  "text": {
    "i18n": "report.title",
    "fallback": "订单报告：{{ customer }}"
  }
}
```

Runtime 先选择语言模板，再由 Rich Renderer 执行业务变量的纯文本插值。

## Theme 示例

如果 heading 没有显式 `size`：

```json
{"type":"heading","text":"订单报告"}
```

将使用主题：

```text
rich.defaultHeadingSize
```

主题只能改变 UI 语义 Token，不能改业务数据。
