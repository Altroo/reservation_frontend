import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, COSTS_LIST } from '@/utils/routes';
import CostViewClient from '@/components/pages/costs/cost-view';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.costsDetailTitle,
		description: t.pageMetadata.costsDetailDescription,
	};
}

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
