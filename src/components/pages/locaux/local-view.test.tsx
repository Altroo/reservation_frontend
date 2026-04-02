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
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteLocal = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockToggleLoyerPaid = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetLocalQuery = jest.fn();
const mockUseGetLoyersListQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetLocalQuery: (params: unknown, options: unknown) => mockUseGetLocalQuery(params, options),
	useDeleteLocalMutation: jest.fn(() => [mockDeleteLocal, { isLoading: false }]),
	useGetLoyersListQuery: (params: unknown, options: unknown) => mockUseGetLoyersListQuery(params, options),
	useGetLocalYearsQuery: () => ({ data: { years: [2025] }, isLoading: false }),
	useToggleLoyerPaidMutation: () => [mockToggleLoyerPaid, { isLoading: false }],
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	LOCAUX_LIST: '/dashboard/locaux',
	LOCAUX_EDIT: (id: number) => `/dashboard/locaux/${id}/edit`,
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

// Mock ApiAlert
jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

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

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/utils/rawData', () => ({
	TYPE_LOCAL_CHIP_COLORS: { Bureau: 'primary', Magasin: 'warning' } as Record<string, string>,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

// Mock MUI date pickers
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ label }: { label: string }) => (
		<div data-testid="date-picker">
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
	AdapterDateFns: jest.fn(),
}));

import LocalViewClient from './local-view';
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

const mockLocal = {
	id: 5,
	nom: 'Bureau Centre',
	building: 1,
	building_nom: 'Résidence A',
	type_local: 'Bureau',
	adresse: '10 Rue Example',
	superficie: '120',
	prix_achat: '500000',
	prix_location_mensuel: '5000',
	en_location: true,
	locataire_nom: 'SARL Test',
	date_debut_location: '2024-01-01',
	notes: 'Notes de test',
	rentabilite: '12.00',
	created_by_user: 1,
	created_by_user_name: 'Admin',
	date_created: '2024-01-01T10:00:00Z',
	date_updated: '2024-01-01T10:00:00Z',
};

const mockLoyers = [
	{
		id: 10,
		local: 5,
		local_nom: 'Bureau Centre',
		mois: 1,
		annee: 2025,
		montant: '5000',
		paye: true,
		date_paiement: '2025-01-15',
		notes: '',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-01-01T00:00:00Z',
		date_updated: '2025-01-15T00:00:00Z',
	},
	{
		id: 11,
		local: 5,
		local_nom: 'Bureau Centre',
		mois: 2,
		annee: 2025,
		montant: '5000',
		paye: false,
		date_paiement: null,
		notes: '',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-02-01T00:00:00Z',
		date_updated: '2025-02-01T00:00:00Z',
	},
];

describe('LocalViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetLocalQuery.mockReturnValue({
			data: mockLocal,
			isLoading: false,
			error: undefined,
		});
		mockUseGetLoyersListQuery.mockReturnValue({
			data: mockLoyers,
			isLoading: false,
		});
	});
	afterEach(() => cleanup());

	describe('Rendering with data', () => {
		it('renders local name', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Bureau Centre')).toBeInTheDocument();
		});

		it('renders type chip', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			// The type_local value appears as a Chip
			const chips = screen.getAllByText('Bureau');
			expect(chips.length).toBeGreaterThanOrEqual(1);
		});

		it('renders adresse', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('10 Rue Example')).toBeInTheDocument();
		});

		it('renders prix_achat with MAD', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getAllByText(/MAD/).length).toBeGreaterThanOrEqual(1);
		});

		it('renders back button', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Liste des locaux')).toBeInTheDocument();
		});

		it('renders Modifier and Supprimer buttons', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Modifier')).toBeInTheDocument();
			expect(screen.getByText('Supprimer')).toBeInTheDocument();
		});

		it('renders created by', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Admin')).toBeInTheDocument();
		});

		it('renders en_location status chip', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('En location')).toBeInTheDocument();
		});

		it('renders locataire_nom when en_location', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('SARL Test')).toBeInTheDocument();
		});

		it('renders rentabilite', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('12.00%')).toBeInTheDocument();
		});

		it('renders notes section', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Notes de test')).toBeInTheDocument();
		});

		it('renders section titles', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Financier')).toBeInTheDocument();
			expect(screen.getByText('Location')).toBeInTheDocument();
			expect(screen.getByText('Métadonnées')).toBeInTheDocument();
			expect(screen.getByText('Loyers')).toBeInTheDocument();
		});
	});

	describe('Loyers table', () => {
		it('renders loyer rows', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Jan')).toBeInTheDocument();
			expect(screen.getByText('Fév')).toBeInTheDocument();
		});

		it('renders loyer paid/unpaid chips', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText('Payé')).toBeInTheDocument();
			expect(screen.getByText('Impayé')).toBeInTheDocument();
		});

		it('shows empty message when no loyers', () => {
			mockUseGetLoyersListQuery.mockReturnValue({
				data: [],
				isLoading: false,
			});
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByText(/Aucun loyer enregistré/)).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates back to list on back button click', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			fireEvent.click(screen.getByText('Liste des locaux'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux');
		});

		it('navigates to edit page on Modifier click', () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			fireEvent.click(screen.getByText('Modifier'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/5/edit');
		});
	});

	describe('Delete local action', () => {
		it('opens delete modal on Supprimer click', async () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer ce local ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			await act(async () => {
				fireEvent.click(screen.getByText('Annuler'));
			});
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes and redirects on confirm', async () => {
			render(<LocalViewClient session={mockSession} id={5} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockDeleteLocal).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Local supprimé avec succès');
				expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux');
			});
		});

		it('handles delete error', async () => {
			mockDeleteLocal.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<LocalViewClient session={mockSession} id={5} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression du local');
			});
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetLocalQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Error state', () => {
		it('shows api alert on 4xx error', () => {
			mockUseGetLocalQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 403, data: { details: 'Forbidden' } },
			});
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('does not render action buttons on error', () => {
			mockUseGetLocalQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 403, data: { details: 'Forbidden' } },
			});
			render(<LocalViewClient session={mockSession} id={5} />);
			expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
			expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
		});
	});

	describe('Not found state', () => {
		it('shows warning when local not found', () => {
			mockUseGetLocalQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: undefined,
			});
			render(<LocalViewClient session={mockSession} id={999} />);
			expect(screen.getByText('Local introuvable')).toBeInTheDocument();
		});
	});
});
