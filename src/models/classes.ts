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
	) {}
}

export class ApartmentClass {
	constructor(
		public readonly id: number,
		public code: string,
		public name: string,
		public monthly_cost: string,
		public is_active: boolean,
	) {}
}

export class ReservationClass {
	constructor(
		public readonly id: number,
		public apartment: number,
		public apartment_name: string,
		public apartment_code: string,
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
