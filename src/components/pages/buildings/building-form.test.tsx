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
const mockUseGetBuildingQuery = jest.fn();
const mockCreateBuilding = jest.fn();
const mockUpdateBuilding = jest.fn();

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetBuildingQuery: (params: unknown, options: unknown) => mockUseGetBuildingQuery(params, options),
	useCreateBuildingMutation: () => [mockCreateBuilding, { isLoading: false }],
	useUpdateBuildingMutation: () => [mockUpdateBuilding, { isLoading: false }],
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
	BUILDING_FIELD_LABELS: { nom: 'Nom' },
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	buildingSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	BUILDINGS_LIST: '/dashboard/buildings',
}));

jest.mock('@/styles/dashboard/dashboard.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	submitButton: 'submitButton',
}));

import BuildingFormClient from './building-form';
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

describe('BuildingFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetBuildingQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders back button with list text', () => {
			render(<BuildingFormClient session={mockSession} />);
			expect(screen.getByText('Liste des résidences')).toBeInTheDocument();
		});

		it('renders nom input field', () => {
			render(<BuildingFormClient session={mockSession} />);
			expect(screen.getByTestId('input-nom')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			render(<BuildingFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Ajouter la résidence');
		});

		it('renders section header', () => {
			render(<BuildingFormClient session={mockSession} />);
			expect(screen.getByText('Informations de la résidence')).toBeInTheDocument();
		});

		it('calls useGetBuildingQuery with skip=true (add mode has no id)', () => {
			render(<BuildingFormClient session={mockSession} />);
			expect(mockUseGetBuildingQuery).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ skip: true }),
			);
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders submit button with update text', () => {
			mockUseGetBuildingQuery.mockReturnValue({
				data: { id: 1, nom: 'Résidence Alpha' },
				isLoading: false,
			});

			render(<BuildingFormClient session={mockSession} id={1} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('renders back button in edit mode', () => {
			mockUseGetBuildingQuery.mockReturnValue({ data: undefined, isLoading: false });
			render(<BuildingFormClient session={mockSession} id={1} />);
			expect(screen.getByText('Liste des résidences')).toBeInTheDocument();
		});

		it('calls useGetBuildingQuery with skip=false (edit mode has id and token)', () => {
			render(<BuildingFormClient session={mockSession} id={1} />);
			expect(mockUseGetBuildingQuery).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				expect.objectContaining({ skip: false }),
			);
		});
	});

	describe('Loading state', () => {
		it('shows loader when create mutation is loading', () => {
			const service = jest.requireMock('@/store/services/reservation') as {
				useCreateBuildingMutation: () => [jest.Mock, { isLoading: boolean }];
			};
			service.useCreateBuildingMutation = () => [mockCreateBuilding, { isLoading: true }];

			render(<BuildingFormClient session={mockSession} />);
			expect(screen.getByTestId('api-loader')).toBeInTheDocument();
		});
	});
});
