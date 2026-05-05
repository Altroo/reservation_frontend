export class UserClass {
	constructor(
		public readonly id: number,
		public first_name: string,
		public last_name: string,
		public email: string,
		public gender: string,
		public avatar: string | ArrayBuffer | null,
		public avatar_cropped: string | ArrayBuffer | null,
		public is_staff: boolean,
		public is_active: boolean,
		public default_password_set: boolean,
		public date_joined: string | null,
		public date_updated: string | null,
		public last_login: string | null,
		// Per-user permission flags
		public can_view: boolean,
		public can_create: boolean,
		public can_edit: boolean,
		public can_delete: boolean,
		public can_access_hilton_reports: boolean,
	) {}
}

export class BuildingClass {
	constructor(
		public readonly id: number,
		public nom: string,
		public created_by_user: number | null,
		public created_by_user_name: string | null,
		public date_created: string,
		public date_updated: string,
	) {}
}

export class ApartmentClass {
	constructor(
		public readonly id: number,
		public nom: string,
		public building: number | null,
		public building_nom: string | null,
	) {}
}

export class ReservationClass {
	constructor(
		public readonly id: number,
		public apartment: number,
		public apartment_nom: string,
		public apartment_building: number | null,
		public apartment_building_nom: string | null,
		public guest_name: string,
		public check_in: string,
		public check_out: string,
		public readonly nights: number,
		public amount: string,
		public payment_source: string,
		public payment_source_display: string,
		public amount_returned: boolean,
		public notes: string | null,
		public created_by_user: number | null,
		public created_by_user_name: string,
		public date_created: string,
		public date_updated: string,
	) {}
}

export class LocalClass {
	constructor(
		public readonly id: number,
		public nom: string,
		public building: number | null,
		public building_nom: string | null,
		public type_local: string,
		public adresse: string,
		public superficie: string | null,
		public prix_achat: string,
		public prix_location_mensuel: string,
		public en_location: boolean,
		public locataire_nom: string,
		public date_debut_location: string | null,
		public notes: string,
		public rentabilite: string,
		public created_by_user: number | null,
		public created_by_user_name: string | null,
		public date_created: string,
		public date_updated: string,
	) {}
}

export class LoyerClass {
	constructor(
		public readonly id: number,
		public local: number,
		public local_nom: string,
		public mois: number,
		public annee: number,
		public montant: string,
		public paye: boolean,
		public date_paiement: string | null,
		public notes: string,
		public created_by_user: number | null,
		public created_by_user_name: string | null,
		public date_created: string,
		public date_updated: string,
	) {}
}
