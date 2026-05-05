import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

let mockPathname = '/dashboard';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ push: mockPush }),
}));

let mockIsMobile = false;
jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: () => mockIsMobile,
	};
});

const mockCookiesDeleter = jest.fn();
jest.mock('@/utils/apiHelpers', () => ({
	cookiesDeleter: (...args: unknown[]) => mockCookiesDeleter(...(args as unknown[])),
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
	signOut: (...args: unknown[]) => mockSignOut(...(args as unknown[])),
	useSession: () => mockUseSession(),
}));

const mockUseIsClient = jest.fn(() => true);
const mockUseAppSelector = jest.fn();
const mockDispatch = jest.fn();
const mockNotificationsPage = { results: [], next: null };
const mockUnreadNotifications = { count: 0 };
jest.mock('@/utils/hooks', () => ({
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: require('@/translations').translations.fr }),
	useAppSelector: (fn: unknown) => mockUseAppSelector(fn),
	useAppDispatch: () => mockDispatch,
	useIsClient: () => mockUseIsClient(),
}));

jest.mock('@/store/services/reservation', () => {
	const actual = jest.requireActual('@/store/services/reservation');
	return {
		...actual,
		useGetNotificationsQuery: () => ({ data: mockNotificationsPage, isLoading: false }),
		useGetUnreadNotificationCountQuery: () => ({ data: mockUnreadNotifications, isLoading: false }),
		useMarkNotificationsReadMutation: () => [jest.fn(), { isLoading: false }],
	};
});

jest.mock('@/store/slices/notificationSlice', () => ({
	setUnreadCount: jest.fn((v: number) => ({ type: 'notification/setUnreadCount', payload: v })),
}));

const mockProfileData = {
	avatar_cropped: undefined as string | undefined,
	first_name: 'John',
	last_name: 'Doe',
	gender: 'Homme',
	is_staff: false,
	can_access_hilton_reports: false,
};

describe('NavigationBar', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPathname = '/dashboard';
		mockPush.mockReset();
		mockProfileData.avatar_cropped = undefined;
		mockProfileData.first_name = 'John';
		mockProfileData.last_name = 'Doe';
		mockProfileData.gender = 'Homme';
		mockProfileData.is_staff = false;
		mockProfileData.can_access_hilton_reports = false;
		mockUseAppSelector.mockImplementation((selector: (...args: unknown[]) => unknown) => {
			if (selector.name === 'getUnreadNotificationCount') {
				return 0;
			}
			return mockProfileData;
		});
		mockUseSession.mockImplementation(() => ({ data: {}, status: 'authenticated' }));
		mockIsMobile = false;
	});

	it('renders the title passed as prop', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Mon Contrat">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Mon Contrat')).toBeInTheDocument();
	});

	it('calls cookiesDeleter and signOut when logout clicked', async () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);

		const logoutBtn = screen.getByRole('button', { name: /Se déconnecter/i });
		await userEvent.click(logoutBtn);

		expect(mockCookiesDeleter).toHaveBeenCalledTimes(1);
		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(mockSignOut.mock.calls[0][0]).toMatchObject({ redirect: true });
	});

	it('shows Bienvenu greeting for Homme gender', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="t1">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText(/Bienvenu/i)).toBeInTheDocument();
	});

	it('shows Bienvenue greeting for Femme gender', () => {
		mockProfileData.first_name = 'Marie';
		mockProfileData.last_name = 'C';
		mockProfileData.gender = 'Femme';
		mockProfileData.is_staff = false;
		render(
			<Provider store={store}>
				<NavigationBar title="t2">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(
			screen.getAllByText(/Bienvenue|Bienvenu/i).some((el) => /Bienvenue/.test(el.textContent || '')),
		).toBeTruthy();
	});

	it('shows Utilisateurs section for staff users', () => {
		mockProfileData.first_name = 'Admin';
		mockProfileData.last_name = 'User';
		mockProfileData.gender = 'Homme';
		mockProfileData.is_staff = true;
		render(
			<Provider store={store}>
				<NavigationBar title="Admin">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
		expect(screen.getByText('Rapports Hilton')).toBeInTheDocument();
	});

	it('does not show Utilisateurs section for non-staff users', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="User">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
		expect(screen.queryByText('Rapports Hilton')).not.toBeInTheDocument();
	});

	it('shows Hilton reports link for non-staff users with permission', () => {
		mockProfileData.can_access_hilton_reports = true;
		render(
			<Provider store={store}>
				<NavigationBar title="User">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Rapports Hilton')).toBeInTheDocument();
	});

	it('drawer toggle button only appears on mobile', async () => {
		mockIsMobile = false;
		const { rerender } = render(
			<Provider store={store}>
				<NavigationBar title="D">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.queryByLabelText('Ouvrir/fermer le menu')).not.toBeInTheDocument();

		mockIsMobile = true;
		rerender(
			<Provider store={store}>
				<NavigationBar title="D2">
					<div />
				</NavigationBar>
			</Provider>,
		);
		const toggleBtn = screen.getByLabelText('Ouvrir/fermer le menu');
		expect(toggleBtn).toBeInTheDocument();
		await userEvent.click(toggleBtn);
	});

	it('handles pathname with no matching menu item without error', () => {
		mockPathname = '/some/random/path';
		render(
			<Provider store={store}>
				<NavigationBar title="Random">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Random')).toBeInTheDocument();
	});

	it('renders Locaux section with menu items', () => {
		mockPathname = '/dashboard/locaux';
		render(
			<Provider store={store}>
				<NavigationBar title="Locaux Test">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Locaux')).toBeInTheDocument();
		expect(screen.getByText('Liste des locaux')).toBeInTheDocument();
		expect(screen.getByText('Nouveau local')).toBeInTheDocument();
		expect(screen.getByText('Planning des loyers')).toBeInTheDocument();
		expect(screen.getByText('Dashboard des locaux')).toBeInTheDocument();
	});
});
