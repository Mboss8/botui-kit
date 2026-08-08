import { describe, expect, it } from 'vitest';
import { createI18n } from './index.js';

const registry = {
  'en-US': {
    'greeting.hello': 'Hello, {{ user.name }}'
  },
  zh: {
    'greeting.hello': '你好，{{ user.name }}'
  },
  'zh-CN': {
    'common.save': '保存'
  }
};

describe('createI18n', () => {
  it('resolves an exact locale and safely interpolates data', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve(
      { i18n: 'greeting.hello' },
      'en-US',
      { user: { name: '<Alice & Bob>' } }
    )).toBe('Hello, &lt;Alice &amp; Bob&gt;');
  });

  it('preserves template placeholders when no business data is supplied', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve({ i18n: 'greeting.hello' }, 'en-US')).toBe('Hello, {{ user.name }}');
  });

  it('falls back from a regional locale to its base language', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve(
      { i18n: 'greeting.hello' },
      'zh-HK',
      { user: { name: '阿文' } }
    )).toBe('你好，阿文');
  });

  it('falls back to the configured default locale', () => {
    const i18n = createI18n(registry, { defaultLocale: 'zh-CN' });

    expect(i18n.resolve({ i18n: 'common.save' }, 'fr-FR')).toBe('保存');
  });

  it('uses the explicit fallback after locale dictionaries miss', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve({
      i18n: 'missing.title',
      fallback: '默认标题'
    }, 'de-DE')).toBe('默认标题');
  });

  it('returns the translation key as the final fallback', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve({ i18n: 'missing.key' }, 'de-DE')).toBe('missing.key');
  });

  it('passes literal strings through the same safe interpolation pipeline', () => {
    const i18n = createI18n(registry);

    expect(i18n.resolve(
      '用户：{{ user.name }}',
      'zh-CN',
      { user: { name: '<Tom>' } }
    )).toBe('用户：&lt;Tom&gt;');
  });
});
