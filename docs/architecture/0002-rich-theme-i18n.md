# ADR 0002: Rich Messages, Theme Engine, and i18n stay behind the Runtime composition boundary

## Status

Accepted — 2026-08-08.

## Context

BotUI v0.1 established a stable language-neutral DSL, Regular Telegram HTML renderer, semantic keyboard layout, page/cursor pagination, Telegram RenderPlan compiler, and HTTP adapter.

BotUI v0.2 Phase A adds three cross-cutting concerns:

1. Telegram Bot API 10.2 Rich Messages;
2. reusable brand/theme semantics;
3. locale-aware message and system-label resolution.

These concerns must not make `@botui/core` responsible for application locale registries or Telegram transport, and they must not leak framework-specific objects into the public DSL.

## Decision

### 1. DSL remains protocol version 1

The v0.2 additions are backward-compatible fields:

- `LocalizedText = string | { i18n, fallback? }`;
- `content.blocks` for semantic rich blocks;
- `content.is_rtl`.

Legacy v0.1 requests continue to parse and render unchanged under the default theme.

### 2. i18n resolves translations before surface-specific interpolation

`@botui/i18n` resolves only the translation template when no business data is provided. Runtime passes that template to the chosen renderer.

- Regular messages then use Telegram HTML-safe interpolation.
- Rich Message `RichText` strings use structured plain-text interpolation and do not receive HTML escaping.

This keeps the security rules correct for each Telegram surface.

Fallback order is:

```text
exact locale
  -> base language
  -> configured default locale
  -> LocalizedText.fallback
  -> i18n key
```

### 3. Themes are semantic tokens, not arbitrary colors

`@botui/themes` owns:

- system icons;
- system navigation labels;
- layout density;
- regular-message divider copy;
- default rich heading size.

Themes do not define arbitrary Telegram button HEX/RGB colors. Button styles remain the platform-compatible semantic values `primary`, `success`, `danger`, and `default`.

Built-in themes:

```text
default
business
minimal
luxury
gaming
finance
proxy
```

### 4. Runtime is the composition boundary

Dependency flow:

```text
schema
  |\
  | \-> themes
  |\
  | \-> core <- i18n
  |          \
  |           -> telegram
  |\
  | \-> pagination
  |
  -> runtime -> adapter-http
```

`@botui/runtime` performs the orchestration:

```text
parse DSL
  -> resolve theme
  -> create locale resolver
  -> resolve system actions
  -> choose Regular or Rich renderer
  -> apply theme layout and pagination icons
  -> compile Telegram RenderPlan
```

### 5. Rich DSL is semantic; Telegram field names stay inside rendering/compiler layers

Phase A DSL blocks:

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

The core Rich Renderer maps these to Telegram-neutral blocks using Telegram Bot API 10.2 semantics, including `blockquote`, `pre`, `cells`, `is_bordered`, `is_striped`, `has_checkbox`, `is_checked`, and `is_open`.

### 6. RenderPlan supports Rich send/edit without network access

Telegram compiler operations now include:

```text
sendMessage
sendRichMessage
editMessageText
editMessageReplyMarkup
```

For a Rich Message edit, `editMessageText` carries `rich_message` instead of `text`/`parse_mode`.

## Consequences

- Existing robots can adopt v0.2 without rewriting v0.1 Regular screens.
- A single DSL can render different locales and built-in themes.
- BotUI stays Token-free and transport-free at its core.
- Rich Telegram details remain replaceable behind the compiler boundary.
- SVG/media cards, persistent state, advanced pagination, and framework adapters can be added in later v0.2 sub-phases without changing this composition model.
