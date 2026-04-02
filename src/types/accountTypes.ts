import type { ResponseDataInterface, SagaPayloadType, TokenType } from '@/types/_initTypes';
import type { UserClass } from '@/models/classes';

//!- DropDown Type
export type DropDownType = {
	code: string;
	value: string;
};

//!- Account State
export interface AccountStateInterface {
	profil: UserClass | Record<string, unknown>;
}

export type InitStateTokenNextAuth = {
	user: {
		pk: number;
		email: string;
		first_name: string;
		last_name: string;
	};
	access: string;
	refresh: string;
	access_expiration: string;
	refresh_expiration: string;
};

export type AccountPostLoginResponseType = ResponseDataInterface<InitStateTokenNextAuth>;

export type AccountGenderCodeValueType = {
	code: 'H' | 'F';
	value: string;
};

export type setProfilPayloadType = SagaPayloadType<UserClass>;

export interface EditProfilResponse extends TokenType {
	data: FormData | Partial<UserClass>;
}

export interface PasswordResetResponse extends TokenType {
	data: {
		old_password: string;
		new_password: string;
		new_password2: string;
	};
}

export interface UserFormValues {
	first_name: string;
	last_name: string;
	email: string;
	gender: string;
	is_active: boolean;
	is_staff: boolean;
	can_view: boolean;
	can_create: boolean;
	can_edit: boolean;
	can_delete: boolean;
	avatar: string | ArrayBuffer | null;
	avatar_cropped: string | ArrayBuffer | null;
	globalError: string;
}
