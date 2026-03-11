import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationDashboardClient from '@/components/pages/reservations/reservation-dashboard';

export const metadata: Metadata = {
	title: 'Tableau de bord',
	description: "Vue d'ensemble des réservations",
};

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationDashboardClient session={session} />;
};

export default DashboardPage;
