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
const mockDashboardData = {
	occupancy_by_apartment: {
		'APT-1': { name: 'Apt 1', occupied_days: 200, reservation_count: 10, revenue: 90000 },
		'APT-2': { name: 'Apt 2', occupied_days: 150, reservation_count: 8, revenue: 60000 },
	},
};

const nowForTest = new Date();
const testYear = nowForTest.getFullYear();
const testMonth = nowForTest.getMonth() + 1;
const mm = String(testMonth).padStart(2, '0');
const testLastDay = new Date(testYear, testMonth, 0).getDate();

const mockPlanningData = {
	year: testYear,
	month: testMonth,
	last_day: testLastDay,
	apartments: {
		'APT-1': {
			id: 1,
			name: 'Apt 1',
			reservations: [
				{
					id: 1,
					apartment: 1,
					apartment_name: 'Apt 1',
					apartment_code: 'APT-1',
					guest_name: 'Alice Martin',
					check_in: `${testYear}-${mm}-05`,
					check_out: `${testYear}-${mm}-10`,
					nights: 5,
					amount: '5000',
					payment_source: 'Booking',
					payment_source_display: 'Booking',
					notes: null,
					created_by_user: 1,
					created_by_user_name: 'admin',
					date_created: '2025-01-01',
					date_updated: '2025-01-01',
				},
			],
		},
		'APT-2': {
			id: 2,
			name: 'Apt 2',
			reservations: [],
		},
	},
};

const mockUseGetDashboardStatsQuery = jest.fn(() => ({
	data: mockDashboardData,
	isLoading: false,
}));

const mockUseGetPlanningQuery = jest.fn(() => ({
	data: mockPlanningData,
	isFetching: false,
}));

jest.mock('@/store/services/reservation', () => ({
	useGetDashboardStatsQuery: (...args: unknown[]) => mockUseGetDashboardStatsQuery(...args),
	useGetPlanningQuery: (...args: unknown[]) => mockUseGetPlanningQuery(...args),
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
	APARTMENT_COLORS: ['rgba(25,118,210,0.6)', 'rgba(255,152,0,0.6)', 'rgba(76,175,80,0.6)'],
	PAYMENT_SOURCE_BG: {
		Booking: '#1565c0',
		Airbnb: '#bf360c',
		Cash: '#1b5e20',
		Bank: '#4a148c',
		'Bank transfer': '#4a148c',
	},
	MONTH_NAMES: [
		'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
		'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
	],
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (d: string) => d,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import OccupancyClient from './occupancy-view';
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

describe('OccupancyClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders the page title', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText(/Taux d'occupation/)).toBeInTheDocument();
		});

		it('renders inside Protected and NavigationBar', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders loading spinner when loading', () => {
			mockUseGetDashboardStatsQuery.mockReturnValueOnce({ data: undefined, isLoading: true });
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});
	});

	describe('KPI cards', () => {
		it('renders global occupancy percentage', () => {
			render(<OccupancyClient session={mockSession} />);
			// (200+150) / (2*365) * 100 = 47.9%
			expect(screen.getByText('47.9%')).toBeInTheDocument();
		});

		it('renders total revenue', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('150.000 MAD')).toBeInTheDocument();
		});

		it('renders total occupied nights', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('350')).toBeInTheDocument();
		});

		it('renders available nights', () => {
			render(<OccupancyClient session={mockSession} />);
			// 2*365 - 350 = 380
			expect(screen.getByText('380')).toBeInTheDocument();
		});

		it('renders KPI labels', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Occupation globale')).toBeInTheDocument();
			expect(screen.getByText('Revenus annuels')).toBeInTheDocument();
			expect(screen.getByText('Nuits occupées')).toBeInTheDocument();
			expect(screen.getByText('Nuits libres')).toBeInTheDocument();
		});
	});

	describe('Charts and details', () => {
		it('renders occupancy bar chart', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Jours occupés par appartement')).toBeInTheDocument();
			expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
		});

		it('renders apartment detail section', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Détail par appartement')).toBeInTheDocument();
		});

		it('renders apartment codes in progress section', () => {
			render(<OccupancyClient session={mockSession} />);
			// APT codes appear in both progress bars and heatmap
			expect(screen.getAllByText('APT-1').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('APT-2').length).toBeGreaterThanOrEqual(1);
		});

		it('renders occupied days per apartment', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('200 jours')).toBeInTheDocument();
			expect(screen.getByText('150 jours')).toBeInTheDocument();
		});

		it('renders reservation counts per apartment', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('10 réservations')).toBeInTheDocument();
			expect(screen.getByText('8 réservations')).toBeInTheDocument();
		});

		it('renders revenue per apartment', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Revenus: 90.000 MAD')).toBeInTheDocument();
			expect(screen.getByText('Revenus: 60.000 MAD')).toBeInTheDocument();
		});

		it('renders occupancy percentage per apartment', () => {
			render(<OccupancyClient session={mockSession} />);
			// APT-1: round(200/365*100)=55%, APT-2: round(150/365*100)=41%
			expect(screen.getByText('55%')).toBeInTheDocument();
			expect(screen.getByText('41%')).toBeInTheDocument();
		});
	});

	describe('Calendar heatmap', () => {
		it('renders heatmap section title', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Vue calendrier')).toBeInTheDocument();
		});

		it('renders month navigation with current month name', () => {
			render(<OccupancyClient session={mockSession} />);
			// Default month is current month; planning mock is used regardless
			const monthNames = [
				'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
				'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
			];
			const currentMonthName = monthNames[new Date().getMonth()];
			expect(screen.getByText(new RegExp(currentMonthName))).toBeInTheDocument();
		});

		it('renders payment source legend chips', () => {
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Booking')).toBeInTheDocument();
			expect(screen.getByText('Airbnb')).toBeInTheDocument();
			expect(screen.getByText('Cash')).toBeInTheDocument();
			expect(screen.getByText('Bank')).toBeInTheDocument();
			expect(screen.getByText('Vacant')).toBeInTheDocument();
		});

		it('renders apartment rows in the heatmap', () => {
			render(<OccupancyClient session={mockSession} />);
			// Apartment codes appear in both the progress bars AND the heatmap
			expect(screen.getAllByText('APT-1').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('APT-2').length).toBeGreaterThanOrEqual(2);
		});

		it('renders day squares (30 per apartment for June)', () => {
			render(<OccupancyClient session={mockSession} />);
			// Day "1" appears for both apartments = at least 2 occurrences
			expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
		});

		it('renders heatmap stats per apartment', () => {
			render(<OccupancyClient session={mockSession} />);
			// APT-1 has 5 occupied days; APT-2 has 0
			expect(screen.getByText(new RegExp(`5/${testLastDay} jours`))).toBeInTheDocument();
			expect(screen.getByText(new RegExp(`0/${testLastDay} jours`))).toBeInTheDocument();
		});

		it('shows loading spinner when planning data is fetching', () => {
			mockUseGetPlanningQuery.mockReturnValueOnce({ data: undefined, isFetching: true });
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1);
		});

		it('shows empty heatmap message when no planning data', () => {
			mockUseGetPlanningQuery.mockReturnValueOnce({ data: undefined, isFetching: false });
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText(/Aucune donnée pour/)).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('shows empty message when no occupancy data', () => {
			mockUseGetDashboardStatsQuery.mockReturnValueOnce({
				data: { occupancy_by_apartment: {} },
				isLoading: false,
			});
			mockUseGetPlanningQuery.mockReturnValueOnce({ data: undefined, isFetching: false });
			render(<OccupancyClient session={mockSession} />);
			expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument();
		});
	});
});
