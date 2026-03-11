import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, RESERVATIONS_LIST } from '@/utils/routes';
import ReservationViewClient from '@/components/pages/reservations/reservation-view';

export const metadata: Metadata = {
	title: 'Détail réservation',
	description: 'Détail de la réservation',
};

interface Props {
	params: Promise<{ id: string }>;
}

const ReservationViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(RESERVATIONS_LIST);
	}

	return <ReservationViewClient session={session} id={Number(id)} />;
};

export default ReservationViewPage;
