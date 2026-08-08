import type { BotUIButton, ResolvedBotUIButton } from '@botui/schema';
import { createFallbackTextResolver, type TextResolver } from './text.js';

export type LayoutOptions = {
  maxPerRow?: 1 | 2;
  longTextThreshold?: number;
  resolveText?: TextResolver;
};

type ResolvedLayoutOptions = {
  maxPerRow: 1 | 2;
  longTextThreshold: number;
};

function textLength(text: string): number {
  return Array.from(text).length;
}

function isNavigation(button: ResolvedBotUIButton): boolean {
  return button.action.startsWith('navigation.');
}

function layoutSection(buttons: ResolvedBotUIButton[], options: ResolvedLayoutOptions): ResolvedBotUIButton[][] {
  const rows: ResolvedBotUIButton[][] = [];
  let pending: ResolvedBotUIButton[] = [];

  const flush = () => {
    if (pending.length > 0) {
      rows.push(pending);
      pending = [];
    }
  };

  for (const button of buttons) {
    const mustStandAlone =
      button.style === 'primary' ||
      button.style === 'danger' ||
      textLength(button.text) > options.longTextThreshold;

    if (mustStandAlone) {
      flush();
      rows.push([button]);
      continue;
    }

    pending.push(button);
    if (pending.length >= options.maxPerRow) {
      flush();
    }
  }

  flush();
  return rows;
}

export function layoutButtons(buttons: BotUIButton[], options: LayoutOptions = {}): ResolvedBotUIButton[][] {
  const resolveText = options.resolveText ?? createFallbackTextResolver();
  const resolvedOptions: ResolvedLayoutOptions = {
    maxPerRow: options.maxPerRow ?? 2,
    longTextThreshold: options.longTextThreshold ?? 14
  };
  const resolvedButtons: ResolvedBotUIButton[] = buttons.map((button) => ({
    ...button,
    text: resolveText(button.text)
  }));

  const actions = resolvedButtons.filter((button) => !isNavigation(button));
  const navigation = resolvedButtons.filter(isNavigation);

  return [
    ...layoutSection(actions, resolvedOptions),
    ...layoutSection(navigation, resolvedOptions)
  ];
}
