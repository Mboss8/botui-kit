import { describe, expect, it } from 'vitest';
import type { BotUIButton } from '@botui/schema';
import { layoutButtons } from './layout.js';
import { createFallbackTextResolver } from './text.js';

function button(text: BotUIButton['text'], action: string, style: BotUIButton['style'] = 'default'): BotUIButton {
  return { text, action, style };
}

describe('layoutButtons', () => {
  it('puts a primary action on its own row', () => {
    const buy = button('立即购买', 'order.buy', 'primary');
    expect(layoutButtons([buy])).toEqual([[buy]]);
  });

  it('pairs two short ordinary actions', () => {
    const deposit = button('充值', 'wallet.deposit');
    const withdraw = button('提现', 'wallet.withdraw');
    expect(layoutButtons([deposit, withdraw])).toEqual([[deposit, withdraw]]);
  });

  it('separates danger actions from positive primary actions', () => {
    const confirm = button('确认', 'order.confirm', 'primary');
    const remove = button('删除', 'order.delete', 'danger');
    expect(layoutButtons([confirm, remove])).toEqual([[confirm], [remove]]);
  });

  it('moves navigation actions to the bottom while preserving navigation order', () => {
    const back = button('返回', 'navigation.back');
    const details = button('详情', 'order.details');
    const home = button('首页', 'navigation.home');

    expect(layoutButtons([back, details, home])).toEqual([
      [details],
      [back, home]
    ]);
  });

  it('uses resolved localized labels for long-text layout decisions', () => {
    const localized = button(
      { i18n: 'very.long', fallback: '这是一个非常非常长的按钮文字' },
      'report.open'
    );
    const ordinary = button('详情', 'report.details');

    expect(layoutButtons([localized, ordinary], {
      resolveText: createFallbackTextResolver(),
      longTextThreshold: 8
    })).toEqual([
      [localized],
      [ordinary]
    ]);
  });
});
