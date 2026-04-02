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
export const costCategoryItemsList = [
	{ code: 'Entretien', value: 'Entretien' },
	{ code: 'Charges', value: 'Charges' },
	{ code: 'Assurance', value: 'Assurance' },
	{ code: 'Taxes', value: 'Taxes' },
	{ code: 'Autre', value: 'Autre' },
] as const;

export type CostCategoryChipColor = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';

export const COST_CATEGORY_CHIP_COLORS: Record<string, CostCategoryChipColor> = {
	Entretien: 'warning',
	Charges: 'info',
	Assurance: 'primary',
	Taxes: 'error',
	Autre: 'default',
};

// Field label maps (used in Formik validation error display)
export const RESERVATION_FIELD_LABELS: Record<string, string> = {
	apartment: 'Appartement',
	guest_name: 'Nom du client',
	check_in: "Date d'arrivée",
	check_out: 'Date de départ',
	amount: 'Montant',
	payment_source: 'Source de paiement',
	notes: 'Notes',
};

export const COST_FIELD_LABELS: Record<string, string> = {
	description: 'Description',
	amount: 'Montant',
	date: 'Date',
	category: 'Catégorie',
};

// Shared Chart.js options
export const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;

// ── Locaux ───────────────────────────────────────────────────────────────────

export const typeLocalItemsList = [
	{ code: 'Bureau', value: 'Bureau' },
	{ code: 'Magasin', value: 'Magasin' },
] as const;

export const TYPE_LOCAL_CHIP_COLORS: Record<string, ChipColor> = {
	Bureau: 'primary',
	Magasin: 'warning',
};

export const LOCAL_TYPE_LABEL_KEYS: Record<'Bureau' | 'Magasin', 'office' | 'shop'> = {
	Bureau: 'office',
	Magasin: 'shop',
};

export const LOCAL_FIELD_LABELS: Record<string, string> = {
	nom: 'Nom',
	type_local: 'Type',
	adresse: 'Adresse',
	superficie: 'Superficie',
	prix_achat: "Prix d'achat",
	prix_location_mensuel: 'Loyer mensuel',
	en_location: 'En location',
	locataire_nom: 'Locataire',
	date_debut_location: 'Début de location',
	notes: 'Notes',
};

export const LOYER_FIELD_LABELS: Record<string, string> = {
	local: 'Local',
	mois: 'Mois',
	annee: 'Année',
	montant: 'Montant',
	paye: 'Payé',
	date_paiement: 'Date de paiement',
	notes: 'Notes',
};

export const BUILDING_FIELD_LABELS: Record<string, string> = {
	nom: 'Nom',
};
