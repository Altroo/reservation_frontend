import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import HiltonReportsClient from '@/components/pages/reports/hilton-reports';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.hiltonReportsTitle,
		description: t.pageMetadata.hiltonReportsDescription,
	};
}

const HiltonReportsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <HiltonReportsClient session={session} />;
};

export default HiltonReportsPage;
