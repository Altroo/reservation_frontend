import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, COSTS_LIST } from '@/utils/routes';
import CostViewClient from '@/components/pages/costs/cost-view';

export const metadata: Metadata = {
	title: 'Détail du coût',
	description: 'Détail du coût',
};

interface Props {
	params: Promise<{ id: string }>;
}

const CostViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(COSTS_LIST);
	}

	return <CostViewClient session={session} id={Number(id)} />;
};

export default CostViewPage;
