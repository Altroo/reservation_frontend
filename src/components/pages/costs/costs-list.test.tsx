import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
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
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
	__esModule: true,
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteCost = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockBulkDeleteCosts = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetCostsQuery = jest.fn();
const mockUseGetCostYearsQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetCostYearsQuery: (params: unknown, options: unknown) => mockUseGetCostYearsQuery(params, options),
	useGetCostsQuery: (params: unknown, options: unknown) => mockUseGetCostsQuery(params, options),
	useGetBuildingsQuery: () => ({ data: [{ id: 1, nom: 'Résidence A' }], isLoading: false }),
	useDeleteCostMutation: () => [mockDeleteCost, { isLoading: false }],
	useBulkDeleteCostsMutation: () => [mockBulkDeleteCosts, { isLoading: false }],
}));

// Mock PaginatedDataGrid to render rows and call renderCell for action testing
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
	hexToRGB: (hex: string, alpha?: number) => (alpha !== undefined ? `rgba(0,0,0,${alpha})` : 'rgb(0,0,0)'),
}));

jest.mock('@/utils/rawData', () => ({
	COST_CATEGORY_CHIP_COLORS: {
		Maintenance: 'error',
		Utilities: 'warning',
	},
	costCategoryItemsList: [
		{ code: 'Maintenance', value: 'Maintenance' },
		{ code: 'Utilities', value: 'Utilities' },
	],
}));

jest.mock('@/utils/routes', () => ({
	COSTS_ADD: '/dashboard/costs/new',
	COSTS_VIEW: (id: number) => `/dashboard/costs/${id}`,
	COSTS_EDIT: (id: number) => `/dashboard/costs/${id}/edit`,
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

// ApiProgress no longer directly used by costs-list (handled by PaginatedDataGrid mock)

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import CostsListClient from './costs-list';
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

const mockCosts = [
	{
		id: 1,
		description: 'Internet',
		amount: '500',
		date: '2024-01-15',
		category: 'Utilities',
		building: 1,
		building_nom: 'Résidence A',
		created_by_user_name: 'Admin',
	},
	{
		id: 2,
		description: 'Plomberie',
		amount: '1200',
		date: '2024-02-20',
		category: 'Maintenance',
		building: null,
		building_nom: null,
		created_by_user_name: 'Admin',
	},
];

describe('CostsListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetCostYearsQuery.mockReturnValue({
			data: { years: [2026, 2025, 2024] },
			isLoading: false,
		});
		mockUseGetCostsQuery.mockReturnValue({
			data: mockCosts,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the data grid', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByTestId('data-grid')).toBeInTheDocument();
	});

	it('renders "Nouveau coût" button', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByText('Nouveau coût')).toBeInTheDocument();
	});

	it('navigates to add page when "Nouveau coût" is clicked', () => {
		render(<CostsListClient session={mockSession} />);
		fireEvent.click(screen.getByText('Nouveau coût'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard/costs/new');
	});

	it('displays total amount when costs exist', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByText(/Total :/)).toBeInTheDocument();
	});

	it('renders cost rows in data grid', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByTestId('row-1')).toBeInTheDocument();
		expect(screen.getByTestId('row-2')).toBeInTheDocument();
	});

	it('renders Voir button for each cost row', () => {
		render(<CostsListClient session={mockSession} />);
		const viewButtons = screen.getAllByText('Voir');
		expect(viewButtons).toHaveLength(2);
	});

	it('navigates to view page when Voir is clicked', () => {
		render(<CostsListClient session={mockSession} />);
		const viewButtons = screen.getAllByText('Voir');
		fireEvent.click(viewButtons[0]);
		expect(mockPush).toHaveBeenCalledWith('/dashboard/costs/1');
	});

	it('renders Modifier button for each cost row', () => {
		render(<CostsListClient session={mockSession} />);
		const editButtons = screen.getAllByText('Modifier');
		expect(editButtons).toHaveLength(2);
	});

	it('renders Supprimer button for each cost row', () => {
		render(<CostsListClient session={mockSession} />);
		const deleteButtons = screen.getAllByText('Supprimer');
		expect(deleteButtons).toHaveLength(2);
	});

	it('navigates to edit page when Modifier is clicked', () => {
		render(<CostsListClient session={mockSession} />);
		const editButtons = screen.getAllByText('Modifier');
		fireEvent.click(editButtons[0]);
		expect(mockPush).toHaveBeenCalledWith('/dashboard/costs/1/edit');
	});

	it('opens delete modal when Supprimer is clicked', () => {
		render(<CostsListClient session={mockSession} />);
		const deleteButtons = screen.getAllByText('Supprimer');
		fireEvent.click(deleteButtons[0]);
		expect(screen.getByTestId('action-modal')).toBeInTheDocument();
		expect(screen.getByText('Supprimer ce coût ?')).toBeInTheDocument();
	});

	it('closes delete modal when Annuler is clicked', () => {
		render(<CostsListClient session={mockSession} />);
		fireEvent.click(screen.getAllByText('Supprimer')[0]);
		const modal = screen.getByTestId('action-modal');
		fireEvent.click(within(modal).getByText('Annuler'));
		expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
	});

	it('calls deleteCost when confirming delete', async () => {
		render(<CostsListClient session={mockSession} />);
		fireEvent.click(screen.getAllByText('Supprimer')[0]);
		const modal = screen.getByTestId('action-modal');
		fireEvent.click(within(modal).getByText('Supprimer'));
		await waitFor(() => {
			expect(mockDeleteCost).toHaveBeenCalledWith({ id: 1 });
		});
	});

	it('shows loading state', () => {
		mockUseGetCostsQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByTestId('api-loader')).toBeInTheDocument();
	});

	it('renders the category chip filter bar', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByTestId('chip-filter-bar')).toBeInTheDocument();
		expect(screen.getByText('Catégorie')).toBeInTheDocument();
		expect(screen.getByText('Résidence')).toBeInTheDocument();
	});

	it('renders residence values in the grid', () => {
		render(<CostsListClient session={mockSession} />);
		expect(screen.getByText('Résidence A')).toBeInTheDocument();
	});

	it('does not show total when costs list is empty', () => {
		mockUseGetCostsQuery.mockReturnValue({
			data: [],
			isLoading: false,
		});
		render(<CostsListClient session={mockSession} />);
		expect(screen.queryByText(/Total/)).not.toBeInTheDocument();
	});

	it('renders year select', () => {
		render(<CostsListClient session={mockSession} />);
		const anneeLabels = screen.getAllByText('Année');
		expect(anneeLabels.length).toBeGreaterThan(0);
	});
});
