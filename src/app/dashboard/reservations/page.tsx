import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationsListClient from '@/components/pages/reservations/reservations-list';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.reservationsTitle,
		description: t.pageMetadata.reservationsDescription,
	};
}

const ReservationsListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationsListClient session={session} />;
};

export default ReservationsListPage;
