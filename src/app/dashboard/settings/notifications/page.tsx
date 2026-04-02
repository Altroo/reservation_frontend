import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import NotificationsClient from '@/components/pages/settings/notifications';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.notificationsTitle,
		description: t.pageMetadata.notificationsDescription,
	};
}

const NotificationsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <NotificationsClient />;
};

export default NotificationsPage;
