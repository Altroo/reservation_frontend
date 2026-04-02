import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock RTK Query hooks
const mockUseGetLocalQuery = jest.fn();
const mockCreateLocal = jest.fn();
const mockUpdateLocal = jest.fn();
const mockDeleteLoyer = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockToggleLoyerPaid = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockCreateLoyer = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUpdateLoyer = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetLoyersListQuery = jest.fn();
const mockCreateBuilding = jest.fn(() => ({ unwrap: () => Promise.resolve({ id: 2, nom: 'New Building' }) }));
const mockUpdateBuilding = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockDeleteBuilding = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetLocalQuery: (params: unknown, options: unknown) => mockUseGetLocalQuery(params, options),
	useCreateLocalMutation: () => [mockCreateLocal, { isLoading: false }],
	useUpdateLocalMutation: () => [mockUpdateLocal, { isLoading: false }],
	useGetLoyersListQuery: (params: unknown, options: unknown) => mockUseGetLoyersListQuery(params, options),
	useGetLocalYearsQuery: () => ({ data: { years: [2025] }, isLoading: false }),
	useCreateLoyerMutation: () => [mockCreateLoyer, { isLoading: false }],
	useUpdateLoyerMutation: () => [mockUpdateLoyer, { isLoading: false }],
	useDeleteLoyerMutation: () => [mockDeleteLoyer, { isLoading: false }],
	useToggleLoyerPaidMutation: () => [mockToggleLoyerPaid, { isLoading: false }],
	useGetBuildingsQuery: () => ({ data: [{ id: 1, nom: 'Building A' }], isLoading: false }),
	useCreateBuildingMutation: () => [mockCreateBuilding, { isLoading: false }],
	useUpdateBuildingMutation: () => [mockUpdateBuilding, { isLoading: false }],
	useDeleteBuildingMutation: () => [mockDeleteBuilding, { isLoading: false }],
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`autocomplete-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type }: { buttonText: string; type?: string }) => (
		<button data-testid="submit-button" type={type as 'submit' | 'button'}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/utils/themes', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { createTheme } = require('@mui/material/styles');
	const defaultTheme = createTheme();
	return {
		textInputTheme: jest.fn(() => defaultTheme),
		customDropdownTheme: jest.fn(() => defaultTheme),
	};
});

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((_labels: unknown, key: string) => key),
	setFormikAutoErrors: jest.fn(),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	hexToRGB: (hex: string, alpha?: number) => (alpha !== undefined ? `rgba(0,0,0,${alpha})` : 'rgb(0,0,0)'),
}));

jest.mock('@/utils/rawData', () => ({
	typeLocalItemsList: [
		{ code: 'Bureau', value: 'Bureau' },
		{ code: 'Magasin', value: 'Magasin' },
	],
	LOCAL_FIELD_LABELS: {},
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	localSchema: { parse: jest.fn() },
	loyerSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	LOCAUX_LIST: '/dashboard/locaux',
	LOCAUX_EDIT: (id: number) => `/dashboard/locaux/${id}/edit`,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	submitButton: 'submitButton',
}));

// Mock ActionModals
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({
		title,
		body,
		actions,
	}: {
		title: string;
		body: string;
		actions: Array<{ text: string; onClick: () => void }>;
	}) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2>
			<p>{body}</p>
			<div>
				{actions.map((action) => (
					<button key={action.text} onClick={action.onClick}>
						{action.text}
					</button>
				))}
			</div>
		</div>
	),
}));

// Mock MUI date pickers
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ label }: { label: string }) => (
		<div data-testid="date-picker">
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
	AdapterDateFns: jest.fn(),
}));

import LocalFormClient from './local-form';
import type { AppSession } from '@/types/_initTypes';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		image: null,
	},
};

const mockLocalData = {
	id: 1,
	nom: 'Bureau Test',
	type_local: 'Bureau',
	adresse: '10 Rue',
	superficie: '100',
	prix_achat: '500000',
	prix_location_mensuel: '5000',
	en_location: false,
	locataire_nom: '',
	date_debut_location: null,
	notes: '',
};

const mockLoyers = [
	{
		id: 10,
		local: 1,
		local_nom: 'Bureau Test',
		mois: 1,
		annee: 2025,
		montant: '5000',
		paye: true,
		date_paiement: '2025-01-15',
		notes: '',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-01-01T00:00:00Z',
		date_updated: '2025-01-15T00:00:00Z',
	},
	{
		id: 11,
		local: 1,
		local_nom: 'Bureau Test',
		mois: 2,
		annee: 2025,
		montant: '5000',
		paye: false,
		date_paiement: null,
		notes: '',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-02-01T00:00:00Z',
		date_updated: '2025-02-01T00:00:00Z',
	},
];

describe('LocalFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetLocalQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseGetLoyersListQuery.mockReturnValue({
			data: [],
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders back button with list text', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByText('Liste des locaux')).toBeInTheDocument();
		});

		it('renders form fields', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByTestId('input-nom')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-type_local')).toBeInTheDocument();
			expect(screen.getByTestId('input-adresse')).toBeInTheDocument();
			expect(screen.getByTestId('input-superficie')).toBeInTheDocument();
		});

		it('renders financial fields', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByTestId('input-prix_achat')).toBeInTheDocument();
			expect(screen.getByTestId('input-prix_location_mensuel')).toBeInTheDocument();
		});

		it('renders notes field', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByTestId('input-notes')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Nouveau local');
		});

		it('renders section headers', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByText('Informations du local')).toBeInTheDocument();
			expect(screen.getByText('Financier')).toBeInTheDocument();
			expect(screen.getByText('Location')).toBeInTheDocument();
			expect(screen.getAllByText('Notes').length).toBeGreaterThanOrEqual(1);
		});

		it('calls useGetLocalQuery with skip=true (add mode has no id)', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(mockUseGetLocalQuery).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ skip: true }),
			);
		});
		it('does not render loyers section in add mode', () => {
			render(<LocalFormClient session={mockSession} />);
			expect(screen.queryByText('Loyers')).not.toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		beforeEach(() => {
			mockUseGetLocalQuery.mockReturnValue({
				data: mockLocalData,
				isLoading: false,
			});
			mockUseGetLoyersListQuery.mockReturnValue({
				data: mockLoyers,
				isLoading: false,
			});
		});

		it('renders submit button with update text', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('renders back button with list text in edit mode', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Liste des locaux')).toBeInTheDocument();
		});

		it('calls useGetLocalQuery with skip=false (edit mode has id and token)', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(mockUseGetLocalQuery).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				expect.objectContaining({ skip: false }),
			);
		});

		it('renders Loyers section in edit mode', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Loyers')).toBeInTheDocument();
		});

		it('renders Ajouter loyer button in edit mode', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Ajouter')).toBeInTheDocument();
		});

		it('renders loyer rows in edit mode', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Jan')).toBeInTheDocument();
			expect(screen.getByText('Fév')).toBeInTheDocument();
		});

		it('renders loyer paid/unpaid chips in edit mode', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Payé')).toBeInTheDocument();
			expect(screen.getByText('Impayé')).toBeInTheDocument();
		});

		it('shows empty loyer message when no loyers', () => {
			mockUseGetLoyersListQuery.mockReturnValue({
				data: [],
				isLoading: false,
			});
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText(/Aucun loyer enregistré/)).toBeInTheDocument();
		});

		it('renders loyer Actions column header', () => {
			render(<LocalFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Actions')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('shows loader when create mutation is loading', () => {
			const service = jest.requireMock('@/store/services/reservation') as {
				useCreateLocalMutation: () => [jest.Mock, { isLoading: boolean }];
			};
			service.useCreateLocalMutation = () => [mockCreateLocal, { isLoading: true }];

			render(<LocalFormClient session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
