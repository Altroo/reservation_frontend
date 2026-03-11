import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import OccupancyClient from '@/components/pages/reservations/occupancy-view';

export const metadata: Metadata = {
	title: "Taux d'occupation",
	description: "Taux d'occupation par appartement",
};

const OccupancyPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <OccupancyClient session={session} />;
};

export default OccupancyPage;
