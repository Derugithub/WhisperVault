export const RECOGNITION_LANGUAGE_KEY = 'recognitionLang';

export const RECOGNITION_LANGUAGES = [
  { label: 'English (US)', tag: 'en-US' },
  { label: 'English (UK)', tag: 'en-GB' },
  { label: 'Spanish', tag: 'es-ES' },
  { label: 'French', tag: 'fr-FR' },
  { label: 'German', tag: 'de-DE' },
  { label: 'Portuguese (Brazil)', tag: 'pt-BR' },
  { label: 'Italian', tag: 'it-IT' },
  { label: 'Japanese', tag: 'ja-JP' },
  { label: 'Korean', tag: 'ko-KR' },
  { label: 'Chinese (Simplified)', tag: 'zh-CN' },
] as const;

export type RecognitionLanguageTag = (typeof RECOGNITION_LANGUAGES)[number]['tag'];

function normalizeLocale(value: string): string {
  return value.trim().toLowerCase().replaceAll('_', '-');
}

export function resolveRecognitionLanguage(deviceTag: string | null, stored: string | null): string {
  const known = new Set<string>(RECOGNITION_LANGUAGES.map((language) => language.tag));
  if (stored && known.has(stored)) {
    return stored;
  }
  if (deviceTag) {
    const normalized = normalizeLocale(deviceTag);
    const exact = RECOGNITION_LANGUAGES.find((language) => normalizeLocale(language.tag) === normalized);
    if (exact) {
      return exact.tag;
    }
    const prefix = normalized.split('-')[0];
    const byLanguage = RECOGNITION_LANGUAGES.find((language) => language.tag.toLowerCase().startsWith(`${prefix}-`));
    if (byLanguage) {
      return byLanguage.tag;
    }
  }
  return 'en-US';
}

export function localeInstalled(installed: string[], wanted: string): boolean {
  if (installed.length === 0) {
    return false;
  }
  const target = normalizeLocale(wanted);
  const language = target.split('-')[0];
  return installed.some((entry) => {
    const normalized = normalizeLocale(entry);
    return normalized === target || normalized.split('-')[0] === language;
  });
}

export function languageLabel(tag: string): string {
  return RECOGNITION_LANGUAGES.find((language) => language.tag === tag)?.label ?? tag;
}
