import type { AccountGenderCodeValueType } from '@/types/accountTypes';

export const genderItemsList: Array<AccountGenderCodeValueType> = [
	{ code: 'H', value: 'Homme' },
	{ code: 'F', value: 'Femme' },
];

export const paymentSourceItemsList = [
	{ code: 'Booking', value: 'Booking' },
	{ code: 'Airbnb', value: 'Airbnb' },
	{ code: 'Cash', value: 'Espèces' },
	{ code: 'Bank', value: 'Virement bancaire' },
] as const;

// ── Reservation chart & planning constants ───────────────────────────────────

export const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const MONTH_NAMES = [
	'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
	'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const DAY_ABBREVIATIONS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const CHART_COLORS = {
	booking: 'rgba(25, 118, 210, 0.8)',
	airbnb: 'rgba(255, 90, 31, 0.8)',
	cash: 'rgba(46, 125, 50, 0.8)',
	bank: 'rgba(156, 39, 176, 0.8)',
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.15)',
	secondary: 'rgba(46, 125, 50, 0.8)',
	secondaryLight: 'rgba(46, 125, 50, 0.15)',
};

export const SOURCE_COLORS: Record<string, string> = {
	Booking: CHART_COLORS.booking,
	Airbnb: CHART_COLORS.airbnb,
	Cash: CHART_COLORS.cash,
	Bank: CHART_COLORS.bank,
};

export const PAYMENT_SOURCE_BG: Record<string, string> = {
	Booking: '#1565c0',
	Airbnb: '#bf360c',
	Cash: '#1b5e20',
	Bank: '#4a148c',
	'Bank transfer': '#4a148c', // alias for legacy/imported data
};

export const PAYMENT_SOURCE_LIGHT: Record<string, string> = {
	Booking: '#e3f2fd',
	Airbnb: '#fbe9e7',
	Cash: '#e8f5e9',
	Bank: '#f3e5f5',
	'Bank transfer': '#f3e5f5',
};

export type ChipColor = 'default' | 'primary' | 'success' | 'secondary' | 'info' | 'warning' | 'error';

export const PAYMENT_SOURCE_CHIP_COLORS: Record<string, ChipColor> = {
	Booking: 'primary',
	Airbnb: 'error',
	Cash: 'success',
	Bank: 'secondary',
	'Bank transfer': 'secondary',
};

export const APARTMENT_COLORS = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(255, 90, 31, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(2, 136, 209, 0.8)',
	'rgba(255, 193, 7, 0.8)',
];
