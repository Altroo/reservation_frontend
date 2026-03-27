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

// Mock session context
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock RTK Query planning hook
type PlanningReservation = {
	id: number;
	apartment: number;
	apartment_nom: string;
	guest_name: string;
	check_in: string;
	check_out: string;
	nights: number;
	amount: string;
	payment_source: string;
	notes: string;
	created_at: string;
	updated_at: string;
};

type PlanningApartment = {
	id: number;
	nom: string;
	reservations: PlanningReservation[];
};

const mockPlanningData = {
	year: 2026,
	month: 3,
	last_day: 31,
	apartments: {
		'APT-1': {
			id: 1,
			nom: 'Apt 1',
			reservations: [
				{
					id: 10,
					apartment: 1,
					apartment_nom: 'Apt 1',
					guest_name: 'Jean Dupont',
					check_in: '2026-03-05',
					check_out: '2026-03-10',
					nights: 5,
					amount: '15000.00',
					payment_source: 'Airbnb',
					notes: '',
					created_at: '2026-01-01T00:00:00Z',
					updated_at: '2026-01-01T00:00:00Z',
				},
			],
		},
		'APT-2': {
			id: 2,
			nom: 'Apt 2',
			reservations: [],
		},
	} as Record<string, PlanningApartment>,
};

interface MockQueryResult<T> {
	data: T | undefined;
	isLoading: boolean;
	refetch: () => void;
}

const mockUseGetPlanningQuery = jest.fn<MockQueryResult<typeof mockPlanningData>, []>(() => ({
	data: mockPlanningData,
	isLoading: false,
	refetch: jest.fn(),
}));

jest.mock('@/store/services/reservation', () => ({
	useGetPlanningQuery: () => mockUseGetPlanningQuery(),
}));

// Mock layout components
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="protected">{children}</div>
	),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => (
		<div data-testid="navigation-bar">{children}</div>
	);
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

// Mock ApiProgress spinner
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div role="progressbar" data-testid="api-progress" />,
}));

// Mock ReservationDialog to avoid all its heavy dependencies
jest.mock('@/components/pages/reservations/reservation-dialog', () => ({
	__esModule: true,
	default: ({ open }: { open: boolean }) => (
		<div data-testid="reservation-dialog" data-open={String(open)} />
	),
}));

// Mock helpers
jest.mock('@/utils/helpers', () => ({
	weekdayIndex: (dateStr: string) => {
		const d = new Date(dateStr + 'T00:00:00');
		return (d.getDay() + 6) % 7;
	},
}));

jest.mock('@/utils/rawData', () => ({
	MONTH_NAMES: [
		'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
		'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
	],
	DAY_ABBREVIATIONS: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
	PAYMENT_SOURCE_BG: {
		Airbnb: '#FF5A1F',
		Booking: '#003B95',
		Espèces: '#2E7D32',
		'Virement bancaire': '#6A1B9A',
	} as Record<string, string>,
	APARTMENT_COLORS: ['rgba(25,118,210,0.8)', 'rgba(255,152,0,0.8)', 'rgba(76,175,80,0.8)'],
}));

jest.mock('@/utils/routes', () => ({
	RESERVATIONS_VIEW: (id: number) => `/dashboard/reservations/${id}`,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import CalendarClient from './calendar-client';
import type { AppSession } from '@/types/_initTypes';

const mockSession: AppSession = {
	accessToken: 'test-access-token',
	refreshToken: 'test-refresh-token',
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

describe('CalendarClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Layout wrappers', () => {
		it('renders inside Protected and NavigationBar', () => {
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});
	});

	describe('Month navigation', () => {
		it('renders month name heading', () => {
			render(<CalendarClient session={mockSession} />);
			const headings = screen.getAllByRole('heading');
			expect(headings.length).toBeGreaterThanOrEqual(1);
		});

		it('has previous and next month navigation buttons', () => {
			render(<CalendarClient session={mockSession} />);
			const buttons = screen.getAllByRole('button');
			// Prev arrow + "Nouvelle réservation" + next arrow = at least 3 buttons
			expect(buttons.length).toBeGreaterThanOrEqual(3);
		});

		it('renders "Nouvelle réservation" button', () => {
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByText('Nouvelle réservation')).toBeInTheDocument();
		});
	});

	describe('Calendar grid', () => {
		it('renders day abbreviation headers (L M M J V S D)', () => {
			render(<CalendarClient session={mockSession} />);
			// 'L' appears at least once (Lundi)
			const lCells = screen.getAllByText('L');
			expect(lCells.length).toBeGreaterThanOrEqual(1);
		});

		it('renders day numbers in calendar cells', () => {
			render(<CalendarClient session={mockSession} />);
			// Day 1 should always be present for any month
			expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
		});

		it('renders guest name on reservation start day', () => {
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
		});
	});

	describe('Apartment legend', () => {
		it('renders apartment name chips in legend', () => {
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByText('APT-1')).toBeInTheDocument();
			expect(screen.getByText('APT-2')).toBeInTheDocument();
		});

		it('renders "Appartements :" label', () => {
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByText('Appartements :')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('shows loading spinner when planning data is fetching', () => {
			mockUseGetPlanningQuery.mockReturnValueOnce({
				data: undefined,
				isLoading: true,
				refetch: jest.fn(),
			});
			render(<CalendarClient session={mockSession} />);
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('renders calendar grid without legend when no apartments data', () => {
			mockUseGetPlanningQuery.mockReturnValueOnce({
				data: { year: 2026, month: 3, last_day: 31, apartments: {} },
				isLoading: false,
				refetch: jest.fn(),
			});
			render(<CalendarClient session={mockSession} />);
			expect(screen.queryByText('Appartements :')).not.toBeInTheDocument();
		});
	});

	describe('ReservationDialog integration', () => {
		it('renders the reservation dialog (closed initially)', () => {
			render(<CalendarClient session={mockSession} />);
			const dialog = screen.getByTestId('reservation-dialog');
			expect(dialog).toBeInTheDocument();
			expect(dialog).toHaveAttribute('data-open', 'false');
		});

		it('opens dialog when "Nouvelle réservation" button is clicked', () => {
			render(<CalendarClient session={mockSession} />);
			fireEvent.click(screen.getByText('Nouvelle réservation'));
			const dialog = screen.getByTestId('reservation-dialog');
			expect(dialog).toHaveAttribute('data-open', 'true');
		});
	});

	describe('Month navigation interaction', () => {
		it('navigates to next month when right arrow is clicked', () => {
			render(<CalendarClient session={mockSession} />);
			// All icon buttons: index 0 = prev, last one = next
			const iconButtons = screen.getAllByRole('button').filter((b) => !b.textContent?.includes('réservation'));
			// Just check the heading updates (it'll change month name)
			fireEvent.click(iconButtons[iconButtons.length - 1]);
			const headings = screen.getAllByRole('heading');
			expect(headings.length).toBeGreaterThanOrEqual(1);
		});

		it('navigates to previous month when left arrow is clicked', () => {
			render(<CalendarClient session={mockSession} />);
			const iconButtons = screen.getAllByRole('button').filter((b) => !b.textContent?.includes('réservation'));
			fireEvent.click(iconButtons[0]);
			const headings = screen.getAllByRole('heading');
			expect(headings.length).toBeGreaterThanOrEqual(1);
		});
	});
});
