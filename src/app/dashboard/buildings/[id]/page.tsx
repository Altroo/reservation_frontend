import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, BUILDINGS_LIST } from '@/utils/routes';
import BuildingViewClient from '@/components/pages/buildings/building-view';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.buildingsDetailTitle,
		description: t.pageMetadata.buildingsDetailDescription,
	};
}

interface Props {
	params: Promise<{ id: string }>;
}

const BuildingViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(BUILDINGS_LIST);
	}

	return <BuildingViewClient session={session} id={Number(id)} />;
};

export default BuildingViewPage;
