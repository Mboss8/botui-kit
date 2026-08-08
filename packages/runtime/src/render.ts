import {
  layoutButtons,
  renderRegular,
  renderRich,
  type RichHeadingSize,
  type TextResolver
} from '@botui/core';
import { createI18n, type TranslationRegistry } from '@botui/i18n';
import { buildCursorControls, buildPageControls } from '@botui/pagination';
import {
  parseRenderRequest,
  type BotUIButton,
  type BotUIRenderRequest,
  type ResolvedBotUIButton
} from '@botui/schema';
import { compileTelegram, type CompileTelegramOptions, type RenderPlan } from '@botui/telegram';
import {
  createThemeRegistry,
  resolveTheme,
  type BotUITheme,
  type ThemeOverrides,
  type ThemeRegistry
} from '@botui/themes';

export type RenderOptions = CompileTelegramOptions & {
  translations?: TranslationRegistry;
  defaultLocale?: string;
  themeOverrides?: ThemeOverrides;
  themes?: ThemeRegistry;
};

function isNavigationRow(row: ResolvedBotUIButton[]): boolean {
  return row.length > 0 && row.every((button) => button.action.startsWith('navigation.'));
}

function applySystemTheme(button: BotUIButton, theme: BotUITheme): BotUIButton {
  if (button.action === 'navigation.back') {
    return { ...button, text: theme.labels.back };
  }

  if (button.action === 'navigation.home') {
    return { ...button, text: theme.labels.home };
  }

  return button;
}

function paginationControls(
  request: BotUIRenderRequest,
  theme: BotUITheme
): ResolvedBotUIButton[] {
  const pagination = request.pagination;
  if (!pagination) return [];

  if (pagination.mode === 'page') {
    return buildPageControls({
      session: pagination.session,
      page: pagination.page,
      totalPages: pagination.total_pages
    }, {
      first: theme.icons.first,
      previous: theme.icons.previous,
      next: theme.icons.next,
      last: theme.icons.last
    });
  }

  return buildCursorControls({
    session: pagination.session,
    hasPrev: pagination.has_prev,
    hasNext: pagination.has_next
  }, {
    previous: theme.icons.previous,
    refresh: theme.icons.refresh,
    next: theme.icons.next
  });
}

function buildKeyboard(
  request: BotUIRenderRequest,
  theme: BotUITheme,
  resolveText: TextResolver
): ResolvedBotUIButton[][] {
  const themedActions = request.actions.map((button) => applySystemTheme(button, theme));
  const actionRows = layoutButtons(themedActions, {
    resolveText,
    maxPerRow: theme.layout.maxPerRow,
    longTextThreshold: theme.layout.longTextThreshold
  });
  const navigationRows = actionRows.filter(isNavigationRow);
  const normalRows = actionRows.filter((row) => !isNavigationRow(row));
  const controls = paginationControls(request, theme);

  return [
    ...normalRows,
    ...(controls.length > 0 ? [controls] : []),
    ...navigationRows
  ];
}

function compilerOptions(options: RenderOptions): CompileTelegramOptions {
  const compiled: CompileTelegramOptions = {};

  if (options.mode !== undefined) compiled.mode = options.mode;
  if (options.chatId !== undefined) compiled.chatId = options.chatId;
  if (options.messageId !== undefined) compiled.messageId = options.messageId;

  return compiled;
}

function createResolver(request: BotUIRenderRequest, options: RenderOptions): TextResolver {
  const i18nOptions = options.defaultLocale === undefined
    ? {}
    : { defaultLocale: options.defaultLocale };
  const i18n = createI18n(options.translations ?? {}, i18nOptions);

  return (value) => i18n.resolve(value, request.locale);
}

function shouldRenderRich(request: BotUIRenderRequest): boolean {
  if (request.content.mode === 'rich') return true;
  if (request.content.mode !== 'auto') return false;
  return (request.content.blocks?.length ?? 0) > 0;
}

export function render(input: unknown, options: RenderOptions = {}): RenderPlan {
  const request = parseRenderRequest(input);

  if (request.content.mode === 'miniapp') {
    throw new Error('Mini App surface is not implemented in BotUI v0.2 Phase A');
  }

  const registry = createThemeRegistry(options.themes ?? {});
  const theme = resolveTheme(request.theme, options.themeOverrides, registry);
  const resolveText = createResolver(request, options);
  const buttons = buildKeyboard(request, theme, resolveText);

  const content = shouldRenderRich(request)
    ? renderRich(request, {
        resolveText,
        defaultHeadingSize: theme.rich.defaultHeadingSize as RichHeadingSize
      })
    : renderRegular(request, {
        resolveText,
        divider: theme.regular.divider
      });

  return compileTelegram({ content, buttons }, compilerOptions(options));
}
