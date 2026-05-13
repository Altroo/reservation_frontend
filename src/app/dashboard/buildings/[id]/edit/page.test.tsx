import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type Session = { user: { pk: number; email: string } } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const mockRedirect = jest.fn((url: string | URL) => ({ redirectedTo: String(url) }));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

jest.mock('@/components/pages/buildings/building-form', () => ({
	__esModule: true,
	default: (props: { id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, `BUILDING_EDIT:${props.id}`);
	},
}));

const AUTH_LOGIN = '/login';
const BUILDINGS_LIST = '/dashboard/buildings';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	BUILDINGS_LIST,
}));

jest.mock('@/utils/getServerTranslations', () => ({
	__esModule: true,
	getServerTranslations: async () => ({
		pageMetadata: {
			buildingsEditTitle: 'Edit building',
			buildingsEditDescription: 'Edit building details',
		},
	}),
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('BuildingEditPage server component', () => {
	it('redirects to login without a session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;

		await Page({ params: Promise.resolve({ id: '4' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to list when id is invalid', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 2, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;

		await Page({ params: Promise.resolve({ id: 'bad' }) });
		expect(mockRedirect).toHaveBeenCalledWith(BUILDINGS_LIST);
	});

	it('renders building edit form for numeric id', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 2, email: 'user@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as (props: { params: Promise<{ id: string }> }) => Promise<unknown>;

		const result = await Page({ params: Promise.resolve({ id: '4' }) });
		expect(renderToStaticMarkup(result as React.ReactElement)).toContain('BUILDING_EDIT:4');
	});
});
