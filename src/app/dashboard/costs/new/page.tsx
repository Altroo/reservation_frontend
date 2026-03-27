import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CostFormClient from '@/components/pages/costs/cost-form';

export const metadata: Metadata = {
	title: 'Nouveau coût',
	description: 'Ajouter un nouveau coût',
};

const CostAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CostFormClient session={session} />;
};

export default CostAddPage;
