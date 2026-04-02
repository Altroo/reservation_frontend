import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BuildingFormClient from '@/components/pages/buildings/building-form';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.buildingsNewTitle,
		description: t.pageMetadata.buildingsNewDescription,
	};
}

const BuildingAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BuildingFormClient session={session} />;
};

export default BuildingAddPage;
