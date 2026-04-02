import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import LocalFormClient from '@/components/pages/locaux/local-form';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.locauxNewTitle,
		description: t.pageMetadata.locauxNewDescription,
	};
}

const LocalAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <LocalFormClient session={session} />;
};

export default LocalAddPage;
