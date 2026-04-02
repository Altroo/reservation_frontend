import { cookies } from 'next/headers';
import { fr } from '@/translations/fr';
import { en } from '@/translations/en';
import type { TranslationDictionary } from '@/types/languageTypes';

const STORAGE_KEY = 'app-language';

/**
 * Get translations on the server side by reading the language cookie.
 * Use this in generateMetadata() and server components.
 */
export async function getServerTranslations(): Promise<TranslationDictionary> {
	const cookieStore = await cookies();
	const lang = cookieStore.get(STORAGE_KEY)?.value;
	return lang === 'en' ? en : fr;
}
