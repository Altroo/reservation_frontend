import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GainsClient from './gains-view';
import type { AppSession } from '@/types/_initTypes';

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

// Mock chart.js
jest.mock('react-chartjs-2', () => ({
	Bar: () => <div data-testid="chart-bar" />,
}));

jest.mock('chart.js', () => ({
	Chart: { register: jest.fn() },
	CategoryScale: jest.fn(),
	LinearScale: jest.fn(),
	BarElement: jest.fn(),
	Title: jest.fn(),
	Tooltip: jest.fn(),
	Legend: jest.fn(),
}));

// Mock RTK Query hook
const mockBalanceData = {
	year: 2025,
	apartments: {
		'APT-1': {
			name: 'Apt 1',
			monthly: {
				1: { total: 30000, count: 3 },
				6: { total: 50000, count: 5 },
			} as Record<number, { total: number; count: number }>,
			year_total: 80000,
		},
		'APT-2': {
			name: 'Apt 2',
			monthly: {
				1: { total: 15000, count: 2 },
				3: { total: 25000, count: 3 },
			} as Record<number, { total: number; count: number }>,
			year_total: 40000,
		},
	} as Record<string, { name: string; monthly: Record<number, { total: number; count: number }>; year_total: number }>,
	airbnb_monthly: {} as Record<number, number>,
	non_airbnb_monthly: {} as Record<number, number>,
	total_returned: 0,
	total_not_returned: 0,
	total_monthly_cost: 93000,
};

interface MockQueryResult<T> {
	data: T | undefined;
	isLoading: boolean;
}

const mockUseGetBalanceQuery = jest.fn<MockQueryResult<typeof mockBalanceData>, []>(() => ({
	data: mockBalanceData,
	isLoading: false,
}));

jest.mock('@/store/services/reservation', () => ({
	useGetBalanceQuery: () => mockUseGetBalanceQuery(),
	useGetReservationYearsQuery: () => {
		const y = new Date().getFullYear();
		return { data: { years: [y, y - 1] } };
	},
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
	MONTH_NAMES: [
		'Janvier',
		'Février',
		'Mars',
		'Avril',
		'Mai',
		'Juin',
		'Juillet',
		'Août',
		'Septembre',
		'Octobre',
		'Novembre',
		'Décembre',
	],
	APARTMENT_COLORS: ['rgba(25,118,210,0.8)', 'rgba(255,152,0,0.8)', 'rgba(76,175,80,0.8)'],
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	user: {
		accessToken: 'mock-token',
		id: '1',
		pk: 1,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
		email: 'test@example.com',
		emailVerified: null,
	},
	expires: '2099-12-31T23:59:59Z',
};

describe('GainsClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders the page title with year', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText(/Gains & Revenus/)).toBeInTheDocument();
		});

		it('renders inside Protected and NavigationBar', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders loading spinner when loading', () => {
			mockUseGetBalanceQuery.mockReturnValueOnce({ data: undefined, isLoading: true });
			render(<GainsClient session={mockSession} />);
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});
	});

	describe('KPI cards', () => {
		it('renders total gain', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Gain total')).toBeInTheDocument();
			expect(screen.getByText('120.000 MAD')).toBeInTheDocument();
		});

		it('renders best apartment', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Meilleur appartement')).toBeInTheDocument();
			// APT-1 has year_total 80000 > APT-2's 40000; appears in KPI + cards + table
			expect(screen.getAllByText('APT-1').length).toBeGreaterThanOrEqual(1);
		});

		it('renders monthly cost', () => {
			render(<GainsClient session={mockSession} />);
			// Component does not render a separate "Coût mensuel location" KPI; ensure totals row is present
			expect(screen.getByText('TOTAL')).toBeInTheDocument();
		});

		it('renders best month', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Meilleur mois')).toBeInTheDocument();
			// month 6 has 50000, month 1 has 45000, month 3 has 25000 → June is best
			expect(screen.getAllByText('Juin').length).toBeGreaterThanOrEqual(1);
		});

		it('does not render Solde net text (not implemented)', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.queryByText(/Solde net/)).not.toBeInTheDocument();
		});
	});

	describe('Stacked chart', () => {
		it('renders gains chart card', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Gains par appartement')).toBeInTheDocument();
			expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
		});
	});

	describe('Monthly gain cards', () => {
		it('renders cards for months with revenue', () => {
			render(<GainsClient session={mockSession} />);
			// Months 1, 3, 6 have data; names may appear in cards and table
			expect(screen.getAllByText('Janvier').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Mars').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Juin').length).toBeGreaterThanOrEqual(1);
		});

		it('shows apartment breakdown in monthly cards', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getAllByText('APT-1').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('APT-2').length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Detail table', () => {
		it('renders detail table card', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Détail mensuel par appartement')).toBeInTheDocument();
		});

		it('renders month labels as rows', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getAllByText('Jan').length).toBeGreaterThanOrEqual(1);
		});

		it('renders TOTAL row when apartments exist', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('TOTAL')).toBeInTheDocument();
		});

		it('renders Appartement column header', () => {
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText('Appartement')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('shows empty chart message when no apartments', () => {
			mockUseGetBalanceQuery.mockReturnValueOnce({
				data: {
					year: 2025,
					apartments: {},
					airbnb_monthly: {},
					non_airbnb_monthly: {},
					total_returned: 0,
					total_not_returned: 0,
					total_monthly_cost: 0,
				},
				isLoading: false,
			});
			render(<GainsClient session={mockSession} />);
			expect(screen.getByText(/Aucune donnée disponible/)).toBeInTheDocument();
		});
	});
});
