import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, LOCAUX_LIST } from '@/utils/routes';
import LocalViewClient from '@/components/pages/locaux/local-view';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.locauxDetailTitle,
		description: t.pageMetadata.locauxDetailDescription,
	};
}

interface Props {
	params: Promise<{ id: string }>;
}

const LocalViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(LOCAUX_LIST);
	}

	return <LocalViewClient session={session} id={Number(id)} />;
};

export default LocalViewPage;
