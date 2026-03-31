export interface BuildingListType {
	id: number;
	nom: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface BuildingFormType {
	nom: string;
}

export interface BuildingFormValues extends BuildingFormType {
	globalError: string;
}
