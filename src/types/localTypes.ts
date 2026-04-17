export type TypeLocalType = 'Bureau' | 'Magasin';

export interface LocalListType {
	id: number;
	nom: string;
	building: number | null;
	building_nom: string | null;
	type_local: TypeLocalType;
	adresse: string;
	superficie: string | null;
	prix_achat: string;
	prix_location_mensuel: string;
	en_location: boolean;
	locataire_nom: string;
	date_debut_location: string | null;
	notes: string;
	rentabilite: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface LocalFormType {
	nom: string;
	building: number | '' | null;
	type_local: TypeLocalType | '';
	adresse: string;
	superficie: string;
	prix_achat: string;
	prix_location_mensuel: string;
	en_location: boolean;
	locataire_nom: string;
	date_debut_location: string;
	notes: string;
}

export interface LocalFormValues extends LocalFormType {
	globalError: string;
}

export interface LoyerListType {
	id: number;
	local: number;
	local_nom: string;
	mois: number;
	annee: number;
	montant: string;
	paye: boolean;
	date_paiement: string | null;
	notes: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface LoyerFormType {
	local: number | '';
	mois: number | '';
	annee: number | '';
	montant: string;
	paye: boolean;
	date_paiement: string;
	notes: string;
}

export interface LoyerFormValues extends LoyerFormType {
	globalError: string;
}

export interface LoyerMonthData {
	id: number | null;
	montant: string;
	paye: boolean;
	date_paiement: string | null;
	is_implicit?: boolean;
}

export interface PlanningLocalType {
	id: number;
	nom: string;
	type_local: TypeLocalType;
	en_location: boolean;
	locataire_nom: string;
	prix_location_mensuel: string;
	months: Record<number, LoyerMonthData | null>;
}

export interface LocalPlanningResponse {
	year: number;
	locaux: PlanningLocalType[];
}

export interface LocalDashboardLocalType {
	id: number;
	nom: string;
	type_local: TypeLocalType;
	en_location: boolean;
	prix_achat: string;
	prix_location_mensuel: string;
	rentabilite: string;
	loyers_payes: string;
	loyers_impayes: string;
}

export interface LocalDashboardResponse {
	year: number;
	total_benefice_ht: string;
	total_en_location: number;
	total_libres: number;
	locaux: LocalDashboardLocalType[];
}

export interface LocalYearsResponse {
	years: number[];
}
