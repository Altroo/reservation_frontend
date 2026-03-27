import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'test-token'),
}));

// Mock RTK Query hooks
const mockUseGetCostsQuery = jest.fn();
const mockCreateCost = jest.fn();
const mockUpdateCost = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetCostsQuery: (params: unknown, options: unknown) => mockUseGetCostsQuery(params, options),
	useCreateCostMutation: () => [mockCreateCost, { isLoading: false }],
	useUpdateCostMutation: () => [mockUpdateCost, { isLoading: false }],
}));

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`autocomplete-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type }: { buttonText: string; type?: string }) => (
		<button data-testid="submit-button" type={type as 'submit' | 'button'}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((_labels: unknown, key: string) => key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/rawData', () => ({
	costCategoryItemsList: [
		{ code: 'Maintenance', value: 'Maintenance' },
		{ code: 'Utilities', value: 'Utilities' },
	],
	COST_FIELD_LABELS: [],
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	costSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	COSTS_LIST: '/dashboard/costs',
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	submitButton: 'submitButton',
}));

// Mock MUI date pickers to avoid jsdom complexities
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

import CostFormClient from './cost-form';
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

describe('CostFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetCostsQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders back button with list text', () => {
			render(<CostFormClient session={mockSession} />);
			expect(screen.getByText('Liste des coûts')).toBeInTheDocument();
		});

		it('renders form fields', () => {
			render(<CostFormClient session={mockSession} />);
			expect(screen.getByTestId('input-description')).toBeInTheDocument();
			expect(screen.getByTestId('input-amount')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-category')).toBeInTheDocument();
		});

		it('renders date picker', () => {
			render(<CostFormClient session={mockSession} />);
			expect(screen.getByTestId('date-picker')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			render(<CostFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter le coût');
		});

		it('renders section header', () => {
			render(<CostFormClient session={mockSession} />);
			expect(screen.getByText('Détails du coût')).toBeInTheDocument();
		});

		it('calls useGetCostsQuery with skip=true (add mode has no id)', () => {
			render(<CostFormClient session={mockSession} />);
			expect(mockUseGetCostsQuery).toHaveBeenCalledWith(
				{},
				expect.objectContaining({ skip: true }),
			);
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders submit button with update text', () => {
			mockUseGetCostsQuery.mockReturnValue({
				data: [
					{
						id: 1,
						description: 'Test cost',
						amount: '500',
						date: '2024-01-01',
						category: 'Maintenance',
					},
				],
				isLoading: false,
			});

			render(<CostFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('renders back button with list text in edit mode', () => {
			mockUseGetCostsQuery.mockReturnValue({ data: [], isLoading: false });
			render(<CostFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Liste des coûts')).toBeInTheDocument();
		});

		it('calls useGetCostsQuery with skip=false (edit mode has id and token)', () => {
			render(<CostFormClient session={mockSession} id={1} />);
			expect(mockUseGetCostsQuery).toHaveBeenCalledWith(
				{},
				expect.objectContaining({ skip: false }),
			);
		});
	});

	describe('Loading state', () => {
		it('shows loader when create mutation is loading', () => {
			const service = jest.requireMock('@/store/services/reservation') as {
				useCreateCostMutation: () => [jest.Mock, { isLoading: boolean }];
			};
			service.useCreateCostMutation = () => [mockCreateCost, { isLoading: true }];

			render(<CostFormClient session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});

		it('shows loader when update mutation is loading', () => {
			mockUseGetCostsQuery.mockReturnValue({ data: [], isLoading: false });

			const service = jest.requireMock('@/store/services/reservation') as {
				useUpdateCostMutation: () => [jest.Mock, { isLoading: boolean }];
			};
			service.useUpdateCostMutation = () => [mockUpdateCost, { isLoading: true }];

			render(<CostFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
