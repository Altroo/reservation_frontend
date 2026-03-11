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

jest.mock('@/components/pages/reservations/reservation-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`RESERVATION_FORM_CLIENT_MARKER:${JSON.stringify(props?.session ?? null)}:ID=${props?.id ?? ''}`,
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

describe('ReservationEditPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: '7' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders ReservationFormClient with session and id when session exists', async () => {
		const sessionValue: Session = { user: { pk: 15, email: 'editor@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		const result = await Page!({ params: Promise.resolve({ id: '7' }) });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":15');
		expect(decoded).toContain('ID=7');
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('redirects to RESERVATIONS_LIST when id is invalid', async () => {
		const sessionValue: Session = { user: { pk: 15, email: 'editor@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: 'xyz' }) });
		expect(mockRedirect).toHaveBeenCalledWith(RESERVATIONS_LIST);
	});
});
