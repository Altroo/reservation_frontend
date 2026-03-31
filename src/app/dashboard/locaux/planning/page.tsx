import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxPlanningClient from '@/components/pages/locaux/locaux-planning';

export const metadata: Metadata = {
	title: 'Planning des loyers',
	description: 'Planning des loyers par local',
};

const LocauxPlanningPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxPlanningClient session={session} />;
};

export default LocauxPlanningPage;
