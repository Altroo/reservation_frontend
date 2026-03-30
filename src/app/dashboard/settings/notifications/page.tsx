import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import NotificationsClient from '@/components/pages/settings/notifications';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Préférences de Notifications',
	description: 'Gérer les préférences de notifications',
};

const NotificationsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <NotificationsClient />;
};

export default NotificationsPage;
