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
const mockDeleteCost = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetCostsQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetCostsQuery: (params: unknown, options: unknown) => mockUseGetCostsQuery(params, options),
	useDeleteCostMutation: jest.fn(() => [mockDeleteCost, { isLoading: false }]),
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	COSTS_LIST: '/dashboard/costs',
	COSTS_EDIT: (id: number) => `/dashboard/costs/${id}/edit`,
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
	COST_CATEGORY_CHIP_COLORS: { Entretien: 'warning', Charges: 'info' } as Record<string, string>,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import CostViewClient from './cost-view';
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

const mockCost = {
	id: 7,
	description: 'Facture électricité',
	amount: '850',
	date: '2024-03-15',
	category: 'Charges',
	building: 3,
	building_nom: 'Résidence Atlas',
	created_by_user: 1,
	created_by_user_name: 'Admin',
	date_created: '2024-03-15T10:00:00Z',
	date_updated: '2024-03-15T10:00:00Z',
};

const mockCostsList = [mockCost];

describe('CostViewClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetCostsQuery.mockReturnValue({
			data: mockCostsList,
			isLoading: false,
			error: undefined,
		});
	});
	afterEach(() => cleanup());

	describe('Rendering with data', () => {
		it('renders cost header with id', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Coût #7')).toBeInTheDocument();
		});

		it('renders description', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Facture électricité')).toBeInTheDocument();
		});

		it('renders amount formatted with MAD', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText(/MAD/)).toBeInTheDocument();
		});

		it('renders identification section header', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Coût #7')).toBeInTheDocument();
		});

		it('renders details section title', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Détails du coût')).toBeInTheDocument();
		});

		it('renders back button', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Liste des coûts')).toBeInTheDocument();
		});

		it('renders Modifier and Supprimer buttons', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Modifier')).toBeInTheDocument();
			expect(screen.getByText('Supprimer')).toBeInTheDocument();
		});

		it('renders created by', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Admin')).toBeInTheDocument();
		});

		it('renders residence when present', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Résidence Atlas')).toBeInTheDocument();
		});

		it('renders category chip', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByText('Charges')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates back to list on back button click', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			fireEvent.click(screen.getByText('Liste des coûts'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/costs');
		});

		it('navigates to edit page on Modifier click', () => {
			render(<CostViewClient session={mockSession} id={7} />);
			fireEvent.click(screen.getByText('Modifier'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/costs/7/edit');
		});
	});

	describe('Delete action', () => {
		it('opens delete modal on Supprimer click', async () => {
			render(<CostViewClient session={mockSession} id={7} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer ce coût ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<CostViewClient session={mockSession} id={7} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			await act(async () => {
				fireEvent.click(screen.getByText('Annuler'));
			});
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes and redirects on confirm', async () => {
			render(<CostViewClient session={mockSession} id={7} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockDeleteCost).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Coût supprimé avec succès');
				expect(mockPush).toHaveBeenCalledWith('/dashboard/costs');
			});
		});

		it('handles delete error', async () => {
			mockDeleteCost.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<CostViewClient session={mockSession} id={7} />);
			await act(async () => {
				fireEvent.click(screen.getByText('Supprimer'));
			});
			const btns = screen.getAllByText('Supprimer');
			await act(async () => {
				fireEvent.click(btns[btns.length - 1]);
			});
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression du coût');
			});
		});
	});

	describe('Loading state', () => {
		it('shows loader when data is loading', () => {
			mockUseGetCostsQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});

	describe('Error state', () => {
		it('shows api alert on 4xx error', () => {
			mockUseGetCostsQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 403, data: { details: 'Forbidden' } },
			});
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.getByTestId('api-alert')).toBeInTheDocument();
		});

		it('does not render action buttons on error', () => {
			mockUseGetCostsQuery.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: { status: 403, data: { details: 'Forbidden' } },
			});
			render(<CostViewClient session={mockSession} id={7} />);
			expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
			expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
		});
	});

	describe('Not found state', () => {
		it('shows warning when cost not found', () => {
			mockUseGetCostsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
			render(<CostViewClient session={mockSession} id={999} />);
			expect(screen.getByText('Coût introuvable')).toBeInTheDocument();
		});

		it('does not render action buttons when cost not found', () => {
			mockUseGetCostsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
			render(<CostViewClient session={mockSession} id={999} />);
			expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
			expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
		});
	});
});
