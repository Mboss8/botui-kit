import type { BotUIButton } from '@botui/schema';
import { encodeAction, type PaginationOp } from './action-codec.js';

export type CursorControlState = {
  session: string;
  hasPrev: boolean;
  hasNext: boolean;
};

function control(text: string, session: string, op: PaginationOp): BotUIButton {
  return {
    text,
    action: encodeAction({ version: 'v1', domain: 'p', session, op }),
    style: 'default'
  };
}

export function buildCursorControls(state: CursorControlState): BotUIButton[] {
  const controls: BotUIButton[] = [];

  if (state.hasPrev) {
    controls.push(control('◀️', state.session, 'p'));
  }

  controls.push(control('↻', state.session, 'r'));

  if (state.hasNext) {
    controls.push(control('▶️', state.session, 'n'));
  }

  return controls;
}
