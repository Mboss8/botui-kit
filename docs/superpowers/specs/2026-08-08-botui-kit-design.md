# BotUI Kit V1 设计规范

> 日期：2026-08-08  
> 状态：设计基线，待用户最终评审后进入实施计划  
> 仓库：`Mboss8/botui-kit`

## 1. 项目定位

BotUI Kit 是一套面向 Telegram 机器人的**通用 UI/UX 与交互基础设施**。目标不是绑定某一种机器人框架或编程语言，而是建立语言无关的 BotUI DSL、统一渲染规则、统一交互协议和 Telegram 适配层，让后续所有机器人复用同一套消息、按钮、分页、富文本、图文卡片、状态页和导航规范。

业务机器人只负责回答两件事：

1. 当前需要展示哪个 `screen`；
2. 当前 `screen` 的业务 `data` 是什么。

BotUI 负责：

- 消息结构与版式；
- 富文本；
- 图片与媒体卡片；
- 按钮颜色语义；
- 按钮自动布局；
- 返回/首页/关闭等导航；
- 分页；
- 搜索、筛选、排序；
- 确认、选择器、表单、Wizard；
- Loading / Empty / Success / Warning / Error / Retry / Expired 状态；
- Telegram callback 编码；
- Telegram Bot API Payload 编译；
- 多语言；
- 品牌主题；
- 不同机器人框架的适配。

---

## 2. 核心原则

### 2.1 语言无关

BotUI 的长期标准是 **BotUI DSL v1**，而不是 TypeScript、grammY、Python 或 Go 的某个具体 API。

核心实现首选 TypeScript，但调用方可以是：

- TypeScript / JavaScript；
- Go；
- Python；
- PHP；
- Java；
- Rust；
- 任意能调用 HTTP 或 Telegram Bot API 的语言。

### 2.2 不绑定单一 Telegram 框架

Telegram 官方 Bot API 是底层协议标准。

框架仅作为 Adapter：

- grammY Adapter；
- aiogram Adapter；
- Generic HTTP Adapter；
- Raw Telegram Bot API Adapter；
- 后续可增加 Go / Java 专用 Adapter。

### 2.3 默认无状态核心

`core` 默认 Stateless：

```text
Screen + Data + Theme + Locale + Context
                  ↓
              RenderPlan
```

需要会话状态的能力（分页、Wizard、短 callback token、筛选条件等）由独立 `interactions/state` 层承载，可使用：

- 内存；
- SQLite；
- Redis；
- 调用方自定义 StateStore。

V1 不强制依赖外部数据库或 Redis。

### 2.4 Token 默认不进入 BotUI Core

BotUI Core 只生成 RenderPlan / Telegram Payload。

Bot Token 默认由业务机器人持有。这样可以：

- 避免集中保存全部机器人 Token；
- 减少单点故障；
- 方便不同项目独立部署；
- 允许 BotUI 作为纯公共组件使用。

可以另提供可选 `send-service`，但不能成为唯一运行方式。

### 2.5 语义优先，不暴露平台细节

业务模板使用：

```text
primary
success
danger
default
```

而不是依赖某个 Telegram 客户端具体 RGB 值。

Telegram 原生聊天按钮仅允许平台支持的按钮样式，BotUI 不承诺任意 HEX/RGB 背景色。需要完全自定义视觉时，由 Mini App Surface 承担。

---

## 3. 总体架构

```text
业务机器人
   │
   │ screen + data + theme + locale
   ▼
┌─────────────────────────────────┐
│            BotUI DSL            │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│            BotUI Core           │
│ Template / Theme / i18n /       │
│ Layout / Validation / Policy    │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│          Interaction Layer      │
│ Navigation / Pagination /       │
│ Search / Filter / Confirm /     │
│ Wizard / State / Action Router  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│        Telegram Compiler        │
│ Regular / Rich / Media /        │
│ Keyboard / Edit Operations      │
└────────────────┬────────────────┘
                 ▼
             RenderPlan
                 │
       ┌─────────┼──────────┐
       ▼         ▼          ▼
    grammY    aiogram      HTTP
    Adapter    Adapter     Adapter
       │         │          │
       └─────────┴──────────┘
                 ▼
          Telegram Bot API
```

完整自由 UI 走可选 Mini App Surface：

```text
BotUI DSL
   ├─ Chat Surface
   │   ├─ Regular Message
   │   ├─ Rich Message
   │   ├─ Keyboard
   │   └─ Media Card
   └─ Mini App Surface
       └─ HTML/CSS/React UI
```

---

## 4. 建议目录结构

```text
botui-kit/
├── packages/
│   ├── schema/
│   ├── core/
│   ├── telegram/
│   ├── pagination/
│   ├── interactions/
│   ├── media/
│   ├── themes/
│   ├── i18n/
│   ├── adapter-grammy/
│   ├── adapter-aiogram/
│   ├── adapter-http/
│   └── miniapp/                 # 可选
│
├── templates/
│   ├── common/
│   ├── system/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   └── users/
│
├── themes/
│   ├── default/
│   ├── business/
│   ├── minimal/
│   ├── luxury/
│   ├── gaming/
│   ├── finance/
│   └── proxy/
│
├── assets/
│   ├── icons/
│   ├── illustrations/
│   └── cards/
│
├── examples/
│   ├── node/
│   ├── python/
│   ├── go/
│   └── raw-http/
│
├── docs/
│   ├── components/
│   ├── pagination/
│   ├── integration/
│   └── superpowers/specs/
│
├── schema/
│   └── botui-v1.schema.json
│
├── README.md
├── LICENSE
└── package.json
```

---

## 5. BotUI DSL v1

业务层不直接生成 Telegram `sendMessage` 或 `InlineKeyboardMarkup`。

基础调用模型：

```json
{
  "screen": "order.detail",
  "theme": "default",
  "locale": "zh-CN",
  "data": {
    "order_id": "A10086",
    "product": "示例产品",
    "amount": "30 USD",
    "status": "paid"
  }
}
```

Screen 模板示例：

```yaml
screen: order.detail

content:
  mode: auto
  title: "订单详情"
  fields:
    - label: "订单号"
      value: "{{ order_id }}"
    - label: "产品"
      value: "{{ product }}"
    - label: "金额"
      value: "{{ amount }}"
    - label: "状态"
      value: "{{ status }}"

actions:
  - text: "再次购买"
    action: order.buy_again
    style: primary
  - text: "联系客服"
    action: support.open
    style: default
  - text: "返回"
    action: navigation.back
    style: default
```

### 5.1 Render Mode

支持：

```text
auto
regular
rich
media
miniapp
```

`auto` 由渲染策略自动选择。

---

## 6. 消息与富文本系统

### 6.1 Regular Message Renderer

用于：

- 简短提示；
- 成功/失败；
- 简单菜单；
- 订单状态；
- 充值结果；
- 短通知。

V1 默认普通文本渲染格式采用 Telegram HTML，避免业务层自行拼接 Markdown 转义。

### 6.2 Rich Message Renderer

用于：

- 产品说明；
- AI 长回答；
- 帮助中心；
- 复杂订单详情；
- 报表；
- 教程；
- 表格；
- 多媒体说明。

DSL 不直接暴露 Telegram 原始 Rich Message Block 名称，先定义语义组件，再由 Telegram Compiler 映射。

首批组件：

```text
Document
Header
Title
Paragraph
Section
Divider
List
TaskList
Quote
Code
Preformatted
Table
Details
Footer
Photo
Video
Audio
Voice
Collage
Slideshow
```

### 6.3 自动降级

如果目标 Adapter / Bot API 能力不满足 Rich Message，允许降级到：

```text
Rich Message
   ↓
HTML Regular Message
   ↓
Media + Caption
```

不能因为新功能不可用导致业务消息完全发送失败。

---

## 7. 图文与媒体系统

### 7.1 通用媒体类型

```text
Hero
Banner
Thumbnail
Avatar
QRCode
ProductImage
PaymentImage
NoticeImage
GeneratedCard
```

### 7.2 动态卡片

首批公共卡片：

- 余额卡；
- 订单卡；
- 充值卡；
- 产品卡；
- 用户卡；
- 会员卡；
- 公告卡；
- 支付二维码卡；
- 成功卡；
- 错误卡；
- 邀请卡；
- 统计卡。

### 7.3 图像渲染链

默认：

```text
SVG Template
     ↓
resvg
     ↓
PNG/WebP
     ↓
Sharp 后处理
     ↓
Telegram
```

HTML/Playwright Renderer 仅作为可选高级模块，不作为默认依赖。

### 7.4 Telegram file_id 缓存边界

公共资产的源必须是 BotUI 自己管理的 Asset，而不能假设不同 Bot 共享 Telegram `file_id`。

缓存模型：

```text
公共 Asset
   ↓
Bot A 首次上传 → Bot A file_id cache
Bot B 首次上传 → Bot B file_id cache
Bot C 首次上传 → Bot C file_id cache
```

缓存键至少包含：

```text
bot_identity + asset_hash
```

---

## 8. 按钮系统

### 8.1 语义样式

V1：

```text
primary
success
danger
default
```

语义：

- `primary`：当前页面的主要操作；
- `success`：确认、完成、启用等积极动作；
- `danger`：删除、撤销、高风险操作；
- `default`：普通导航和次要操作。

不允许模板依赖具体 RGB/HEX 值。

### 8.2 按钮动作类型

```text
callback
url
webapp
switch_inline
copy
navigation
pagination
submit
```

### 8.3 自动布局

Layout Engine 根据按钮语义、文字长度、优先级和数量自动生成二维键盘。

默认规则：

1. 单个主要按钮独占一行；
2. 两个短按钮可同一行；
3. 长文字按钮优先独占一行；
4. `danger` 操作避免与主要正向操作紧挨造成误触；
5. 导航按钮优先放底部；
6. 分页控制行保持稳定位置；
7. 一页按钮过多时转 Keyboard Pagination；
8. 模板可显式覆盖自动布局。

示例：

```text
[ 立即购买 ]

[ 确认 ] [ 取消 ]

[ 充值 ] [ 提现 ]
[ 订单 ] [ 我的 ]
[ 联系客服 ]
```

---

## 9. Navigation Engine

统一内建动作：

```text
navigation.home
navigation.back
navigation.close
navigation.refresh
navigation.cancel
navigation.confirm
support.open
```

Navigation Context：

```text
NavigationContext
├── current_screen
├── previous_screen
├── stack
├── origin
└── return_target
```

业务模板不负责手工计算“返回到哪里”。

Back Stack 默认按用户/会话隔离。

---

## 10. Pagination Engine

分页是 V1 一级能力，不能简化为两个按钮。

### 10.1 支持的分页类型

```text
Page Pagination
Cursor Pagination
Keyboard Pagination
Content Pagination
Detail Pagination
Search Pagination
Filter Pagination
RichMessage Pagination
```

### 10.2 Page Pagination

适合：

- 固定产品列表；
- 分类；
- 静态帮助目录；
- 中小规模数据。

标准状态：

```text
page
page_size
total_pages
total_items
has_next
has_prev
```

### 10.3 Cursor Pagination

适合：

- 订单流水；
- 充值记录；
- 提现记录；
- 消息记录；
- 实时变化的数据；
- 大规模数据。

标准状态：

```text
cursor
next_cursor
prev_cursor
has_next
has_prev
page_size
```

BotUI 不要求调用方使用特定数据库。

### 10.4 Keyboard Pagination

用于按钮本身过多的场景，例如：

```text
地区
产品分类
节点
服务类型
```

正文可保持不变，仅更新 Reply Markup。

### 10.5 Content Pagination

用于：

- 长教程；
- 帮助中心；
- 协议；
- 公告；
- 长 AI 内容。

### 10.6 Detail Pagination

用于逐项查看：

```text
产品 A → 产品 B → 产品 C
订单 A → 订单 B → 订单 C
用户 A → 用户 B → 用户 C
```

### 10.7 搜索/筛选/排序联动

分页上下文必须携带：

```text
PaginationContext
├── dataset
├── page/cursor
├── page_size
├── filters
├── sort
├── search
├── selected
└── navigation
```

翻页后：

- 搜索条件不能丢；
- 筛选条件不能丢；
- 排序不能丢；
- 已选状态按组件策略保留。

### 10.8 默认分页 UI

```text
[ ⏮ ] [ ◀ ] [ 3/18 ] [ ▶ ] [ ⏭ ]
```

支持精简模式：

```text
[ ◀ 上一页 ] [ 3/18 ] [ 下一页 ▶ ]
```

Cursor 无法可靠知道总页数时：

```text
[ ◀ 上一页 ] [ 下一页 ▶ ]
```

不得伪造不存在的总页数。

### 10.9 原消息更新

分页默认采用：

```text
同一 message_id
   ↓
edit content / edit markup
```

避免聊天刷屏。

### 10.10 并发与乱序保护

Pagination Engine 必须处理快速连续点击：

```text
Callback ACK
Message Lock
Request Sequence
Latest State Wins
Stale Response Drop
```

例如用户先点第 5 页又点第 6 页，第 5 页慢请求后返回时不得覆盖第 6 页。

### 10.11 失效状态

旧分页 Session 过期后统一显示：

```text
页面已失效，内容可能已经发生变化。
[ 重新加载 ] [ 返回首页 ]
```

不向用户暴露内部异常代码。

### 10.12 空状态

当前筛选没有结果时由 Pagination 自动转 `EmptyState`，并可提供：

```text
修改筛选
清除筛选
返回
```

### 10.13 Page Size

支持：

```text
compact       5
normal        8
comfortable  10
dense        15
auto
```

模板可手动指定数值。

---

## 11. Callback / Action Protocol

Telegram callback_data 空间有限，不能把完整业务数据放进按钮。

BotUI 定义短 Action Token：

```text
p:K82ms:n
```

语义示例：

```text
p      = pagination
K82ms  = interaction/session reference
n      = next
```

ActionStore 保存完整上下文：

```json
{
  "screen": "orders.list",
  "actor_id": "555555",
  "page": 8,
  "filters": {
    "status": "paid"
  },
  "sort": "created_desc"
}
```

要求：

- Token 短；
- 有版本；
- 可过期；
- 可校验 actor；
- 可限制 chat；
- 不把敏感数据编码在 callback；
- callback 进入后立即 ACK；
- 重放高风险动作需要幂等/二次确认。

---

## 12. Interaction Engine

V1 组件：

```text
Menu
Navigation
Back Stack
Pagination
Cursor Pagination
Keyboard Pagination
Content Pagination
Detail Pagination
Search
Filter
Sort
Selector
Multi Select
Tabs
Toggle
Confirm
Wizard
Form
Loading
Empty State
Success
Warning
Error
Retry
Refresh
Expired State
```

### 12.1 Confirm

危险操作必须支持二次确认：

```text
Warning Screen
   ↓
Confirm / Cancel
```

### 12.2 Wizard

用于：

```text
创建订单
配置服务
填写资料
多步审批输入
```

Wizard State：

```text
wizard_id
step
values
validation
expires_at
return_target
```

### 12.3 Search / Filter / Sort

统一数据源接口：

```text
query(input) → PageResult / CursorResult
```

BotUI 处理交互；业务层处理查询语义。

---

## 13. 状态页面规范

### Success

```text
✅ 操作成功

你的操作已经完成。
```

### Error

```text
❌ 操作失败

暂时无法完成本次操作，请稍后重试。
```

### Warning

```text
⚠️ 请确认

该操作可能产生不可逆影响。
```

### Loading

```text
⏳ 正在处理

正在获取数据，请稍候…
```

### Empty

```text
📭 暂无记录

这里暂时没有内容。
```

### Expired

```text
⌛ 页面已失效

内容可能已经发生变化，请重新加载。
```

所有具体文案允许主题和 locale 覆盖。

---

## 14. Theme Engine

主题不是任意改变 Telegram 客户端原生按钮颜色，而是控制**语义、文案、Emoji、素材、图像卡片和布局策略**。

主题结构示例：

```yaml
id: default

brand:
  name: BotUI
  logo: assets/logo.svg

emoji:
  success: "✅"
  error: "❌"
  warning: "⚠️"
  money: "💰"
  order: "📋"

buttons:
  primary: primary
  success: success
  danger: danger
  default: default

navigation:
  home: "🏠 首页"
  back: "⬅️ 返回"
  support: "🎧 联系客服"

layout:
  density: normal
  nav_position: bottom
```

V1 计划内置：

```text
default
business
minimal
luxury
gaming
finance
proxy
```

---

## 15. i18n

默认 locale：`zh-CN`。

模板中的结构和文案 key 分离：

```text
screen.order.title
state.success.title
navigation.back
pagination.next
```

Fallback：

```text
requested locale
   ↓
project default locale
   ↓
zh-CN
```

禁止因为翻译缺失导致整个 Screen 渲染失败。

---

## 16. RenderPlan

BotUI Core 的稳定输出不是“单条 Message”，而是 RenderPlan。

示例：

```json
{
  "operations": [
    {
      "type": "edit_message",
      "target": "current",
      "content": {}
    },
    {
      "type": "edit_keyboard",
      "target": "current",
      "keyboard": {}
    }
  ]
}
```

支持操作：

```text
send_message
send_media
send_rich_message
edit_message
edit_caption
edit_keyboard
delete_message
answer_callback
open_webapp
noop
```

Adapter 把 RenderPlan 转换为具体框架调用。

---

## 17. Adapter 边界

### adapter-grammy

负责：

- grammY Context 映射；
- RenderPlan 执行；
- callback ACK；
- Telegram 错误映射。

### adapter-aiogram

同等能力，不改变 DSL。

### adapter-http

提供语言无关调用：

```text
POST /v1/render
POST /v1/actions/resolve
POST /v1/interactions/dispatch
```

### raw Telegram adapter

用于不希望引入框架的项目。

---

## 18. API 与版本化

采用 SemVer：

```text
BotUI DSL v1
Core 1.x
Telegram Adapter 1.x
Pagination 1.x
```

稳定性原则：

- `1.x` 内不得破坏已发布 DSL；
- 新字段默认 Optional；
- Deprecated 至少跨一个 Minor 周期；
- Adapter 可独立升级；
- Telegram 新 API 优先在 Compiler 层吸收，不迫使业务模板变化。

---

## 19. 错误处理

错误分三层：

### Schema Error

开发阶段直接失败，明确指出模板字段问题。

### Render Error

尝试安全降级：

```text
Rich → Regular → Plain
Media Card → Text
```

### Runtime / Telegram Error

Adapter 转换为统一错误类型：

```text
Retryable
RateLimited
MessageNotModified
MessageGone
PermissionDenied
InvalidTarget
ExpiredInteraction
Fatal
```

用户层只能看到可理解的状态页，不能看到底层堆栈、Bot API 错误码或 Token。

---

## 20. 安全边界

必须满足：

- 不提交 Bot Token；
- 不提交生产密钥；
- callback 不包含敏感业务数据；
- Action Session 有 TTL；
- 高风险动作支持 actor 绑定；
- 高风险动作支持幂等 key；
- HTML/模板变量统一 escape；
- URL / WebApp URL 可配置 allowlist；
- Media URL 支持协议和域名策略；
- 日志默认隐藏凭据；
- BotUI Core 不默认持有用户业务数据库权限。

---

## 21. 测试策略

### Schema Tests

- 合法模板；
- 非法模板；
- 版本兼容。

### Snapshot Tests

对以下输出做快照：

- Regular Message；
- Rich Message；
- Keyboard；
- Pagination；
- Media Card；
- Theme。

### Pagination Tests

必须覆盖：

- 第一页；
- 中间页；
- 最后一页；
- 空结果；
- Cursor 无总页数；
- 条件变更后重新分页；
- 快速连续点击；
- 慢请求乱序；
- 过期 session；
- callback 重放。

### Adapter Contract Tests

同一个 DSL Fixture 在不同 Adapter 上的语义必须一致。

### Telegram Sandbox Tests

正式发布前使用专用测试 Bot 验证真实客户端行为。

---

## 22. V1 非目标

V1 暂不做：

- 机器人业务数据库；
- 支付业务逻辑；
- 用户权限业务模型；
- 通用 CRM；
- 业务订单系统；
- 完整可视化拖拽编辑器；
- 自建 Telegram Bot API Server；
- 强制中央化 Bot Token 管理。

这些能力可以调用 BotUI，但不能污染 UI Core。

---

## 23. V1 交付边界

V1 必须可以完成：

1. 定义 BotUI DSL；
2. JSON Schema 校验；
3. Regular Message 渲染；
4. Rich Message 渲染；
5. Inline Keyboard；
6. semantic button style；
7. 自动按钮布局；
8. Navigation；
9. 完整 Pagination Engine；
10. Search/Filter/Sort 分页上下文；
11. Confirm；
12. Selector；
13. Wizard 基础状态机；
14. Success/Error/Warning/Loading/Empty/Expired；
15. SVG 动态卡片基础能力；
16. Theme Engine；
17. zh-CN i18n；
18. Action Protocol；
19. RenderPlan；
20. grammY Adapter；
21. HTTP Adapter；
22. Python/Go/Raw HTTP 调用示例；
23. 测试与文档。

aiogram Adapter 可以在 V1 后半段完成，但 DSL 和 Adapter Contract 必须从一开始兼容。

---

## 24. 成功标准

任意新机器人接入时，不再重新设计：

- 首页；
- 返回；
- 菜单；
- 颜色语义；
- 按钮排版；
- 分页；
- 成功失败页；
- 富文本；
- 图片卡片；
- callback 编码；
- 搜索筛选分页；
- 多语言基础。

理想调用体验：

```text
screen = "orders.list"
data   = business.query(...)
result = botui.render(screen, data)
adapter.execute(result)
```

或者跨语言：

```text
POST /v1/render
{
  "screen": "orders.list",
  "theme": "default",
  "locale": "zh-CN",
  "data": {...}
}
```

业务代码中不再出现大段 Telegram HTML、键盘二维数组、分页按钮拼接、Rich Message 原始 block、callback_data 拼接和重复状态页文案。

---

## 25. 后续实施顺序建议

设计评审通过后再写正式实施计划。建议实施顺序：

```text
Phase 1  Schema + Core + RenderPlan
Phase 2  Telegram Regular + Keyboard
Phase 3  Action Protocol + StateStore
Phase 4  Pagination Engine
Phase 5  Navigation + Search/Filter/Sort
Phase 6  Rich Message
Phase 7  Theme + i18n
Phase 8  SVG Media Cards
Phase 9  grammY + HTTP Adapter
Phase 10 Examples + Integration Tests
Phase 11 aiogram Adapter
Phase 12 Mini App Surface（后续独立里程碑）
```

---

## 26. 当前设计决策摘要

已确定：

- 核心实现优先 TypeScript；
- 标准是语言无关 DSL，而不是某个 TS 框架；
- Telegram Bot API 为底层协议；
- grammY/aiogram 都是 Adapter；
- 普通消息与 Rich Message 并存；
- 图片卡片默认 SVG → resvg → Sharp；
- Telegram 原生按钮只采用平台支持的语义样式，不承诺任意颜色；
- Pagination 是一级模块；
- Page + Cursor 两类数据分页都必须支持；
- 分页默认编辑原消息；
- 搜索/筛选/排序必须与分页上下文绑定；
- callback 使用短 Action Token；
- 默认不集中托管 Bot Token；
- Core 默认 Stateless；
- Stateful 功能通过可插拔 StateStore 提供；
- V1 默认简体中文，同时保留完整 i18n 架构。

本文件作为 BotUI Kit V1 的设计基线。用户确认本规范后，下一步创建详细实施计划，再开始编写生产代码。
