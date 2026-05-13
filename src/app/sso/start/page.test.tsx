import { jest } from '@jest/globals';

const mockRandomUUID = jest.fn(() => 'state-123');
jest.mock('crypto', () => ({
	__esModule: true,
	randomUUID: mockRandomUUID,
}));

const mockRedirect = jest.fn((url: string | URL) => {
	throw new Error(`redirect:${String(url)}`);
});
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
	process.env.NEXT_PUBLIC_EBH_SSO_AUTHORIZE_URL = 'https://holding.example.test/sso/authorize';
	process.env.NEXT_PUBLIC_EBH_SSO_APP_SLUG = 'reservation';
	process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'https://reservation.example.test';
});

describe('SSOStartPage', () => {
	it('redirects to central authorize with app metadata', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as () => void;

		expect(() => Page()).toThrow('redirect:https://holding.example.test/sso/authorize');
		const url = new URL((mockRedirect.mock.calls[0][0] as string | URL).toString());
		expect(url.searchParams.get('app')).toBe('reservation');
		expect(url.searchParams.get('redirect_uri')).toBe('https://reservation.example.test/sso/callback');
		expect(url.searchParams.get('state')).toBe('state-123');
	});

	it('redirects to login when SSO config is missing', () => {
		process.env.NEXT_PUBLIC_EBH_SSO_APP_SLUG = '';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as () => void;

		expect(() => Page()).toThrow('redirect:/login?error=SSOConfiguration');
	});
});
