import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocauxListClient from '@/components/pages/locaux/locaux-list';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.locauxTitle,
		description: t.pageMetadata.locauxDescription,
	};
}

const LocauxPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocauxListClient session={session} />;
};

export default LocauxPage;
