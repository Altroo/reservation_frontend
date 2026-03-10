'use client';

import { useContext, useEffect } from 'react';
import { ToastContext } from '@/contexts/toastContext';

/**
 * Listens for the global 'session-expired' event and displays
 * a toast notification when the session expires.
 * Must be mounted inside ToastContextProvider.
 */
const SessionExpiredListener: React.FC = () => {
	const toast = useContext(ToastContext);

	useEffect(() => {
		const handler = () => {
			toast?.onError('Votre session a expiré, veuillez vous reconnecter.');
		};
		window.addEventListener('session-expired', handler);
		return () => window.removeEventListener('session-expired', handler);
	}, [toast]);

	return null;
};

export default SessionExpiredListener;
