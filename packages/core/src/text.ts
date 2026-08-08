import type { LocalizedText } from '@botui/schema';

export type TextResolver = (value: LocalizedText) => string;

export function createFallbackTextResolver(): TextResolver {
  return (value) => {
    if (typeof value === 'string') {
      return value;
    }

    return value.fallback ?? value.i18n;
  };
}
