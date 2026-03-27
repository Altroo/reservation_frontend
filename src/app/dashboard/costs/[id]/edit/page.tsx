import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, COSTS_LIST } from '@/utils/routes';
import CostFormClient from '@/components/pages/costs/cost-form';

export const metadata: Metadata = {
	title: 'Modifier le coût',
	description: 'Modifier un coût existant',
};

interface Props {
	params: Promise<{ id: string }>;
}

const CostEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(COSTS_LIST);
	}

	return <CostFormClient session={session} id={Number(id)} />;
};

export default CostEditPage;
