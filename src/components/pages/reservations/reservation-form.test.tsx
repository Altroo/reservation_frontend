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

// Mock reservation service hooks
const mockUseGetReservationQuery = jest.fn();
const mockCreateReservation = jest.fn();
const mockUpdateReservation = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetReservationQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetReservationQuery(params, options),
	useGetApartmentsQuery: () => ({
		data: [
			{ id: 1, code: 'APT-01', name: 'Appartement Luxe' },
			{ id: 2, code: 'APT-02', name: 'Studio Marina' },
		],
		isLoading: false,
	}),
	useCreateReservationMutation: () => [mockCreateReservation, { isLoading: false, error: undefined }],
	useUpdateReservationMutation: () => [mockUpdateReservation, { isLoading: false, error: undefined }],
	useAddApartmentMutation: () => [jest.fn(), { isLoading: false }],
	useUpdateApartmentMutation: () => [jest.fn().mockResolvedValue({ data: {} }), { isLoading: false }],
	useDeleteApartmentMutation: () => [jest.fn().mockResolvedValue({ data: {} }), { isLoading: false }],
	useGetOccupiedDatesQuery: () => ({ data: [], isLoading: false }),
	useGetBuildingsQuery: () => ({ data: [{ id: 1, nom: 'Building A' }], isLoading: false }),
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

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/components/shared/addEntityModal/addEntityModal', () => ({
	__esModule: true,
	default: () => <div data-testid="add-entity-modal" />,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

// Mock Protected
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/rawData', () => ({
	paymentSourceItemsList: [
		{ code: 'Airbnb', value: 'Airbnb' },
		{ code: 'Booking', value: 'Booking' },
	],
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	reservationSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	RESERVATIONS_LIST: '/dashboard/reservations',
	RESERVATIONS_VIEW: (id: number) => `/dashboard/reservations/${id}`,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	errorMessage: 'errorMessage',
	submitButton: 'submitButton',
}));

import ReservationFormClient from './reservation-form';
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
	},
};

describe('ReservationFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetReservationQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders back button with list text', () => {
			render(<ReservationFormClient session={mockSession} />);
			expect(screen.getByText('Liste des réservations')).toBeInTheDocument();
		});

		it('renders form fields', () => {
			render(<ReservationFormClient session={mockSession} />);
			expect(screen.getByTestId('autocomplete-apartment')).toBeInTheDocument();
			expect(screen.getByTestId('input-guest_name')).toBeInTheDocument();
			expect(screen.getByTestId('input-amount')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-payment_source')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			render(<ReservationFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter la réservation');
		});

		it('renders section headers', () => {
			render(<ReservationFormClient session={mockSession} />);
			expect(screen.getByText('Détails de la réservation')).toBeInTheDocument();
			expect(screen.getByText('Dates du séjour')).toBeInTheDocument();
			expect(screen.getByText('Paiement')).toBeInTheDocument();
			expect(screen.getByText('Notes')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders back button with list text', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: {
					id: 1,
					apartment: 1,
					guest_name: 'Ahmed',
					check_in: '2024-06-01',
					check_out: '2024-06-05',
					amount: '5000',
					payment_source: 'Airbnb',
					notes: '',
				},
				isLoading: false,
				error: undefined,
			});

			render(<ReservationFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Liste des réservations')).toBeInTheDocument();
		});

		it('renders submit button with update text', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: { id: 1, apartment: 1, guest_name: 'Ahmed', amount: '5000' },
				isLoading: false,
				error: undefined,
			});

			render(<ReservationFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: undefined,
			});

			render(<ReservationFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Hook calls', () => {
		it('calls useGetReservationQuery when in edit mode', () => {
			render(<ReservationFormClient session={mockSession} id={456} />);
			expect(mockUseGetReservationQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});

		it('calls useGetReservationQuery with skip when not in edit mode', () => {
			render(<ReservationFormClient session={mockSession} />);
			expect(mockUseGetReservationQuery).toHaveBeenCalled();
		});
	});

	describe('Error state', () => {
		it('renders with API error in edit mode', () => {
			// The ApiAlert is driven by mutation error (updateError), not query error
			const service = jest.requireMock('@/store/services/reservation') as {
				useUpdateReservationMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			service.useUpdateReservationMutation = () => [
				mockUpdateReservation,
				{ isLoading: false, error: { status: 500, data: { message: 'Server Error' } } },
			];

			render(<ReservationFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('handles create mutation loading state', () => {
			const service = jest.requireMock('@/store/services/reservation') as {
				useCreateReservationMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			service.useCreateReservationMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			render(<ReservationFormClient session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('handles update mutation loading state', () => {
			const service = jest.requireMock('@/store/services/reservation') as {
				useUpdateReservationMutation: () => [jest.Mock, { isLoading: boolean; error?: unknown }];
			};
			const mockMutate = jest.fn();
			service.useUpdateReservationMutation = () => [mockMutate, { isLoading: true, error: undefined }];

			mockUseGetReservationQuery.mockReturnValue({
				data: { id: 1, apartment: 1, guest_name: 'Test', amount: '100' },
				isLoading: false,
				error: undefined,
			});

			render(<ReservationFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});



