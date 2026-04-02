import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxDashboardClient from '@/components/pages/locaux/locaux-dashboard';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.locauxDashboardTitle,
		description: t.pageMetadata.locauxDashboardDescription,
	};
}

const LocauxDashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxDashboardClient session={session} />;
};

export default LocauxDashboardPage;
