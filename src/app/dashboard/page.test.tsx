import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';

type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });
const mockRedirect = jest.fn((url: string | URL) => REDIRECT_SENTINEL(String(url)));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

const AUTH_LOGIN = '/login';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
}));

const CLIENT_MARKER = 'MARKER:ReservationDashboardClient';
jest.mock('@/components/pages/reservations/reservation-dashboard', () => {
	const Mock = (props: Record<string, unknown>) =>
		`${CLIENT_MARKER}:${JSON.stringify(props)}` as unknown as JSX.Element;
	Mock.displayName = 'ReservationDashboardClient';
	return { __esModule: true, default: Mock };
});

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('DashboardPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		await Page!();
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders ReservationDashboardClient when session exists', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'user@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		const jsx = await Page!();
		const html = renderToStaticMarkup(jsx as React.ReactElement);
		expect(html).toContain(CLIENT_MARKER);
	});
});
