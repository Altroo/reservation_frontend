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
	__esModule: true,
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteCost = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetCostsQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetCostsQuery: (params: unknown, options: unknown) => mockUseGetCostsQuery(params, options),
	useDeleteCostMutation: () => [mockDeleteCost, { isLoading: false }],
}));

// Mock DataGrid to render rows and call renderCell for action testing
jest.mock('@mui/x-data-grid', () => ({
	__esModule: true,
	DataGrid: ({
		rows,
		columns,
	}: {
		rows: Array<Record<string, unknown>>;
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode;
		}>;
	}) => (
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
	),
	GridColDef: {},
	GridRenderCellParams: {},
}));

jest.mock('@mui/x-data-grid/locales', () => ({
	frFR: { components: { MuiDataGrid: { defaultProps: { localeText: {} } } } },
}));

jest.mock('@/utils/themes', () => ({
	getDefaultTheme: jest.fn(() => ({})),
}));

// Mock ThemeProvider to avoid MUI theme validation issues in tests
jest.mock('@mui/material/styles', () => ({
	...jest.requireActual('@mui/material/styles'),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: jest.fn((d: string) => d),
	extractApiErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
}));

jest.mock('@/utils/rawData', () => ({
	COST_CATEGORY_CHIP_COLORS: {
		Maintenance: 'error',
		Utilities: 'warning',
	},
}));

jest.mock('@/utils/routes', () => ({
	COSTS_ADD: '/dashboard/costs/new',
	COSTS_EDIT: (id: number) => `/dashboard/costs/${id}/edit`,
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

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

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
		created_by_user_name: 'Admin',
	},
	{
		id: 2,
		description: 'Plomberie',
		amount: '1200',
		date: '2024-02-20',
		category: 'Maintenance',
		created_by_user_name: 'Admin',
	},
];

describe('CostsListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
		expect(screen.getByText('Supprimer le coût')).toBeInTheDocument();
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
