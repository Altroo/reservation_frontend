import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { InitEffects } from './initEffects';
import { useSession } from 'next-auth/react';
import { useGetProfilQuery } from '@/store/services/account';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { getAccessToken } from '@/store/selectors';

jest.mock('next-auth/react');
jest.mock('@/store/services/account');
jest.mock('@/utils/hooks');
jest.mock('@/store/selectors');

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
	usePathname: jest.fn(),
}));

import { useRouter, usePathname } from 'next/navigation';

const mockDispatch = jest.fn();

describe('InitEffects', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
		(useAppSelector as jest.Mock).mockImplementation((selector) => {
			if (selector === getAccessToken) return { access: 'mock-token' };
			return undefined;
		});

		(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
		(usePathname as jest.Mock).mockReturnValue('/');
		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: undefined });
	});

	it('dispatches init app and session token actions when session is authenticated', async () => {
		const mockSession = { user: { name: 'Test' } };
		(useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP' }));
			expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'INIT_APP_SESSION_TOKENS' }));
		});
	});

	it('dispatches profile action when user data is available', async () => {
		const mockUser = { id: 1, name: 'User' };
		(useSession as jest.Mock).mockReturnValue({ data: { user: {} }, status: 'authenticated' });
		(useGetProfilQuery as jest.Mock).mockReturnValue({ data: mockUser });

		render(<InitEffects />);

		await waitFor(() => {
			expect(mockDispatch).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'ACCOUNT_SET_PROFIL', data: mockUser }),
			);
		});
	});
});
