import React from 'react';
import { render, screen, cleanup, fireEvent} from '@testing-library/react';
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
	useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
}));

// Mock RTK Query hooks
const mockDeleteBuilding = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockBulkDeleteBuildings = jest.fn(() => ({ unwrap: () => Promise.resolve() }));
const mockUseGetBuildingsQuery = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	useGetBuildingsQuery: (params: unknown, options: unknown) => mockUseGetBuildingsQuery(params, options),
	useDeleteBuildingMutation: () => [mockDeleteBuilding, { isLoading: false }],
	useBulkDeleteBuildingsMutation: () => [mockBulkDeleteBuildings, { isLoading: false }],
}));

// Mock routes
jest.mock('@/utils/routes', () => ({
	BUILDINGS_LIST: '/dashboard/buildings',
	BUILDINGS_ADD: '/dashboard/buildings/new',
	BUILDINGS_VIEW: (id: number) => `/dashboard/buildings/${id}`,
	BUILDINGS_EDIT: (id: number) => `/dashboard/buildings/${id}/edit`,
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

// Mock PaginatedDataGrid
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({ data, isLoading }: { data: { count: number; results: unknown[] }; isLoading: boolean }) => (
		<div data-testid="paginated-data-grid">
			{isLoading ? 'Loading...' : `${data.count} items`}
		</div>
	),
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

// Mock MobileActionsMenu
jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: () => <div data-testid="mobile-actions-menu">Actions</div>,
}));

// Mock DarkTooltip
jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	extractApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
}));

import BuildingsListClient from './buildings-list';
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

const mockBuildings = [
	{
		id: 1,
		nom: 'Résidence Alpha',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-01-01T10:00:00Z',
		date_updated: '2025-01-01T10:00:00Z',
	},
	{
		id: 2,
		nom: 'Résidence Beta',
		created_by_user: 1,
		created_by_user_name: 'Admin',
		date_created: '2025-02-01T10:00:00Z',
		date_updated: '2025-02-01T10:00:00Z',
	},
];

describe('BuildingsListClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetBuildingsQuery.mockReturnValue({
			data: mockBuildings,
			isLoading: false,
		});
	});
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders navigation bar', () => {
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
		});

		it('renders add button', () => {
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByText('Nouvelle résidence')).toBeInTheDocument();
		});

		it('renders paginated data grid', () => {
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('shows correct item count', () => {
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByText('2 items')).toBeInTheDocument();
		});

		it('shows loading state', () => {
			mockUseGetBuildingsQuery.mockReturnValue({ data: undefined, isLoading: true });
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('renders 0 items when data is empty', () => {
			mockUseGetBuildingsQuery.mockReturnValue({ data: [], isLoading: false });
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.getByText('0 items')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('navigates to add page on button click', () => {
			render(<BuildingsListClient session={mockSession} />);
			fireEvent.click(screen.getByText('Nouvelle résidence'));
			expect(mockPush).toHaveBeenCalledWith('/dashboard/buildings/new');
		});
	});

	describe('Delete actions', () => {
		it('does not show bulk delete button when no items selected', () => {
			render(<BuildingsListClient session={mockSession} />);
			expect(screen.queryByText(/Supprimer \(/)).not.toBeInTheDocument();
		});
	});
});
