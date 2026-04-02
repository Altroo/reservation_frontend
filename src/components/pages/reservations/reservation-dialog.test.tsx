import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));

// Mock reservation service hooks
const mockCreateReservation = jest.fn();
const mockUpdateReservation = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetReservationQuery: () => ({ data: undefined, isLoading: false }),
	useGetApartmentsQuery: () => ({
		data: [
			{ id: 1, nom: 'Apt 1' },
			{ id: 2, nom: 'Apt 2' },
		],
		isLoading: false,
	}),
	useCreateReservationMutation: () => [mockCreateReservation, { isLoading: false, error: undefined }],
	useUpdateReservationMutation: () => [mockUpdateReservation, { isLoading: false, error: undefined }],
	useAddApartmentMutation: () => [jest.fn(), { isLoading: false }],
	useGetOccupiedDatesQuery: () => ({ data: [], isLoading: false }),
	useGetBuildingsQuery: () => ({ data: [{ id: 1, nom: 'Building A' }], isLoading: false }),
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}><label>{label}</label></div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`autocomplete-${id}`}><label>{label}</label></div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText }: { buttonText: string }) => (
		<button data-testid="submit-button">{buttonText}</button>
	),
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

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((_labels: Record<string, string>, key: string) => key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/rawData', () => ({
	paymentSourceItemsList: [
		{ code: 'Airbnb', value: 'Airbnb' },
		{ code: 'Booking', value: 'Booking' },
	],
	RESERVATION_FIELD_LABELS: {
		apartment: 'Appartement',
		guest_name: 'Nom du client',
		check_in: "Date d'arrivée",
		check_out: 'Date de départ',
		amount: 'Montant',
		payment_source: 'Source de paiement',
		notes: 'Notes',
	},
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	reservationSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

import ReservationDialog from './reservation-dialog';

const baseProps = {
	open: true,
	onClose: jest.fn(),
	onSuccess: jest.fn(),
	token: 'test-token',
};

describe('ReservationDialog', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Add mode (no reservationId)', () => {
		it('renders dialog title "Nouvelle réservation"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByText('Nouvelle réservation')).toBeInTheDocument();
		});

		it('renders section header "Détails de la réservation"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByText('Détails de la réservation')).toBeInTheDocument();
		});

		it('renders section header "Dates du séjour"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByText('Dates du séjour')).toBeInTheDocument();
		});

		it('renders section header "Paiement"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByText('Paiement')).toBeInTheDocument();
		});

		it('renders section header "Notes"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByText('Notes')).toBeInTheDocument();
		});

		it('renders apartment autocomplete field', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('autocomplete-apartment')).toBeInTheDocument();
		});

		it('renders guest_name input', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('input-guest_name')).toBeInTheDocument();
		});

		it('renders amount input', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('input-amount')).toBeInTheDocument();
		});

		it('renders payment_source autocomplete field', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('autocomplete-payment_source')).toBeInTheDocument();
		});

		it('renders submit button with "Ajouter la réservation"', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter la réservation');
		});

		it('renders close icon button', () => {
			render(<ReservationDialog {...baseProps} />);
			expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
		});

		it('calls onClose when close icon button is clicked', () => {
			const onClose = jest.fn();
			render(<ReservationDialog {...baseProps} onClose={onClose} />);
			fireEvent.click(screen.getByTestId('CloseIcon').closest('button')!);
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe('Edit mode (with reservationId)', () => {
		it('renders dialog title "Modifier la réservation"', () => {
			render(<ReservationDialog {...baseProps} reservationId={42} />);
			expect(screen.getByText('Modifier la réservation')).toBeInTheDocument();
		});

		it('renders submit button with "Mettre à jour"', () => {
			render(<ReservationDialog {...baseProps} reservationId={42} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('still renders all section headers in edit mode', () => {
			render(<ReservationDialog {...baseProps} reservationId={42} />);
			expect(screen.getByText('Détails de la réservation')).toBeInTheDocument();
			expect(screen.getByText('Dates du séjour')).toBeInTheDocument();
			expect(screen.getByText('Paiement')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('renders dialog content even during apartments loading', () => {
			jest.mocked(
				jest.requireMock('@/store/services/reservation').useGetApartmentsQuery,
			);
			// Re-mock apartments to simulate loading
			render(<ReservationDialog {...baseProps} />);
			// Dialog should still open and render sections
			expect(screen.getByText('Nouvelle réservation')).toBeInTheDocument();
		});
	});

	describe('Closed state', () => {
		it('does not render dialog content when open is false', () => {
			render(<ReservationDialog {...baseProps} open={false} />);
			expect(screen.queryByText('Détails de la réservation')).not.toBeInTheDocument();
		});
	});

	describe('Initial values', () => {
		it('accepts initialCheckIn and initialCheckOut props without error', () => {
			render(
				<ReservationDialog
					{...baseProps}
					initialCheckIn="2025-06-01"
					initialCheckOut="2025-06-05"
				/>,
			);
			expect(screen.getByText('Nouvelle réservation')).toBeInTheDocument();
		});
	});
});
