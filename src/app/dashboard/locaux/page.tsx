import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxListClient from '@/components/pages/locaux/locaux-list';

export const metadata: Metadata = {
	title: 'Locaux',
	description: 'Gestion des locaux',
};

const LocauxPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxListClient session={session} />;
};

export default LocauxPage;
