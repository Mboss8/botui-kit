# ADR 0001: Public render facade lives in @botui/runtime

## Status

Accepted — 2026-08-08.

## Context

The original implementation plan placed the public `render()` facade in `@botui/core`. During implementation, `@botui/telegram` already depended on `@botui/core` for rendered content types and regular-renderer output. Making core import the Telegram compiler would create a `core -> telegram -> core` package cycle.

## Decision

Keep `@botui/core` platform-neutral and place orchestration in `@botui/runtime`.

Dependency direction:

```text
schema
  ↓
core        pagination
  ↓             ↓
telegram        │
   \            /
    \          /
      runtime
        ↓
   adapter-http
```

`@botui/runtime` owns the public `render(input, options)` facade and composes:

1. DSL parsing;
2. safe regular rendering;
3. semantic action layout;
4. page/cursor pagination controls;
5. navigation-row ordering;
6. Telegram RenderPlan compilation.

## Consequences

- `core` remains reusable for future non-Telegram surfaces.
- `telegram` has a one-way dependency on core.
- future adapters depend on runtime rather than importing private internals.
- no circular workspace dependency is introduced.
