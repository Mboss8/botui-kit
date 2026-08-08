import { interpolate } from '@botui/core';
import type { LocalizedText } from '@botui/schema';
import { buildLocaleFallbackChain, type I18nOptions, type TranslationRegistry } from './registry.js';

export type I18n = {
  resolve(
    value: LocalizedText,
    locale: string,
    data?: Record<string, unknown>
  ): string;
};

function lookup(
  registry: TranslationRegistry,
  localeChain: string[],
  key: string
): string | undefined {
  for (const locale of localeChain) {
    const dictionary = registry[locale];
    if (dictionary && Object.prototype.hasOwnProperty.call(dictionary, key)) {
      return dictionary[key];
    }
  }

  return undefined;
}

export function createI18n(
  registry: TranslationRegistry = {},
  options: I18nOptions = {}
): I18n {
  const defaultLocale = options.defaultLocale ?? 'zh-CN';

  return {
    resolve(value, locale, data = {}) {
      if (typeof value === 'string') {
        return interpolate(value, data);
      }

      const translated = lookup(
        registry,
        buildLocaleFallbackChain(locale, defaultLocale),
        value.i18n
      );
      const template = translated ?? value.fallback ?? value.i18n;

      return interpolate(template, data);
    }
  };
}
