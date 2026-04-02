import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BalanceClient from './balance-view';
import type { AppSession } from '@/types/_initTypes';


jest.mock('@/utils/hooks', () => ({
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
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

// Mock RTK Query hook
const mockBalanceData = {
	year: 2025,
	apartments: {
		'APT-1': {
			monthly: {
				1: { total: 10000, count: 2 },
				6: { total: 25000, count: 5 },
			},
			year_total: 35000,
		},
		'APT-2': {
			monthly: {
				3: { total: 15000, count: 3 },
			},
			year_total: 15000,
		},
	} as Record<string, { monthly: Record<number, { total: number; count: number }>; year_total: number }>,
	total_returned: 28000,
	total_not_returned: 22000,
	reservations: [
		{
			id: 1,
			apartment_nom: 'APT-1',
			guest_name: 'John Doe',
			check_in: '2025-01-10',
			check_out: '2025-01-15',
			amount: 10000,
			payment_source: 'Airbnb',
			amount_returned: true,
		},
		{
			id: 2,
			apartment_nom: 'APT-2',
			guest_name: 'Jane Smith',
			check_in: '2025-03-05',
			check_out: '2025-03-10',
			amount: 15000,
			payment_source: 'Bank',
			amount_returned: false,
		},
	],
};

interface MockQueryResult<T> {
	data: T | undefined;
	isLoading: boolean;
}

const mockUseGetBalanceQuery = jest.fn<MockQueryResult<typeof mockBalanceData>, []>(() => ({
	data: mockBalanceData,
	isLoading: false,
}));

const mockToggleAmountReturned = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetBalanceQuery: () => mockUseGetBalanceQuery(),
	useGetReservationYearsQuery: () => {
		const y = new Date().getFullYear();
		return { data: { years: [y, y - 1] } };
	},
	useToggleAmountReturnedMutation: () => [mockToggleAmountReturned],
	useGetBuildingsQuery: () => ({ data: [{ id: 1, nom: 'Building A' }], isLoading: false }),
}));

// Mock layout components
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/utils/rawData', () => ({
	MONTH_LABELS: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

const mockSession = {
	accessToken: 'mock-token',
	user: {
		accessToken: 'mock-token',
		id: '1',
		name: 'Test User',
		email: 'test@example.com',
		emailVerified: null,
		pk: 1,
		first_name: 'Test',
		last_name: 'User',
	},
	expires: '2099-12-31T23:59:59Z',
} as AppSession;

describe('BalanceClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders the page title with year', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/Balance/);
		});

		it('renders inside Protected and NavigationBar', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders loading spinner when loading', () => {
			mockUseGetBalanceQuery.mockReturnValueOnce({ data: undefined, isLoading: true });
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});
	});

	describe('KPI cards', () => {
		it('renders total balance', () => {
			render(<BalanceClient session={mockSession} />);
			// 28000 returned + 22000 not returned = 50000
			expect(screen.getByText('50.000 MAD')).toBeInTheDocument();
		});

		it('renders total returned', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('28.000 MAD')).toBeInTheDocument();
		});

		it('renders total not returned', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('22.000 MAD')).toBeInTheDocument();
		});

		it('renders apartment count', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('2')).toBeInTheDocument();
		});

		it('renders KPI labels', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Balance totale')).toBeInTheDocument();
			expect(screen.getByText('Montant retourné')).toBeInTheDocument();
			expect(screen.getByText('Montant non retourné')).toBeInTheDocument();
			expect(screen.getByText('Appartements')).toBeInTheDocument();
		});
	});

	describe('Matrix table', () => {
		it('renders matrix card title', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Revenus par appartement et par mois')).toBeInTheDocument();
		});

		it('renders apartment rows', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getAllByText('APT-1').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('APT-2').length).toBeGreaterThanOrEqual(1);
		});

		it('renders month headers', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Jan')).toBeInTheDocument();
			expect(screen.getByText('Juin')).toBeInTheDocument();
		});

		it('renders Appartement and Total column headers', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getAllByText('Appartement').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(1);
		});

		it('renders apartment year totals', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('35.000')).toBeInTheDocument();
			// 15.000 appears in both APT-2 total and elsewhere, check at least one exists
			expect(screen.getAllByText('15.000').length).toBeGreaterThanOrEqual(1);
		});

		it('renders TOTAL row', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Detail table', () => {
		it('renders detail table title', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Détail des réservations')).toBeInTheDocument();
		});

		it('renders reservation guest names', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
		});

		it('renders Oui/Non chips for returned status', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Oui')).toBeInTheDocument();
			expect(screen.getByText('Non')).toBeInTheDocument();
		});

		it('renders reservation amounts', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('10.000 MAD')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('shows empty table row when no apartments', () => {
			mockUseGetBalanceQuery.mockReturnValueOnce({
				data: {
					year: 2025,
					apartments: {},
					total_returned: 0,
					total_not_returned: 0,
					reservations: [],
				},
				isLoading: false,
			});
			render(<BalanceClient session={mockSession} />);
			expect(screen.getAllByText(/Aucune donnée disponible/).length).toBeGreaterThanOrEqual(1);
		});
	});
});
