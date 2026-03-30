import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
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

const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteLocal = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockBulkDeleteLocaux = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetLocauxListQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetLocauxListQuery: (params: unknown, options: unknown) => mockUseGetLocauxListQuery(params, options),
	useDeleteLocalMutation: () => [mockDeleteLocal, { isLoading: false }],
	useBulkDeleteLocauxMutation: () => [mockBulkDeleteLocaux, { isLoading: false }],
}));

// Mock PaginatedDataGrid
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		data,
		isLoading,
		columns,
	}: {
		data?: { count: number; results: Array<Record<string, unknown>> };
		isLoading?: boolean;
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode;
		}>;
	}) => {
		if (isLoading) return <div data-testid="api-loader">Loading...</div>;
		const rows = data?.results ?? [];
		return (
			<div data-testid="data-grid">
				{rows.map((row) => (
					<div key={row.id as number} data-testid={`row-${row.id}`}>
						{columns.map((col) => (
							<div key={col.field}>
								{col.renderCell
									? col.renderCell({ value: row[col.field], row, field: col.field })
									: String(row[col.field] ?? '')}
							</div>
						))}
					</div>
				))}
			</div>
		);
	},
}));

// Mock ChipSelectFilterBar
jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: ({ filters }: { filters: Array<{ label: string }> }) => (
		<div data-testid="chip-filter-bar">
			{filters.map((f) => (
				<span key={f.label}>{f.label}</span>
			))}
		</div>
	),
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: jest.fn((d: string) => d),
	extractApiErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
}));

jest.mock('@/utils/rawData', () => ({
	TYPE_LOCAL_CHIP_COLORS: {
		Bureau: 'primary',
		Magasin: 'warning',
	},
	typeLocalItemsList: [
		{ code: 'Bureau', value: 'Bureau' },
		{ code: 'Magasin', value: 'Magasin' },
	],
}));

jest.mock('@/utils/routes', () => ({
	LOCAUX_ADD: '/dashboard/locaux/new',
	LOCAUX_VIEW: (id: number) => `/dashboard/locaux/${id}`,
	LOCAUX_EDIT: (id: number) => `/dashboard/locaux/${id}/edit`,
}));

jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">
			{actions.map((a) => (
				<button key={a.label} onClick={a.onClick}>
					{a.label}
				</button>
			))}
		</div>
	),
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

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
			{actions.map((action) => (
				<button key={action.text} onClick={action.onClick}>
					{action.text}
				</button>
			))}
		</div>
	),
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import LocauxListClient from './locaux-list';
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

const mockLocaux = [
	{
		id: 1,
		nom: 'Bureau Centre',
		type_local: 'Bureau',
		adresse: '10 Rue Example',
		superficie: '120',
		prix_achat: '500000',
		prix_location_mensuel: '5000',
		en_location: true,
		locataire_nom: 'SARL Test',
		date_debut_location: '2024-01-01',
		notes: '',
		rentabilite: '12.00',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2024-01-01T00:00:00Z',
		date_updated: '2024-01-01T00:00:00Z',
	},
	{
		id: 2,
		nom: 'Magasin Nord',
		type_local: 'Magasin',
		adresse: '20 Rue Nord',
		superficie: '80',
		prix_achat: '300000',
		prix_location_mensuel: '3000',
		en_location: false,
		locataire_nom: '',
		date_debut_location: null,
		notes: '',
		rentabilite: '8.50',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2024-02-01T00:00:00Z',
		date_updated: '2024-02-01T00:00:00Z',
	},
];

describe('LocauxListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetLocauxListQuery.mockReturnValue({
			data: mockLocaux,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the data grid', () => {
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByTestId('data-grid')).toBeInTheDocument();
	});

	it('renders "Nouveau local" button', () => {
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByText('Nouveau local')).toBeInTheDocument();
	});

	it('navigates to add page when "Nouveau local" is clicked', () => {
		render(<LocauxListClient session={mockSession} />);
		fireEvent.click(screen.getByText('Nouveau local'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/new');
	});

	it('renders locaux rows in data grid', () => {
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.getByTestId('row-2')).toBeInTheDocument();
	});

	it('renders chip filter bar with Type and Statut filters', () => {
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByTestId('chip-filter-bar')).toBeInTheDocument();
		expect(screen.getByText('Type')).toBeInTheDocument();
		expect(screen.getByText('Statut')).toBeInTheDocument();
	});

	it('renders action buttons for each row', () => {
		render(<LocauxListClient session={mockSession} />);
		const menus = screen.getAllByTestId('mobile-actions-menu');
		expect(menus.length).toBeGreaterThanOrEqual(2);
	});

	it('navigates to view page via action button', () => {
		render(<LocauxListClient session={mockSession} />);
		const viewButtons = screen.getAllByText('Voir');
		fireEvent.click(viewButtons[0]);
		expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/1');
	});

	it('navigates to edit page via action button', () => {
		render(<LocauxListClient session={mockSession} />);
		const editButtons = screen.getAllByText('Modifier');
		fireEvent.click(editButtons[0]);
		expect(mockPush).toHaveBeenCalledWith('/dashboard/locaux/1/edit');
	});

	it('opens delete modal via action button', () => {
		render(<LocauxListClient session={mockSession} />);
		const deleteButtons = screen.getAllByText('Supprimer');
		fireEvent.click(deleteButtons[0]);
		expect(screen.getByTestId('action-modal')).toBeInTheDocument();
		expect(screen.getByText('Supprimer le local')).toBeInTheDocument();
	});

	it('closes delete modal on cancel', async () => {
		render(<LocauxListClient session={mockSession} />);
		const deleteButtons = screen.getAllByText('Supprimer');
		fireEvent.click(deleteButtons[0]);
		fireEvent.click(screen.getByText('Annuler'));
		expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
	});

	it('calls deleteLocal on confirm delete', async () => {
		render(<LocauxListClient session={mockSession} />);
		const deleteButtons = screen.getAllByText('Supprimer');
		fireEvent.click(deleteButtons[0]);
		const confirmButtons = screen.getAllByText('Supprimer');
		fireEvent.click(confirmButtons[confirmButtons.length - 1]);
		await waitFor(() => {
			expect(mockDeleteLocal).toHaveBeenCalled();
			expect(mockOnSuccess).toHaveBeenCalledWith('Local supprimé avec succès');
		});
	});

	it('shows loading state', () => {
		mockUseGetLocauxListQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders empty data grid when no locaux', () => {
		mockUseGetLocauxListQuery.mockReturnValue({
			data: [],
			isLoading: false,
		});
		render(<LocauxListClient session={mockSession} />);
		expect(screen.getByTestId('data-grid')).toBeInTheDocument();
	});
});
