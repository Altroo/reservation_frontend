import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock session helper
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn(() => 'mock-token'),
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteReservation = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetReservationQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetReservationQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetReservationQuery(params, options),
	useDeleteReservationMutation: jest.fn(() => [mockDeleteReservation, { isLoading: false }]),
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	RESERVATIONS_LIST: '/dashboard/reservations',
	RESERVATIONS_EDIT: (id: number) => `/dashboard/reservations/${id}/edit`,
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

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/utils/rawData', () => ({
	PAYMENT_SOURCE_CHIP_COLORS: { Airbnb: 'warning', Booking: 'info' } as Record<string, string>,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import ReservationViewClient from './reservation-view';
import type { AppSession } from '@/types/_initTypes';

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		pk: 1,
		email: 'test@example.com',
		first_name: 'Test',
		last_name: 'User',
		id: '1',
		emailVerified: null,
		name: 'Test User',
	},
};

const mockReservation = {
	id: 42,
	apartment: 1,
	apartment_code: 'APT-01',
	apartment_name: 'Appartement Luxe',
	guest_name: 'Ahmed Ben Ali',
	check_in: '2024-06-01',
	check_out: '2024-06-05',
	nights: 4,
	amount: '5000',
	payment_source: 'Airbnb',
	notes: 'Late check-in requested',
};

describe('ReservationViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetReservationQuery.mockReturnValue({
			data: mockReservation,
			isLoading: false,
			error: undefined,
		});
	});
	afterEach(() => cleanup());

	describe('Rendering with data', () => {
		it('renders reservation header with id', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Réservation #42')).toBeInTheDocument();
		});

		it('renders guest name', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Ahmed Ben Ali')).toBeInTheDocument();
		});

		it('renders apartment chip', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			const chips = screen.getAllByText('APT-01 — Appartement Luxe');
			expect(chips.length).toBeGreaterThanOrEqual(1);
		});

		it('renders payment source chip', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			const airbnbChips = screen.getAllByText('Airbnb');
			expect(airbnbChips.length).toBeGreaterThanOrEqual(1);
		});

		it('renders section headers', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Informations du séjour')).toBeInTheDocument();
			expect(screen.getByText('Paiement')).toBeInTheDocument();
		});

		it('renders notes section when notes exist', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Notes')).toBeInTheDocument();
			expect(screen.getByText('Late check-in requested')).toBeInTheDocument();
		});

		it('renders back button', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Liste des réservations')).toBeInTheDocument();
		});

		it('renders edit and delete buttons', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Modifier')).toBeInTheDocument();
			expect(screen.getByText('Supprimer')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates back to list on back button click', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			fireEvent.click(screen.getByText('Liste des réservations'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations');
		});

		it('navigates to edit page on Modifier click', () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			fireEvent.click(screen.getByText('Modifier'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations/42/edit');
		});
	});

	describe('Delete action', () => {
		it('opens delete modal on Supprimer click', async () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			await act(async () => { fireEvent.click(screen.getByText('Supprimer')); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			await act(async () => { fireEvent.click(screen.getByText('Supprimer')); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes and redirects on confirm', async () => {
			render(<ReservationViewClient session={mockSession} id={42} />);
			await act(async () => { fireEvent.click(screen.getByText('Supprimer')); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockDeleteReservation).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Réservation supprimée avec succès');
				expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations');
			});
		});

		it('handles delete error', async () => {
			mockDeleteReservation.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ReservationViewClient session={mockSession} id={42} />);
			await act(async () => { fireEvent.click(screen.getByText('Supprimer')); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression de la réservation');
			});
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetReservationQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Error state', () => {
		it('shows API alert for server errors', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 500, data: { message: 'Server Error' } },
			});
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('shows warning when reservation not found', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			render(<ReservationViewClient session={mockSession} id={42} />);
			expect(screen.getByText('Réservation introuvable')).toBeInTheDocument();
		});
	});

	describe('No notes', () => {
		it('does not render notes section when notes are empty', () => {
			mockUseGetReservationQuery.mockReturnValue({
				data: { ...mockReservation, notes: '' },
				isLoading: false,
				error: undefined,
			});
			render(<ReservationViewClient session={mockSession} id={42} />);
			// Notes section header should not be present when notes is empty string
			const notesHeaders = screen.queryAllByText('Notes');
			// The Notes section is only rendered when reservation.notes is truthy
			expect(notesHeaders.length).toBeLessThanOrEqual(0);
		});
	});
});
