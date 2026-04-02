import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationDashboardClient from '@/components/pages/reservations/reservation-dashboard';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.dashboardTitle,
		description: t.pageMetadata.dashboardDescription,
	};
}

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationDashboardClient session={session} />;
};

export default DashboardPage;
