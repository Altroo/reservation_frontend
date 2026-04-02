'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { Language, TranslationDictionary } from '@/types/languageTypes';
import { translations } from '@/translations';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'fr';

export type LanguageContextType = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: TranslationDictionary;
};

export const LanguageContext = createContext<LanguageContextType>({
	language: DEFAULT_LANGUAGE,
	setLanguage: () => {},
	t: translations[DEFAULT_LANGUAGE],
});

const getInitialLanguage = (): Language => {
	if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'fr' || stored === 'en') return stored;
	return DEFAULT_LANGUAGE;
};

export const LanguageContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [language, setLanguageState] = useState<Language>(getInitialLanguage);

	// Sync cookie on mount for existing users who have localStorage but no cookie yet
	useEffect(() => {
		document.cookie = `${STORAGE_KEY}=${language};path=/;max-age=31536000;SameSite=Lax`;
	}, [language]);

	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem(STORAGE_KEY, lang);
		document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000;SameSite=Lax`;
	}, []);

	const t = translations[language];

	return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};
