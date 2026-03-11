import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

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

jest.mock('@/components/pages/reservations/reservation-view', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`RESERVATION_VIEW_CLIENT_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id ?? ''}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
const RESERVATIONS_LIST = '/dashboard/reservations';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	RESERVATIONS_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('ReservationViewPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: '42' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders ReservationViewClient with session and id when session exists', async () => {
		const sessionValue: Session = { user: { pk: 20, email: 'viewer@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		const result = await Page!({ params: Promise.resolve({ id: '42' }) });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":20');
		expect(decoded).toContain('ID=42');
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('redirects to RESERVATIONS_LIST when id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 20, email: 'viewer@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: 'abc' }) });
		expect(mockRedirect).toHaveBeenCalledWith(RESERVATIONS_LIST);
	});
});
