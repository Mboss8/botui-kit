import type { ResolvedBotUIButton } from '@botui/schema';
import { encodeAction, type PaginationOp } from './action-codec.js';

export type CursorControlState = {
  session: string;
  hasPrev: boolean;
  hasNext: boolean;
};

function control(text: string, session: string, op: PaginationOp): ResolvedBotUIButton {
  return {
    text,
    action: encodeAction({ version: 'v1', domain: 'p', session, op }),
    style: 'default'
  };
}

export function buildCursorControls(state: CursorControlState): ResolvedBotUIButton[] {
  const controls: ResolvedBotUIButton[] = [];

  if (state.hasPrev) {
    controls.push(control('◀️', state.session, 'p'));
  }

  controls.push(control('↻', state.session, 'r'));

  if (state.hasNext) {
    controls.push(control('▶️', state.session, 'n'));
  }

  return controls;
}
