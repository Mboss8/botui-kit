import type { ResolvedBotUIButton } from '@botui/schema';
import { encodeAction, type PaginationOp } from './action-codec.js';

export type PageControlState = {
  session: string;
  page: number;
  totalPages: number;
};

function control(text: string, session: string, op: PaginationOp): ResolvedBotUIButton {
  return {
    text,
    action: encodeAction({ version: 'v1', domain: 'p', session, op }),
    style: 'default'
  };
}

export function buildPageControls(state: PageControlState): ResolvedBotUIButton[] {
  if (!Number.isInteger(state.page) || !Number.isInteger(state.totalPages) || state.page < 1 || state.totalPages < 1 || state.page > state.totalPages) {
    throw new Error('invalid page pagination state');
  }

  const controls: ResolvedBotUIButton[] = [];

  if (state.page > 1) {
    controls.push(control('⏮', state.session, 'f'));
    controls.push(control('◀️', state.session, 'p'));
  }

  controls.push(control(`${state.page}/${state.totalPages}`, state.session, 'r'));

  if (state.page < state.totalPages) {
    controls.push(control('▶️', state.session, 'n'));
    controls.push(control('⏭', state.session, 'l'));
  }

  return controls;
}
