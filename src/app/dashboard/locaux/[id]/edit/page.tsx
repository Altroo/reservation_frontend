import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOCAUX_LIST } from '@/utils/routes';
import LocalFormClient from '@/components/pages/locaux/local-form';

export const metadata: Metadata = {
	title: 'Modifier le local',
	description: 'Modifier un local existant',
};

interface Props {
	params: Promise<{ id: string }>;
}

const LocalEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(LOCAUX_LIST);
	}

	return <LocalFormClient session={session} id={Number(id)} />;
};

export default LocalEditPage;
