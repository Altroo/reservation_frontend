import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock chart.js — prevent canvas errors in JSDOM
jest.mock('react-chartjs-2', () => ({
	Bar: () => <div data-testid="chart-bar" />,
	Doughnut: () => <div data-testid="chart-doughnut" />,
	Line: () => <div data-testid="chart-line" />,
}));

jest.mock('chart.js', () => ({
	Chart: { register: jest.fn() },
	CategoryScale: jest.fn(),
	LinearScale: jest.fn(),
	BarElement: jest.fn(),
	ArcElement: jest.fn(),
	Title: jest.fn(),
	Tooltip: jest.fn(),
	Legend: jest.fn(),
	LineElement: jest.fn(),
	PointElement: jest.fn(),
	Filler: jest.fn(),
}));

// Mock RTK Query hook
const mockDashboardData = {
	year: 2025,
	total_revenue: 150000,
	by_source: [
		{ source: 'Airbnb', total: 80000, count: 10 },
		{ source: 'Booking', total: 70000, count: 8 },
	],
	monthly_revenue: [
		{ month: 1, total: 10000, count: 2 },
		{ month: 2, total: 15000, count: 3 },
		{ month: 3, total: 20000, count: 4 },
		{ month: 4, total: 12000, count: 2 },
		{ month: 5, total: 18000, count: 3 },
		{ month: 6, total: 25000, count: 5 },
		{ month: 7, total: 10000, count: 2 },
		{ month: 8, total: 8000, count: 1 },
		{ month: 9, total: 9000, count: 2 },
		{ month: 10, total: 7000, count: 1 },
		{ month: 11, total: 11000, count: 2 },
		{ month: 12, total: 5000, count: 1 },
	],
	by_apartment: [
		{ code: 'APT-1', name: 'Apt 1', total: 90000, count: 10 },
		{ code: 'APT-2', name: 'Apt 2', total: 60000, count: 8 },
	],
	occupancy_by_apartment: {
		'APT-1': { name: 'Apt 1', occupied_days: 200, reservation_count: 10, revenue: 90000 },
		'APT-2': { name: 'Apt 2', occupied_days: 150, reservation_count: 8, revenue: 60000 },
	} as Record<string, { name: string; occupied_days: number; reservation_count: number; revenue: number }>,
	daily_revenue: [
		{ date: '2025-01-15', total: 5000 },
		{ date: '2025-02-20', total: 8000 },
	],
};

interface MockQueryResult<T> {
	data: T | undefined;
	isLoading: boolean;
}

const mockUseGetDashboardStatsQuery = jest.fn<
	MockQueryResult<typeof mockDashboardData>,
	[{ year: number; building?: number }, { skip: boolean }]
>(() => ({ data: mockDashboardData, isLoading: false }));

jest.mock('@/store/services/reservation', () => ({
	useGetDashboardStatsQuery: (
		params: { year: number; building?: number },
		options: { skip: boolean },
	) => mockUseGetDashboardStatsQuery(params, options),
	useGetReservationYearsQuery: () => {
		const y = new Date().getFullYear();
		return { data: { years: [y, y - 1] } };
	},
	useGetBuildingsQuery: () => ({
		data: [
			{ id: 1, nom: 'Nectar' },
			{ id: 2, nom: 'Hilton residence' },
		],
	}),
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

// Mock rawData
jest.mock('@/utils/rawData', () => ({
	MONTH_LABELS: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
	CHART_COLORS: {
		primary: 'rgba(25,118,210,1)',
		primaryLight: 'rgba(25,118,210,0.3)',
		secondary: 'rgba(255,152,0,1)',
		secondaryLight: 'rgba(255,152,0,0.3)',
		booking: 'rgba(0,113,194,0.75)',
		airbnb: 'rgba(255,90,31,0.75)',
		cash: 'rgba(76,175,80,0.75)',
		bank: 'rgba(156,39,176,0.75)',
	},
	SOURCE_COLORS: {
		Airbnb: 'rgba(255,90,31,0.75)',
		Booking: 'rgba(0,113,194,0.75)',
	} as Record<string, string>,
	APARTMENT_COLORS: ['rgba(25,118,210,0.6)', 'rgba(255,152,0,0.6)', 'rgba(76,175,80,0.6)'],
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import ReservationDashboardClient from './reservation-dashboard';
import type { AppSession } from '@/types/_initTypes';


jest.mock('@/utils/hooks', () => ({
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
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

describe('ReservationDashboardClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders the page title with year', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText(/Vue d'ensemble/)).toBeInTheDocument();
		});

		it('renders inside Protected and NavigationBar', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders loading spinner when loading', () => {
			mockUseGetDashboardStatsQuery.mockReturnValueOnce({ data: undefined, isLoading: true });
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});

		it('requests dashboard data for the selected residence', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			fireEvent.mouseDown(screen.getByLabelText('Résidence'));
			fireEvent.click(screen.getByRole('option', { name: 'Hilton residence' }));
			expect(mockUseGetDashboardStatsQuery).toHaveBeenLastCalledWith(
				{ year: new Date().getFullYear(), building: 2 },
				{ skip: false },
			);
		});
	});

	describe('KPI cards', () => {
		it('renders total revenue', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('150.000 MAD')).toBeInTheDocument();
		});

		it('renders total reservations count', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('18')).toBeInTheDocument();
		});

		it('renders global occupancy percentage', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			// (200+150) / (2*365) * 100 = 47.9%
			expect(screen.getByText('47.9%')).toBeInTheDocument();
		});

		it('renders average revenue per reservation', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			// 150000 / 18 = 8333
			expect(screen.getByText('8.333 MAD')).toBeInTheDocument();
		});

		it('renders best month name', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			// month index 5 (June) has highest revenue 25000
			expect(screen.getByText('Juin')).toBeInTheDocument();
		});

		it('renders KPI labels', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
			expect(screen.getByText('Réservations')).toBeInTheDocument();
			expect(screen.getByText('Occupation')).toBeInTheDocument();
			expect(screen.getByText('Revenu moy. / rés.')).toBeInTheDocument();
			expect(screen.getByText('Meilleur mois')).toBeInTheDocument();
		});
	});

	describe('Charts', () => {
		it('renders monthly revenue bar chart', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Revenus mensuels')).toBeInTheDocument();
			expect(screen.getAllByTestId('chart-bar').length).toBeGreaterThanOrEqual(1);
		});

		it('renders monthly trend line chart', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Tendance mensuelle des revenus')).toBeInTheDocument();
			expect(screen.getByTestId('chart-line')).toBeInTheDocument();
		});

		it('renders source doughnut chart', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Répartition par source')).toBeInTheDocument();
			expect(screen.getByTestId('chart-doughnut')).toBeInTheDocument();
		});

		it('renders apartment revenue bar chart', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Revenus par appartement')).toBeInTheDocument();
		});

		it('renders occupancy bar chart', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText("Jours d'occupation par appartement")).toBeInTheDocument();
		});
	});

	describe('Source breakdown', () => {
		it('renders source breakdown section', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Détail par source de paiement')).toBeInTheDocument();
		});

		it('renders each source with count and total', () => {
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.getByText('Airbnb')).toBeInTheDocument();
			expect(screen.getByText('Booking')).toBeInTheDocument();
			expect(screen.getByText('10 rés.')).toBeInTheDocument();
			expect(screen.getByText('8 rés.')).toBeInTheDocument();
			expect(screen.getByText('80.000 MAD')).toBeInTheDocument();
			expect(screen.getByText('70.000 MAD')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		const emptyData = {
			data: {
				year: 2025,
				total_revenue: 0,
				by_source: [] as typeof mockDashboardData.by_source,
				monthly_revenue: [] as typeof mockDashboardData.monthly_revenue,
				by_apartment: [] as typeof mockDashboardData.by_apartment,
				occupancy_by_apartment: {} as typeof mockDashboardData.occupancy_by_apartment,
				daily_revenue: [] as typeof mockDashboardData.daily_revenue,
			},
			isLoading: false,
		};

		it('renders empty chart placeholders when no data', () => {
			mockUseGetDashboardStatsQuery.mockReturnValue(emptyData);
			render(<ReservationDashboardClient session={mockSession} />);
			const emptyMessages = screen.getAllByText('Aucune donnée disponible');
			expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
			mockUseGetDashboardStatsQuery.mockReturnValue({ data: mockDashboardData, isLoading: false });
		});

		it('does not render source breakdown when empty', () => {
			mockUseGetDashboardStatsQuery.mockReturnValue(emptyData);
			render(<ReservationDashboardClient session={mockSession} />);
			expect(screen.queryByText('Détail par source de paiement')).not.toBeInTheDocument();
			mockUseGetDashboardStatsQuery.mockReturnValue({ data: mockDashboardData, isLoading: false });
		});
	});
});


