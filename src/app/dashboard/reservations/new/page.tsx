import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationFormClient from '@/components/pages/reservations/reservation-form';

export const metadata: Metadata = {
	title: 'Nouvelle réservation',
	description: 'Créer une nouvelle réservation',
};

const ReservationAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationFormClient session={session} />;
};

export default ReservationAddPage;
