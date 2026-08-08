import { describe, expect, it } from 'vitest';
import { BUILTIN_THEME_NAMES, createThemeRegistry, resolveTheme } from './index.js';

describe('Theme Engine', () => {
  it('resolves every built-in theme', () => {
    const registry = createThemeRegistry();

    for (const name of BUILTIN_THEME_NAMES) {
      expect(resolveTheme(name, undefined, registry).name).toBe(name);
    }
  });

  it('falls back to default for an unknown theme name', () => {
    expect(resolveTheme('does-not-exist').name).toBe('default');
  });

  it('deep-merges partial overrides without deleting unspecified tokens', () => {
    const base = resolveTheme('proxy');
    const themed = resolveTheme('proxy', {
      icons: { home: '🛰️' },
      layout: { maxPerRow: 1 }
    });

    expect(themed.icons.home).toBe('🛰️');
    expect(themed.icons.back).toBe(base.icons.back);
    expect(themed.layout.maxPerRow).toBe(1);
    expect(themed.layout.longTextThreshold).toBe(base.layout.longTextThreshold);
  });

  it('rejects invalid layout overrides', () => {
    expect(() => resolveTheme('default', {
      layout: { maxPerRow: 3 as 1 }
    })).toThrow();
  });

  it('keeps Telegram button styling semantic instead of arbitrary colors', () => {
    const theme = resolveTheme('luxury');

    expect(theme).not.toHaveProperty('buttonHex');
    expect(theme).not.toHaveProperty('colors');
    expect(theme.rich.defaultHeadingSize).toBeGreaterThanOrEqual(1);
    expect(theme.rich.defaultHeadingSize).toBeLessThanOrEqual(6);
  });
});
