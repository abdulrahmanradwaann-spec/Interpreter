export type Language = {
  code: string;
  name: string;
};

export type TranslationHistory = {
  id?: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  type: 'text' | 'speech' | 'image';
  timestamp: number;
};

export type TranslationResponse = {
  translatedText: string;
  detectedLanguage?: string;
  detectedTone?: string;
  explanation?: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
];
