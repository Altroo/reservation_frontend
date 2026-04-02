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
const mockDeleteBuilding = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetBuildingQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetBuildingQuery: (params: unknown, options: unknown) => mockUseGetBuildingQuery(params, options),
	useDeleteBuildingMutation: () => [mockDeleteBuilding, { isLoading: false }],
	useGetApartmentsQuery: () => ({ data: [{ id: 1, nom: 'Apt 1', building: 1 }, { id: 2, nom: 'Apt 2', building: 2 }], isLoading: false }),
	useGetLocauxListQuery: () => ({ data: [{ id: 10, nom: 'Bureau Centre', building: 1, type_local: 'Bureau' }], isLoading: false }),
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	BUILDINGS_LIST: '/dashboard/buildings',
	BUILDINGS_EDIT: (id: number) => `/dashboard/buildings/${id}/edit`,
	LOCAUX_VIEW: (id: number) => `/dashboard/locaux/${id}`,
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
	default: ({ children }: { children?: React.ReactNode }) => <div data-testid="api-alert">{children}</div>,
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

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import BuildingViewClient from './building-view';
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

const mockBuilding = {
	id: 1,
	nom: 'Résidence Alpha',
	created_by_user: 1,
	created_by_user_name: 'Admin',
	date_created: '2025-01-01T10:00:00Z',
	date_updated: '2025-06-15T14:00:00Z',
};

describe('BuildingViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetBuildingQuery.mockReturnValue({
			data: mockBuilding,
			isLoading: false,
			isError: false,
		});
	});
	afterEach(() => cleanup());

	describe('Rendering with data', () => {
		it('renders building name', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Résidence Alpha')).toBeInTheDocument();
		});

		it('renders back button', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Liste des résidences')).toBeInTheDocument();
		});

		it('renders Modifier and Supprimer buttons', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Modifier')).toBeInTheDocument();
			expect(screen.getByText('Supprimer')).toBeInTheDocument();
		});

		it('renders created by', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Admin')).toBeInTheDocument();
		});

		it('renders section titles', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Identification')).toBeInTheDocument();
			expect(screen.getByText('Métadonnées')).toBeInTheDocument();
		});

		it('renders metadata labels', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByText('Créé par')).toBeInTheDocument();
			expect(screen.getByText('Date de création')).toBeInTheDocument();
			expect(screen.getByText('Dernière modification')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates back to list on back button click', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			fireEvent.click(screen.getByText('Liste des résidences'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/buildings');
		});

		it('navigates to edit page on Modifier click', () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			fireEvent.click(screen.getByText('Modifier'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/buildings/1/edit');
		});
	});

	describe('Delete action', () => {
		it('opens delete modal on Supprimer click', async () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer la résidence')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			await act(async () => {
				fireEvent.click(screen.getByText('Annuler'));
			});
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes and redirects on confirm', async () => {
			render(<BuildingViewClient session={mockSession} id={1} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockDeleteBuilding).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Résidence supprimée avec succès');
				expect(mockPush).toHaveBeenCalledWith('/dashboard/buildings');
			});
		});

		it('handles delete error', async () => {
			mockDeleteBuilding.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<BuildingViewClient session={mockSession} id={1} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression de la résidence');
			});
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetBuildingQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Error state', () => {
		it('shows api alert on error', () => {
			mockUseGetBuildingQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				isError: true,
			});
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('does not render building cards on error', () => {
			mockUseGetBuildingQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				isError: true,
			});
			render(<BuildingViewClient session={mockSession} id={1} />);
			expect(screen.queryByText('Identification')).not.toBeInTheDocument();
		});
	});
});
