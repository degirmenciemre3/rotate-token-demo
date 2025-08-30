import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';

export const translations = {
  en: enTranslations,
  tr: trTranslations,
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof enTranslations;

export const defaultLanguage: Language = 'en';

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'tr' as Language, name: 'Turkish', nativeName: 'Türkçe' },
];
