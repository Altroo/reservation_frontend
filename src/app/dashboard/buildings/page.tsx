import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BuildingsListClient from '@/components/pages/buildings/buildings-list';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.buildingsTitle,
		description: t.pageMetadata.buildingsDescription,
	};
}

const BuildingsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BuildingsListClient session={session} />;
};

export default BuildingsPage;
