import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CostsListClient from '@/components/pages/costs/costs-list';

export const metadata: Metadata = {
	title: 'Coûts',
	description: 'Gestion des coûts',
};

const CostsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CostsListClient session={session} />;
};

export default CostsPage;
