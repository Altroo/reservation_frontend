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
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteReservation = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockUseGetReservationsListQuery = jest.fn(() => ({
	data: {
		results: [
			{
				id: 1,
									apartment_code: 'APT-01',
									apartment_name: 'Appartement Luxe',
									apartment_nom: 'APT-01',
				guest_name: 'Ahmed Ben Ali',
				check_in: '2024-06-01',
				check_out: '2024-06-05',
				nights: 4,
				amount: '5000',
				payment_source: 'Airbnb',
			},
			{
				id: 2,
									apartment_code: 'APT-02',
									apartment_name: 'Studio Marina',
									apartment_nom: 'APT-02',
				guest_name: 'Marie Dupont',
				check_in: '2024-07-10',
				check_out: '2024-07-15',
				nights: 5,
				amount: '3500',
				payment_source: 'Booking',
			},
		],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
}));

const mockBulkDeleteReservations = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetReservationsListQuery: () => mockUseGetReservationsListQuery(),
	useDeleteReservationMutation: jest.fn(() => [mockDeleteReservation, { isLoading: false }]),
	useBulkDeleteReservationsMutation: jest.fn(() => [mockBulkDeleteReservations, { isLoading: false }]),
	useGetApartmentsQuery: jest.fn(() => ({ data: [{ id: 1, code: 'APT-01', name: 'Appartement Luxe' }], isLoading: false })),
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	RESERVATIONS_ADD: '/dashboard/reservations/new',
	RESERVATIONS_VIEW: (id: number) => `/dashboard/reservations/${id}`,
	RESERVATIONS_EDIT: (id: number) => `/dashboard/reservations/${id}/edit`,
}));

// Enhanced PaginatedDataGrid mock that calls renderCell
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		columns,
		data,
	}: {
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode;
		}>;
		data?: { results?: Array<Record<string, unknown>> };
		isLoading?: boolean;
		onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	}) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				<table>
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col.field}>{col.headerName}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{results.map((row) => (
							<tr key={row.id as number} data-testid={`row-${row.id}`}>
								{columns.map((col) => (
									<td key={col.field}>
										{col.renderCell
											? col.renderCell({ value: row[col.field], row, field: col.field })
											: String(row[col.field] ?? '')}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	},
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

// Mock MobileActionsMenu
jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">
			{actions.map((a) => (
				<button key={a.label} onClick={a.onClick}>
					{a.label}
				</button>
			))}
		</div>
	),
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({
	createDateRangeFilterOperator: jest.fn(() => []),
}));

jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({
	createNumericFilterOperators: jest.fn(() => []),
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
}));

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: () => <div data-testid="chip-filter-bar" />,
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/utils/rawData', () => ({
	paymentSourceItemsList: [
		{ code: 'Airbnb', value: 'Airbnb' },
		{ code: 'Booking', value: 'Booking' },
	],
	PAYMENT_SOURCE_CHIP_COLORS: { Airbnb: 'warning', Booking: 'info' } as Record<string, string>,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import ReservationsListClient from './reservations-list';
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

describe('ReservationsListClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders paginated data grid', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders Nouvelle réservation button', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByText('Nouvelle réservation')).toBeInTheDocument();
		});

		it('renders data rows', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});
	});

	describe('Column renderCell', () => {
		it('renders guest_name values', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByText('Ahmed Ben Ali')).toBeInTheDocument();
			expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
		});

		it('renders apartment_code as chip', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByText('APT-01')).toBeInTheDocument();
			expect(screen.getByText('APT-02')).toBeInTheDocument();
		});

		it('renders payment_source chips', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByText('Airbnb')).toBeInTheDocument();
			expect(screen.getByText('Booking')).toBeInTheDocument();
		});

		it('renders action buttons for each row', () => {
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getAllByText('Voir').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Supprimer').length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Action handlers', () => {
		it('navigates to add page', () => {
			render(<ReservationsListClient session={mockSession} />);
			fireEvent.click(screen.getByText('Nouvelle réservation'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations/new');
		});

		it('navigates to view page', () => {
			render(<ReservationsListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations/1');
		});

		it('navigates to edit page', () => {
			render(<ReservationsListClient session={mockSession} />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalledWith('/dashboard/reservations/1/edit');
		});

		it('opens delete modal', async () => {
			render(<ReservationsListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer la réservation')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<ReservationsListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes reservation on confirm', async () => {
			render(<ReservationsListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockDeleteReservation).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Réservation supprimée avec succès');
			});
		});

		it('handles delete error', async () => {
			mockDeleteReservation.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ReservationsListClient session={mockSession} />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression de la réservation');
			});
		});
	});

	describe('Column headers', () => {
		it('renders all expected column headers', () => {
			render(<ReservationsListClient session={mockSession} />);
			for (const h of ['Appart.', 'Client', 'Arrivée', 'Départ', 'Nuits', 'Montant', 'Source', 'Actions']) {
				expect(screen.getByText(h)).toBeInTheDocument();
			}
		});
	});

	describe('Loading and empty states', () => {
		it('renders grid when loading', () => {
			mockUseGetReservationsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: true, refetch: mockRefetch });
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders grid when empty', () => {
			mockUseGetReservationsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: false, refetch: mockRefetch });
			render(<ReservationsListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});



