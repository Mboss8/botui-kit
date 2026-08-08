import { layoutButtons, renderRegular } from '@botui/core';
import { buildCursorControls, buildPageControls } from '@botui/pagination';
import { parseRenderRequest, type BotUIRenderRequest, type ResolvedBotUIButton } from '@botui/schema';
import { compileTelegram, type CompileTelegramOptions, type RenderPlan } from '@botui/telegram';

export type RenderOptions = CompileTelegramOptions;

function isNavigationRow(row: ResolvedBotUIButton[]): boolean {
  return row.length > 0 && row.every((button) => button.action.startsWith('navigation.'));
}

function paginationControls(request: BotUIRenderRequest): ResolvedBotUIButton[] {
  const pagination = request.pagination;
  if (!pagination) return [];

  if (pagination.mode === 'page') {
    return buildPageControls({
      session: pagination.session,
      page: pagination.page,
      totalPages: pagination.total_pages
    });
  }

  return buildCursorControls({
    session: pagination.session,
    hasPrev: pagination.has_prev,
    hasNext: pagination.has_next
  });
}

function buildKeyboard(request: BotUIRenderRequest): ResolvedBotUIButton[][] {
  const actionRows = layoutButtons(request.actions);
  const navigationRows = actionRows.filter(isNavigationRow);
  const normalRows = actionRows.filter((row) => !isNavigationRow(row));
  const controls = paginationControls(request);

  return [
    ...normalRows,
    ...(controls.length > 0 ? [controls] : []),
    ...navigationRows
  ];
}

export function render(input: unknown, options: RenderOptions = {}): RenderPlan {
  const request = parseRenderRequest(input);

  if (request.content.mode === 'miniapp') {
    throw new Error('Mini App surface is not implemented in BotUI V1 foundation');
  }

  const content = renderRegular(request);
  const buttons = buildKeyboard(request);

  return compileTelegram({ content, buttons }, options);
}
