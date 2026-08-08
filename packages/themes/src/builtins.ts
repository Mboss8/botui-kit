import {
  mergeTheme,
  themeSchema,
  type BotUITheme,
  type ThemeOverrides,
  type ThemeRegistry
} from './theme.js';

const DEFAULT_THEME: BotUITheme = themeSchema.parse({
  name: 'default',
  icons: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    home: '🏠',
    back: '⬅️',
    first: '⏮',
    previous: '◀️',
    next: '▶️',
    last: '⏭',
    refresh: '🔄'
  },
  labels: {
    home: { i18n: 'navigation.home', fallback: '首页' },
    back: { i18n: 'navigation.back', fallback: '返回' },
    first: { i18n: 'pagination.first', fallback: '第一页' },
    previous: { i18n: 'pagination.previous', fallback: '上一页' },
    next: { i18n: 'pagination.next', fallback: '下一页' },
    last: { i18n: 'pagination.last', fallback: '最后一页' },
    refresh: { i18n: 'pagination.refresh', fallback: '刷新' }
  },
  layout: {
    maxPerRow: 2,
    longTextThreshold: 14
  },
  regular: {
    divider: '──────────'
  },
  rich: {
    defaultHeadingSize: 2
  }
});

function variant(name: string, overrides: ThemeOverrides): BotUITheme {
  const merged = mergeTheme(DEFAULT_THEME, overrides);
  return themeSchema.parse({ ...merged, name });
}

export const BUILTIN_THEME_NAMES = [
  'default',
  'business',
  'minimal',
  'luxury',
  'gaming',
  'finance',
  'proxy'
] as const;

export const BUILTIN_THEMES: ThemeRegistry = Object.freeze({
  default: DEFAULT_THEME,
  business: variant('business', {
    layout: { longTextThreshold: 12 },
    regular: { divider: '━━━━━━━━━━' },
    rich: { defaultHeadingSize: 2 }
  }),
  minimal: variant('minimal', {
    icons: {
      home: '⌂',
      back: '←',
      first: '«',
      previous: '‹',
      next: '›',
      last: '»',
      refresh: '↻'
    },
    layout: { longTextThreshold: 16 },
    regular: { divider: '────' }
  }),
  luxury: variant('luxury', {
    icons: {
      home: '🏛️',
      back: '‹',
      first: '«',
      previous: '◀',
      next: '▶',
      last: '»',
      refresh: '✦'
    },
    regular: { divider: '✦ ━━━━━━━━ ✦' },
    rich: { defaultHeadingSize: 2 }
  }),
  gaming: variant('gaming', {
    icons: {
      home: '🎮',
      back: '↩️',
      first: '⏮',
      previous: '◀️',
      next: '▶️',
      last: '⏭',
      refresh: '♻️'
    },
    regular: { divider: '━━━━━━━━━━' }
  }),
  finance: variant('finance', {
    icons: {
      home: '💼',
      back: '⬅️',
      first: '⏮',
      previous: '◀️',
      next: '▶️',
      last: '⏭',
      refresh: '🔄'
    },
    layout: { longTextThreshold: 13 },
    regular: { divider: '────────────' }
  }),
  proxy: variant('proxy', {
    icons: {
      home: '🌐',
      back: '⬅️',
      first: '⏮',
      previous: '◀️',
      next: '▶️',
      last: '⏭',
      refresh: '🔄'
    },
    layout: { longTextThreshold: 13 },
    regular: { divider: '──────────' }
  })
});

export function createThemeRegistry(customThemes: ThemeRegistry = {}): ThemeRegistry {
  const registry: ThemeRegistry = { ...BUILTIN_THEMES };

  for (const [name, theme] of Object.entries(customThemes)) {
    registry[name] = themeSchema.parse(theme);
  }

  return registry;
}

export function resolveTheme(
  name: string,
  overrides?: ThemeOverrides,
  registry: ThemeRegistry = createThemeRegistry()
): BotUITheme {
  const base = registry[name] ?? registry.default ?? DEFAULT_THEME;
  return mergeTheme(base, overrides);
}
