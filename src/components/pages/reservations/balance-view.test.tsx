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
	airbnb_monthly: { 1: 8000, 6: 20000 } as Record<number, number>,
	non_airbnb_monthly: { 1: 2000, 3: 15000, 6: 5000 } as Record<number, number>,
	total_monthly_cost: 186000,
};

const mockUseGetBalanceQuery = jest.fn(() => ({
	data: mockBalanceData,
	isLoading: false,
}));

jest.mock('@/store/services/reservation', () => ({
	useGetBalanceQuery: (...args: unknown[]) => mockUseGetBalanceQuery(...args),
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

const mockSession: AppSession = {
	accessToken: 'mock-token',
	user: {
		accessToken: 'mock-token',
		id: '1',
		name: 'Test User',
		email: 'test@example.com',
		emailVerified: null,
	},
	expires: '2099-12-31T23:59:59Z',
};

describe('BalanceClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders the page title with year', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText(/Balance/)).toBeInTheDocument();
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
		it('renders global revenue', () => {
			render(<BalanceClient session={mockSession} />);
			// 28000 airbnb + 22000 non-airbnb = 50000
			expect(screen.getByText('50.000 MAD')).toBeInTheDocument();
		});

		it('renders total Airbnb revenue', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('28.000 MAD')).toBeInTheDocument();
		});

		it('renders total non-Airbnb revenue', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('22.000 MAD')).toBeInTheDocument();
		});

		it('renders apartment count', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('2')).toBeInTheDocument();
		});

		it('renders KPI labels', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Revenu global')).toBeInTheDocument();
			expect(screen.getByText('Total Airbnb')).toBeInTheDocument();
			expect(screen.getByText('Total Hors-Airbnb')).toBeInTheDocument();
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

	describe('Chart', () => {
		it('renders Airbnb vs non-Airbnb chart', () => {
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText('Airbnb vs Hors-Airbnb')).toBeInTheDocument();
			expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('shows empty table row when no apartments', () => {
			mockUseGetBalanceQuery.mockReturnValueOnce({
				data: {
					year: 2025,
					apartments: {},
					airbnb_monthly: {},
					non_airbnb_monthly: {},
					total_monthly_cost: 0,
				},
				isLoading: false,
			});
			render(<BalanceClient session={mockSession} />);
			expect(screen.getByText(/Aucune donnée disponible/)).toBeInTheDocument();
		});
	});
});
