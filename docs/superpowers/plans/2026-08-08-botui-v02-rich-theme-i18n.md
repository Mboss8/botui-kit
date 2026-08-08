# BotUI v0.2 Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the stable BotUI Foundation with first-class Telegram Rich Message rendering, semantic Theme Engine tokens, and locale-aware i18n while preserving all v0.1.0 regular-message and pagination behavior.

**Architecture:** Keep `@botui/schema` as the language-neutral contract, add standalone `@botui/themes` and `@botui/i18n` packages, keep rich rendering in `@botui/core`, keep Telegram-specific payload compilation in `@botui/telegram`, and compose everything in `@botui/runtime`. Rich Messages use Telegram Bot API 10.2 `InputRichMessage.blocks`; regular messages remain available as an automatic fallback surface.

**Tech Stack:** Node.js 24 LTS, TypeScript 5.x, Vitest, Zod, pnpm workspaces; Telegram Bot API 10.2 rich-message semantics.

## Global Constraints

- Preserve BotUI DSL protocol version `1`; all additions must be backward-compatible with v0.1.0 inputs.
- Core remains Bot-Token-free and performs no outbound Telegram requests.
- Existing regular-message tests and payload shapes must keep passing.
- Rich Message support is structural: the DSL exposes semantic blocks, not raw Telegram objects.
- Phase A supports semantic rich blocks: `heading`, `paragraph`, `preformatted`, `footer`, `divider`, `quote`, `list`, `table`, `details`.
- Rich block text uses the same locale/interpolation pipeline as regular content.
- `LocalizedText` accepts a literal string or `{ i18n: string, fallback?: string }`.
- Locale fallback order is exact locale -> base language -> configured default locale -> explicit fallback -> key.
- Theme tokens are semantic; themes do not promise arbitrary Telegram button HEX/RGB colors.
- Built-in themes in Phase A: `default`, `business`, `minimal`, `luxury`, `gaming`, `finance`, `proxy`.
- A theme may change labels/icons/layout defaults/divider copy, but cannot change business data.
- No production code is added before the corresponding failing test is observed in CI.

---

### Task 1: Extend the DSL with LocalizedText and semantic Rich Blocks

**Files:**
- Modify: `packages/schema/src/schema.ts`
- Modify: `packages/schema/src/index.ts`
- Test: `packages/schema/src/schema.test.ts`

**Interfaces:**
- Produces `LocalizedText = string | { i18n: string; fallback?: string }`.
- Produces `BotUIRichBlock` union for heading/paragraph/preformatted/footer/divider/quote/list/table/details.
- Extends `BotUIContent` with optional `blocks` and `is_rtl` while preserving existing `title/text/fields/footer`.
- Extends `BotUIButton.text` from string to `LocalizedText`.

- [ ] **Step 1: Add failing schema tests** proving legacy v0.1 regular input still parses, localized button/content text parses, nested `details` parses, and invalid heading sizes/table widths are rejected.
- [ ] **Step 2: Run `pnpm test -- packages/schema/src/schema.test.ts` in CI and verify RED** because the new fields/types do not exist.
- [ ] **Step 3: Implement recursive Zod rich-block schemas** using `z.lazy` for nested list/quote/details content and heading size `1..6`; limit table rows to 100 and columns to 20.
- [ ] **Step 4: Export all new inferred types from schema package.**
- [ ] **Step 5: Run schema and workspace tests; verify GREEN.**

---

### Task 2: Add locale resolution and translation registry

**Files:**
- Create: `packages/i18n/package.json`
- Create: `packages/i18n/tsconfig.json`
- Create: `packages/i18n/src/index.ts`
- Create: `packages/i18n/src/registry.ts`
- Create: `packages/i18n/src/resolve.ts`
- Test: `packages/i18n/src/i18n.test.ts`

**Interfaces:**
- Produces `TranslationDictionary = Record<string, string>`.
- Produces `TranslationRegistry = Record<string, TranslationDictionary>`.
- Produces `createI18n(registry, options)` with `resolve(text, locale, data?)`.
- Default locale is `zh-CN`.
- Interpolation is delegated to the core-safe interpolation behavior after translation resolution.

- [ ] **Step 1: Add failing tests** for exact locale, base-language fallback (`zh-HK -> zh`), configured default fallback, explicit per-value fallback, unknown-key fallback to the key, and literal-string pass-through.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement deterministic fallback-chain construction** with duplicate locale removal.
- [ ] **Step 4: Implement `resolve()` without evaluating translation strings as code.**
- [ ] **Step 5: Verify GREEN and full workspace regression.**

---

### Task 3: Add semantic Theme Engine and built-in theme registry

**Files:**
- Create: `packages/themes/package.json`
- Create: `packages/themes/tsconfig.json`
- Create: `packages/themes/src/index.ts`
- Create: `packages/themes/src/theme.ts`
- Create: `packages/themes/src/builtins.ts`
- Test: `packages/themes/src/theme.test.ts`

**Interfaces:**
- Produces `BotUITheme` with semantic tokens:
  - `name`
  - `icons.{success,error,warning,home,back,first,previous,next,last,refresh}`
  - `labels.{home,back,first,previous,next,last,refresh}` as `LocalizedText`
  - `layout.{maxPerRow,longTextThreshold}`
  - `regular.divider`
  - `rich.defaultHeadingSize`
- Produces `ThemeRegistry`, `createThemeRegistry()`, `resolveTheme(name, overrides?)`.
- Built-ins: default/business/minimal/luxury/gaming/finance/proxy.

- [ ] **Step 1: Add failing tests** that all built-ins resolve, unknown names fall back to default, partial overrides deep-merge without deleting unspecified tokens, and invalid layout values are rejected.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement Zod validation and immutable deep-merge for documented token groups only.**
- [ ] **Step 4: Add built-ins with conservative Telegram-compatible semantic differences (icons/labels/layout), not arbitrary button colors.**
- [ ] **Step 5: Verify GREEN.**

---

### Task 4: Render semantic Rich Blocks to Telegram InputRichMessage blocks

**Files:**
- Create: `packages/core/src/render-rich.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/render-rich.test.ts`

**Interfaces:**
- Produces `RenderedRichContent = { format: 'rich'; richMessage: { blocks: TelegramNeutralRichBlock[]; is_rtl?: boolean } }`.
- Produces `renderRich(request, context): RenderedRichContent`.
- `context.resolveText(value)` returns the localized/interpolated plain text string.
- Mapping:
  - DSL `heading` -> `{ type:'heading', text, size }`
  - `paragraph` -> `{ type:'paragraph', text }`
  - `preformatted` -> `{ type:'pre', text, language? }`
  - `footer` -> `{ type:'footer', text }`
  - `divider` -> `{ type:'divider' }`
  - `quote` -> `{ type:'blockquote', blocks:[...] , credit? }`
  - `list` -> `{ type:'list', items:[{ blocks:[{type:'paragraph',text}], value? }] }`
  - `table` -> `{ type:'table', cells:[[{text,is_header?,align?,valign?}]], is_bordered?, is_striped?, caption? }`
  - `details` -> `{ type:'details', summary, blocks, is_open? }`

- [ ] **Step 1: Add failing renderer tests** covering each supported block, nested details/quote/list content, data interpolation, and locale resolution callback usage.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement recursive semantic-to-neutral block mapping** with no Telegram network dependency.
- [ ] **Step 4: Verify GREEN and ensure regular renderer regression remains green.**

---

### Task 5: Compile Rich Messages to Telegram Bot API 10.2 RenderPlan operations

**Files:**
- Modify: `packages/telegram/src/compiler.ts`
- Modify: `packages/telegram/src/index.ts`
- Test: `packages/telegram/src/compiler.test.ts`

**Interfaces:**
- Extend compiler input content union to `RenderedContent | RenderedRichContent`.
- Add operation `{ type:'sendRichMessage'; payload:{ chat_id?, rich_message, reply_markup? } }`.
- `editMessageText` payload becomes a union: regular text fields OR `rich_message`.
- Existing `sendMessage`, `editMessageText` regular, and `editMessageReplyMarkup` behavior must remain unchanged.

- [ ] **Step 1: Add failing tests** for `sendRichMessage`, rich edit via `editMessageText.rich_message`, inline keyboard preservation, and regular-message regression.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement format-aware compiler branches** without changing callback byte validation or semantic button style mapping.
- [ ] **Step 4: Verify GREEN and full workspace regression.**

---

### Task 6: Integrate i18n + themes + rich auto-selection in Runtime

**Files:**
- Modify: `packages/runtime/package.json`
- Modify: `packages/runtime/src/render.ts`
- Modify: `packages/runtime/src/index.ts`
- Test: `packages/runtime/src/render.test.ts`

**Interfaces:**
- Extend `RenderOptions` with optional `translations`, `defaultLocale`, `themeOverrides`, and `themes` registry input.
- Runtime resolution order:
  1. parse DSL;
  2. resolve theme;
  3. create locale resolver;
  4. localize + interpolate action labels/content;
  5. choose renderer: explicit `rich`, or `auto` + non-empty blocks -> rich; otherwise regular;
  6. layout buttons using theme layout tokens;
  7. build pagination controls using theme labels/icons;
  8. compile Telegram RenderPlan.

- [ ] **Step 1: Add failing end-to-end tests** for a Chinese rich report, an English translation of the same DSL, theme override affecting layout/labels, `auto` selecting rich when blocks exist, and unchanged v0.1 regular output.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement localization normalization helpers** so downstream core/layout/compiler receive literal strings.
- [ ] **Step 4: Integrate theme layout and pagination control labels without moving business logic into themes.**
- [ ] **Step 5: Verify GREEN.**

---

### Task 7: HTTP contract, docs, examples, and final verification

**Files:**
- Modify: `packages/adapter-http/src/server.test.ts`
- Modify: `README.md`
- Create: `examples/node/render-rich-report.mjs`
- Create: `examples/raw-http/render-rich-report.sh`
- Create: `docs/architecture/0002-rich-theme-i18n.md`

**Interfaces:**
- Existing `POST /v1/render` accepts the extended DSL with no new endpoint.
- Documents v0.2 Phase A compatibility and Theme/i18n/Rich Message contracts.

- [ ] **Step 1: Add/extend HTTP inject tests** proving rich DSL is returned as a `sendRichMessage` RenderPlan.
- [ ] **Step 2: Add examples** using the same rich report in direct Runtime and HTTP mode.
- [ ] **Step 3: Document built-in themes, locale fallback order, supported rich blocks, and fallback/compatibility policy.**
- [ ] **Step 4: Run full CI gates:** `pnpm test`, `pnpm typecheck`, `pnpm build`, examples, secret scan.
- [ ] **Step 5: Open a Draft PR against `main`; do not merge until review and final CI are green.**

## Deferred to later v0.2 sub-phases

The following are intentionally outside Phase A so each subsystem can be reviewed independently:

- SVG/resvg/Sharp generated media cards;
- persistent StateStore and Navigation Back Stack;
- Search / Filter / Sort state models;
- Keyboard / Content / Detail advanced pagination;
- grammY and aiogram adapters;
- Mini App Surface.
