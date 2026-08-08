import type { BotUIButton } from '@botui/schema';

export type LayoutOptions = {
  maxPerRow?: 1 | 2;
  longTextThreshold?: number;
};

function textLength(text: string): number {
  return Array.from(text).length;
}

function isNavigation(button: BotUIButton): boolean {
  return button.action.startsWith('navigation.');
}

function layoutSection(buttons: BotUIButton[], options: Required<LayoutOptions>): BotUIButton[][] {
  const rows: BotUIButton[][] = [];
  let pending: BotUIButton[] = [];

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

export function layoutButtons(buttons: BotUIButton[], options: LayoutOptions = {}): BotUIButton[][] {
  const resolved: Required<LayoutOptions> = {
    maxPerRow: options.maxPerRow ?? 2,
    longTextThreshold: options.longTextThreshold ?? 14
  };

  const actions = buttons.filter((button) => !isNavigation(button));
  const navigation = buttons.filter(isNavigation);

  return [
    ...layoutSection(actions, resolved),
    ...layoutSection(navigation, resolved)
  ];
}
