import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxDashboardClient from '@/components/pages/locaux/locaux-dashboard';

export const metadata: Metadata = {
	title: 'Dashboard des Locaux',
	description: 'Tableau de bord des locaux',
};

const LocauxDashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxDashboardClient session={session} />;
};

export default LocauxDashboardPage;
