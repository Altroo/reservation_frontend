'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { initAppSessionTokensAction } from '@/store/actions/_initActions';
import { getAccessToken } from '@/store/selectors';
import { useGetProfilQuery } from '@/store/services/account';
import { accountSetProfilAction } from '@/store/actions/accountActions';
import { DASHBOARD_PASSWORD } from '@/utils/routes';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const accessToken = useAppSelector(getAccessToken) ?? undefined;
	const skip = !accessToken || status !== 'authenticated';

	const tokensInitializedRef = useRef(false);
	const { data: user } = useGetProfilQuery(undefined, { skip });

	// Initialize tokens once
	useEffect(() => {
		if (status === 'authenticated' && session && !tokensInitializedRef.current) {
			dispatch(initAppSessionTokensAction(session));
			tokensInitializedRef.current = true;
		}
	}, [status, session, dispatch]);

	// Dispatch user profile to Redux
	useEffect(() => {
		if (user) dispatch(accountSetProfilAction(user));
	}, [dispatch, user]);

	// Redirect if user still has default password
	useEffect(() => {
		if (user && user.default_password_set && pathname !== '/dashboard/settings/password') {
			router.push(DASHBOARD_PASSWORD);
		}
	}, [user, pathname, router]);

	return null;
};
