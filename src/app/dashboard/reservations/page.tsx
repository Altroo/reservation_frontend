import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationsListClient from '@/components/pages/reservations/reservations-list';

export const metadata: Metadata = {
	title: 'Liste des réservations',
	description: 'Liste des réservations',
};

const ReservationsListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationsListClient session={session} />;
};

export default ReservationsListPage;
