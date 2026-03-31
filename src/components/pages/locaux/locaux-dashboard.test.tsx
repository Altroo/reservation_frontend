import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock RTK Query hooks
const mockUseGetLocalDashboardQuery = jest.fn();
const mockUseGetLocalYearsQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetLocalDashboardQuery: (params: unknown, options: unknown) => mockUseGetLocalDashboardQuery(params, options),
	useGetLocalYearsQuery: (params: unknown, options: unknown) => mockUseGetLocalYearsQuery(params, options),
	useGetBuildingsQuery: () => ({ data: [] }),
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/routes', () => ({
	LOCAUX_LIST: '/dashboard/locaux',
	LOCAUX_VIEW: (id: number) => `/dashboard/locaux/${id}`,
}));

jest.mock('@/utils/rawData', () => ({
	TYPE_LOCAL_CHIP_COLORS: {
		Bureau: 'primary',
		Magasin: 'warning',
	},
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import LocauxDashboardClient from './locaux-dashboard';
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
		image: null,
	},
};

const mockDashboardData = {
	year: 2025,
	total_benefice_ht: '60000',
	total_en_location: 3,
	total_libres: 1,
	locaux: [
		{
			id: 1,
			nom: 'Bureau Centre',
			type_local: 'Bureau',
			en_location: true,
			prix_achat: '500000',
			prix_location_mensuel: '5000',
			rentabilite: '12.00',
			loyers_payes: '30000',
			loyers_impayes: '10000',
		},
		{
			id: 2,
			nom: 'Magasin Nord',
			type_local: 'Magasin',
			en_location: false,
			prix_achat: '300000',
			prix_location_mensuel: '3000',
			rentabilite: '8.50',
			loyers_payes: '18000',
			loyers_impayes: '6000',
		},
	],
};

describe('LocauxDashboardClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetLocalYearsQuery.mockReturnValue({
			data: { years: [2025, 2024] },
			isLoading: false,
		});
		mockUseGetLocalDashboardQuery.mockReturnValue({
			data: mockDashboardData,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText('Dashboard des Locaux')).toBeInTheDocument();
	});

	it('renders year dropdown with available years', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
	});

	it('renders KPI cards', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText(/Bénéfice HT/)).toBeInTheDocument();
		expect(screen.getAllByText('En location').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Libres')).toBeInTheDocument();
	});

	it('renders KPI values', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText(/60[\s\u00a0.]?000/)).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
	});

	it('renders rentabilite table header', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText('Rentabilité par local')).toBeInTheDocument();
	});

	it('renders local names in table', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText('Bureau Centre')).toBeInTheDocument();
		expect(screen.getByText('Magasin Nord')).toBeInTheDocument();
	});

	it('renders selected year in dropdown', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
	});

	it('navigates to local view on row click', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		fireEvent.click(screen.getByText('Bureau Centre'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/1');
	});

	it('shows loading state', () => {
		mockUseGetLocalDashboardQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('shows empty state when no locaux', () => {
		mockUseGetLocalDashboardQuery.mockReturnValue({
			data: { year: 2025, total_benefice_ht: '0', total_en_location: 0, total_libres: 0, locaux: [] },
			isLoading: false,
		});
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText('Aucun local enregistré.')).toBeInTheDocument();
	});

	it('renders type chips in table', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		const bureauChips = screen.getAllByText('Bureau');
		expect(bureauChips.length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('Magasin')).toBeInTheDocument();
	});

	it('renders rentabilite percentages', () => {
		render(<LocauxDashboardClient session={mockSession} />);
		expect(screen.getByText('12.00%')).toBeInTheDocument();
		expect(screen.getByText('8.50%')).toBeInTheDocument();
	});
});
