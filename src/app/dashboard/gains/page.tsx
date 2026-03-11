import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import GainsClient from '@/components/pages/reservations/gains-view';

export const metadata: Metadata = {
	title: 'Gains & Revenus',
	description: 'Gains et revenus par appartement',
};

const GainsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <GainsClient session={session} />;
};

export default GainsPage;
