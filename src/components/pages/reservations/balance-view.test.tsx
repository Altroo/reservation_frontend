import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

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
jest.mock('@/store/session', () => ({
	getAccessTokenFromSession: jest.fn(() => 'mock-token'),
}));

// Mock RTK Query hook
const mockBalanceData = {
	year: 2025,
	apartments: {
		'APT-1': {
			name: 'Apt 1',
			monthly: {
				1: { total: 10000, count: 2 },
				6: { total: 25000, count: 5 },
			},
			year_total: 35000,
		},
		'APT-2': {
			name: 'Apt 2',
			monthly: {
				3: { total: 15000, count: 3 },
			},
			year_total: 15000,
		},
	},
	total_returned: 28000,
	total_not_returned: 22000,
};

const mockUseGetBalanceQuery = jest.fn(() => ({
	data: mockBalanceData,
	isLoading: false,
}));

jest.mock('@/store/services/reservation', () => ({
	useGetBalanceQuery: (...args: unknown[]) => mockUseGetBalanceQuery(),
	useGetReservationYearsQuery: () => ({ data: { years: [2025, 2024] } }),
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

import BalanceClient from './balance-view';
import type { AppSession } from '@/types/_initTypes';

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
			mockUseGetBalanceQuery.mockReturnValueOnce({ data: undefined, isLoading: true } as any);
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
			expect(screen.getByText('APT-1')).toBeInTheDocument();
			expect(screen.getByText('APT-2')).toBeInTheDocument();
		});

		it('renders month headers', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Jan')).toBeInTheDocument();
			expect(screen.getByText('Juin')).toBeInTheDocument();
		});

		it('renders Appartement and Total column headers', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Appartement')).toBeInTheDocument();
			expect(screen.getByText('Total')).toBeInTheDocument();
		});

		it('renders apartment year totals', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('35.000')).toBeInTheDocument();
			// 15.000 appears in both APT-2 total and elsewhere, check at least one exists
			expect(screen.getAllByText('15.000').length).toBeGreaterThanOrEqual(1);
		});

		it('renders TOTAL row', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('TOTAL')).toBeInTheDocument();
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
				} as any,
				isLoading: false,
			});
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText(/Aucune donnée disponible/)).toBeInTheDocument();
		});
	});
});
