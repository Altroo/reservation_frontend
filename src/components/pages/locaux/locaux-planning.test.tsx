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
const mockUseGetLocalPlanningQuery = jest.fn();
const mockUseGetLocalYearsQuery = jest.fn();
const mockToggleLoyerPaid = jest.fn().mockResolvedValue({});

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetLocalPlanningQuery: (params: unknown, options: unknown) => mockUseGetLocalPlanningQuery(params, options),
	useGetLocalYearsQuery: (params: unknown, options: unknown) => mockUseGetLocalYearsQuery(params, options),
	useToggleLoyerPaidMutation: () => [mockToggleLoyerPaid, { isLoading: false }],
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

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import LocauxPlanningClient from './locaux-planning';
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

const mockPlanningData = {
	year: 2025,
	locaux: [
		{
			id: 1,
			nom: 'Bureau Centre',
			type_local: 'Bureau',
			en_location: true,
			locataire_nom: 'SARL Test',
			prix_location_mensuel: '5000',
			months: {
				1: { id: 10, montant: '5000', paye: true, date_paiement: '2025-01-15' },
				2: { id: 11, montant: '5000', paye: false, date_paiement: null },
				3: null,
			},
		},
		{
			id: 2,
			nom: 'Magasin Nord',
			type_local: 'Magasin',
			en_location: false,
			locataire_nom: '',
			prix_location_mensuel: '3000',
			months: {},
		},
	],
};

describe('LocauxPlanningClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetLocalYearsQuery.mockReturnValue({
			data: { years: [2025, 2024] },
			isLoading: false,
		});
		mockUseGetLocalPlanningQuery.mockReturnValue({
			data: mockPlanningData,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText(`Planning des Locaux ${new Date().getFullYear()}`)).toBeInTheDocument();
	});

	it('renders year dropdown', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('renders year display', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getAllByText(new Date().getFullYear().toString()).length).toBeGreaterThanOrEqual(1);
	});

	it('renders month headers', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText('Jan')).toBeInTheDocument();
		expect(screen.getByText('Fév')).toBeInTheDocument();
		expect(screen.getByText('Déc')).toBeInTheDocument();
	});

	it('renders local names in planning table', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText('Bureau Centre')).toBeInTheDocument();
		expect(screen.getByText('Magasin Nord')).toBeInTheDocument();
	});

	it('renders selected year in dropdown', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText(new Date().getFullYear().toString())).toBeInTheDocument();
	});

	it('renders legend items', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText('Détail des loyers par local')).toBeInTheDocument();
	});

	it('navigates to local view on local name click', () => {
		render(<LocauxPlanningClient session={mockSession} />);
		fireEvent.click(screen.getByText('Bureau Centre'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/1');
	});

	it('shows loading state', () => {
		mockUseGetLocalPlanningQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('shows empty state when no locaux', () => {
		mockUseGetLocalPlanningQuery.mockReturnValue({
			data: { year: 2025, locaux: [] },
			isLoading: false,
		});
		render(<LocauxPlanningClient session={mockSession} />);
		expect(screen.getByText('Aucun local enregistré.')).toBeInTheDocument();
	});
});
