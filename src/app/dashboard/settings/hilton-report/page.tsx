import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import HiltonReportSettingsClient from '@/components/pages/settings/hilton-report-settings';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.hiltonReportSettingsTitle,
		description: t.pageMetadata.hiltonReportSettingsDescription,
	};
}

const HiltonReportSettingsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <HiltonReportSettingsClient session={session} />;
};

export default HiltonReportSettingsPage;
