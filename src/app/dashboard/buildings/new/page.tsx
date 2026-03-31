import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BuildingFormClient from '@/components/pages/buildings/building-form';

export const metadata: Metadata = {
	title: 'Nouvelle résidence',
	description: 'Ajouter une nouvelle résidence',
};

const BuildingAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BuildingFormClient session={session} />;
};

export default BuildingAddPage;
