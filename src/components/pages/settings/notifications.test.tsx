import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Minimal mock store
const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

// Mock hooks
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({
		onSuccess: mockOnSuccess,
		onError: mockOnError,
	}),
	useAppSelector: jest.fn(() => null),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getProfilState: jest.fn(),
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<div data-testid="navigation-bar">
			<h1 data-testid="nav-title">{title}</h1>
			{children}
		</div>
	),
}));

// Mock RTK Query hooks
const mockUpdatePreferences = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });

jest.mock('@/store/services/reservation', () => ({
	__esModule: true,
	useGetNotificationPreferencesQuery: () => ({
		data: {
			notify_check_in: true,
			notify_check_out: false,
			reminder_minutes: 60,
		},
		isLoading: false,
	}),
	useUpdateNotificationPreferencesMutation: () => [mockUpdatePreferences, { isLoading: false }],
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => (
		<button data-testid="submit-button" onClick={onClick}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/styles/dashboard/settings/settings.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	pageTitle: 'pageTitle',
	form: 'form',
	maxWidth: 'maxWidth',
	mobileButton: 'mobileButton',
	submitButton: 'submitButton',
	main: 'main',
	fixMobile: 'fixMobile',
}));

// Import after mocks
import NotificationsClient from './notifications';

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

describe('NotificationsClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getAllByText('Préférences de notifications').length).toBeGreaterThan(0);
	});

	it('renders check-in switch', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByText('Notifications de check-in')).toBeInTheDocument();
	});

	it('renders check-out switch', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByText('Notifications de check-out')).toBeInTheDocument();
	});

	it('renders reminder select with label', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByLabelText('Délai de rappel')).toBeInTheDocument();
	});

	it('renders submit button', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByTestId('submit-button')).toBeInTheDocument();
		expect(screen.getByText('Enregistrer')).toBeInTheDocument();
	});

	it('populates form with preferences data', () => {
		renderWithProviders(<NotificationsClient />);
		const checkInSwitch = screen.getByLabelText('Notifications de check-in');
		const checkOutSwitch = screen.getByLabelText('Notifications de check-out');
		expect(checkInSwitch).toBeChecked();
		expect(checkOutSwitch).not.toBeChecked();
	});

	it('toggles check-in switch', () => {
		renderWithProviders(<NotificationsClient />);
		const checkInSwitch = screen.getByLabelText('Notifications de check-in');
		fireEvent.click(checkInSwitch);
		expect(checkInSwitch).not.toBeChecked();
	});

	it('toggles check-out switch', () => {
		renderWithProviders(<NotificationsClient />);
		const checkOutSwitch = screen.getByLabelText('Notifications de check-out');
		fireEvent.click(checkOutSwitch);
		expect(checkOutSwitch).toBeChecked();
	});

	it('calls updatePreferences on submit', async () => {
		renderWithProviders(<NotificationsClient />);
		fireEvent.click(screen.getByTestId('submit-button'));
		await waitFor(() => {
			expect(mockUpdatePreferences).toHaveBeenCalledWith({
				notify_check_in: true,
				notify_check_out: false,
				reminder_minutes: 60,
			});
		});
	});

	it('does not show api-loader when not loading', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.queryByTestId('api-loader')).not.toBeInTheDocument();
	});

	it('requests browser notification permission on mount', () => {
		const requestPermission = jest.fn().mockResolvedValue('granted');
		Object.defineProperty(window, 'Notification', {
			value: { permission: 'default', requestPermission },
			writable: true,
			configurable: true,
		});
		renderWithProviders(<NotificationsClient />);
		expect(requestPermission).toHaveBeenCalled();
	});
});
