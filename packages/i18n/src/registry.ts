export type TranslationDictionary = Record<string, string>;
export type TranslationRegistry = Record<string, TranslationDictionary>;

export type I18nOptions = {
  defaultLocale?: string;
};

export function buildLocaleFallbackChain(locale: string, defaultLocale: string): string[] {
  const candidates = [locale];
  const separatorIndex = locale.indexOf('-');

  if (separatorIndex > 0) {
    candidates.push(locale.slice(0, separatorIndex));
  }

  candidates.push(defaultLocale);

  return [...new Set(candidates.filter((candidate) => candidate.length > 0))];
}
