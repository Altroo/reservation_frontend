import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxPlanningClient from '@/components/pages/locaux/locaux-planning';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.locauxPlanningTitle,
		description: t.pageMetadata.locauxPlanningDescription,
	};
}

const LocauxPlanningPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxPlanningClient session={session} />;
};

export default LocauxPlanningPage;
