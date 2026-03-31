import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BuildingsListClient from '@/components/pages/buildings/buildings-list';

export const metadata: Metadata = {
	title: 'Résidences',
	description: 'Gestion des résidences',
};

const BuildingsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BuildingsListClient session={session} />;
};

export default BuildingsPage;
