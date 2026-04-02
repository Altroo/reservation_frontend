import { fr } from '@/translations/fr';
import { en } from '@/translations/en';
import type { TranslationDictionary } from '@/types/languageTypes';

/**
 * Get current translations outside React components (e.g. Zod schemas, Axios interceptors).
 * Reads language from localStorage at call time for dynamic switching.
 */
export function getTranslations(): TranslationDictionary {
	const lang = typeof window !== 'undefined' ? localStorage.getItem('app-language') || 'fr' : 'fr';
	return lang === 'en' ? en : fr;
}
