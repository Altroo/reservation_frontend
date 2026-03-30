import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocalFormClient from '@/components/pages/locaux/local-form';

export const metadata: Metadata = {
	title: 'Nouveau local',
	description: 'Ajouter un nouveau local',
};

const LocalAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocalFormClient session={session} />;
};

export default LocalAddPage;
