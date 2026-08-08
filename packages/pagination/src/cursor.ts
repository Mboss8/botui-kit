import type { ResolvedBotUIButton } from '@botui/schema';
import { encodeAction, type PaginationOp } from './action-codec.js';

export type CursorControlState = {
  session: string;
  hasPrev: boolean;
  hasNext: boolean;
};

export type CursorControlPresentation = {
  previous?: string;
  refresh?: string;
  next?: string;
};

function control(text: string, session: string, op: PaginationOp): ResolvedBotUIButton {
  return {
    text,
    action: encodeAction({ version: 'v1', domain: 'p', session, op }),
    style: 'default'
  };
}

export function buildCursorControls(
  state: CursorControlState,
  presentation: CursorControlPresentation = {}
): ResolvedBotUIButton[] {
  const controls: ResolvedBotUIButton[] = [];

  if (state.hasPrev) {
    controls.push(control(presentation.previous ?? '◀️', state.session, 'p'));
  }

  controls.push(control(presentation.refresh ?? '↻', state.session, 'r'));

  if (state.hasNext) {
    controls.push(control(presentation.next ?? '▶️', state.session, 'n'));
  }

  return controls;
}
