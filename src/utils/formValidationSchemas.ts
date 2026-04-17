import { z } from 'zod';
import {
	INPUT_REQUIRED,
	INPUT_PASSWORD_MIN,
	INPUT_MIN,
	INPUT_MAX,
	MINI_INPUT_EMAIL,
	SHORT_INPUT_REQUIRED,
} from '@/utils/formValidationErrorMessages';
import { getTranslations } from '@/utils/getTranslations';


const base64ImageField = z.url().or(z.string().startsWith('data:image/')).nullable().optional();

const passwordField = z.preprocess(
	(val) => (val === undefined ? '' : val),
	z
		.string()
		.min(8, { error: INPUT_PASSWORD_MIN(8) })
		.nonempty({ error: INPUT_REQUIRED }),
);

const requiredTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined ? '' : val),
		z
			.string()
			.min(min, { error: INPUT_MIN(min) })
			.max(max, { error: INPUT_MAX(max) })
			.nonempty({ error: INPUT_REQUIRED }),
	);

const requiredChoiceTextField = () =>
	z.preprocess((val) => (val === undefined ? '' : val), z.string().nonempty({ error: INPUT_REQUIRED }));

const requiredDateField = (getLabel: () => string) =>
	z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z
			.string()
			.nonempty({ error: () => getTranslations().validation.dateRequired(getLabel()) })
			.regex(/^\d{4}-\d{2}-\d{2}$/, { error: () => getTranslations().validation.invalidDateFormat }),
	);

const optionalChoiceField = () =>
	z.preprocess((val) => (val === undefined || val === null || val === '' ? undefined : val), z.string().optional());

const optionalTextField = (min: number, max: number) =>
	z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : val),
		z
			.string()
			.min(min, { error: INPUT_MIN(min) })
			.max(max, { error: INPUT_MAX(max) })
			.optional(),
	);

const singleDigit = z
	.string()
	.min(1, { error: SHORT_INPUT_REQUIRED })
	.regex(/^\d$/, { error: SHORT_INPUT_REQUIRED })
	.transform((val) => Number(val));

export const loginSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	password: passwordField,
	globalError: optionalTextField(1, 500),
});

export const emailSchema = z.object({
	email: z.email({ error: MINI_INPUT_EMAIL }),
	globalError: optionalTextField(1, 500),
});

export const passwordResetConfirmationSchema = z.object({
	new_password: passwordField,
	new_password2: passwordField,
	globalError: optionalTextField(1, 500),
});

export const passwordResetCodeSchema = z.object({
	one: singleDigit,
	two: singleDigit,
	three: singleDigit,
	four: singleDigit,
	five: singleDigit,
	six: singleDigit,
	globalError: optionalTextField(1, 500),
});

export const userSchema = z.object({
	// REQUIRED FIELDS
	first_name: requiredTextField(2, 255),
	last_name: requiredTextField(2, 255),
	email: z.email({ error: MINI_INPUT_EMAIL }),
	gender: requiredChoiceTextField(),
	is_active: z.boolean(),
	is_staff: z.boolean(),
	// OPTIONAL FIELDS
	can_view: z.boolean(),
	can_create: z.boolean(),
	can_edit: z.boolean(),
	can_delete: z.boolean(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
	globalError: optionalTextField(1, 500),
});

export const profilSchema = z.object({
	first_name: requiredTextField(2, 30),
	last_name: requiredTextField(2, 30),
	gender: optionalChoiceField(),
	avatar: base64ImageField,
	avatar_cropped: base64ImageField,
});

export const reservationSchema = z.object({
	apartment: z.preprocess(
		(val) => (val === undefined || val === '' || val === null ? undefined : Number(val)),
		z.number({ error: () => getTranslations().validation.apartmentRequired }).positive({ error: () => getTranslations().validation.apartmentRequired }),
	),
	guest_name: requiredTextField(2, 200),
	check_in: requiredDateField(() => getTranslations().reservations.checkIn),
	check_out: requiredDateField(() => getTranslations().reservations.checkOut),
	amount: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	payment_source: requiredChoiceTextField(),
	notes: optionalTextField(1, 1000),
	globalError: optionalTextField(1, 500),
}).refine(
	(data) => {
		if (!data.check_in || !data.check_out) return true;
		return data.check_out > data.check_in;
	},
	{
		error: () => getTranslations().validation.departureAfterArrival,
		path: ['check_out'],
	},
);

export const changePasswordSchema = z
	.object({
		old_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, INPUT_PASSWORD_MIN(8)),
		new_password: z.string().min(1, { error: INPUT_REQUIRED }).min(8, INPUT_PASSWORD_MIN(8)),
		new_password2: z.string().min(1, { error: INPUT_REQUIRED }),
		globalError: z.string().optional(),
	})
	.refine((data) => data.new_password === data.new_password2, {
		error: () => getTranslations().validation.passwordsDoNotMatch,
		path: ['new_password2'],
	});

export const costSchema = z.object({
	description: requiredTextField(2, 300),
	amount: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	date: requiredDateField(() => getTranslations().common.date),
	category: requiredChoiceTextField(),
	building: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? null : Number(val)),
		z.number().positive().nullable(),
	),
	globalError: optionalTextField(1, 500),
});

export const localSchema = z.object({
	nom: requiredTextField(2, 200),
	building: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? null : Number(val)),
		z.number().positive().nullable(),
	),
	type_local: requiredChoiceTextField(),
	adresse: optionalTextField(1, 500),
	superficie: optionalTextField(1, 20),
	prix_achat: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	prix_location_mensuel: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	en_location: z.boolean(),
	locataire_nom: optionalTextField(1, 200),
	date_debut_location: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : String(val)),
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: () => getTranslations().validation.invalidDateFormat }).optional(),
	),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});

export const buildingSchema = z.object({
	nom: requiredTextField(2, 200),
	globalError: optionalTextField(1, 500),
});

export const loyerSchema = z.object({
	local: z.preprocess(
		(val) => (val === undefined || val === '' || val === null ? undefined : Number(val)),
		z.number({ error: () => getTranslations().validation.localRequired }).positive({ error: () => getTranslations().validation.localRequired }),
	),
	mois: z.preprocess(
		(val) => (val === undefined || val === '' || val === null ? undefined : Number(val)),
		z.number({ error: () => getTranslations().validation.monthRequired }).min(1, { error: () => getTranslations().validation.invalidMonth }).max(12, { error: () => getTranslations().validation.invalidMonth }),
	),
	annee: z.preprocess(
		(val) => (val === undefined || val === '' || val === null ? undefined : Number(val)),
		z.number({ error: () => getTranslations().validation.yearRequired }).min(2000, { error: () => getTranslations().validation.invalidYear }).max(2100, { error: () => getTranslations().validation.invalidYear }),
	),
	montant: z.preprocess(
		(val) => (val === undefined || val === null ? '' : String(val)),
		z.string().nonempty({ error: INPUT_REQUIRED }),
	),
	paye: z.boolean(),
	date_paiement: z.preprocess(
		(val) => (val === undefined || val === null || val === '' ? undefined : String(val)),
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: () => getTranslations().validation.invalidDateFormat }).optional(),
	),
	notes: optionalTextField(1, 2000),
	globalError: optionalTextField(1, 500),
});

