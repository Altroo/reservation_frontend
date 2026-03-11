import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import PlanningMonthClient from '@/components/pages/reservations/planning-month';

export const metadata: Metadata = {
	title: 'Planning mensuel',
	description: 'Planning mensuel des réservations',
};

const PlanningPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PlanningMonthClient session={session} />;
};

export default PlanningPage;
