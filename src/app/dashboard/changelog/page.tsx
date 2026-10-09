import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getServerTranslations } from '@/utils/getServerTranslations';
import { AUTH_LOGIN } from '@/utils/routes';
import Changelog from '@/components/pages/dashboard/changelog/changelog';

export async function generateMetadata() {
	const t = await getServerTranslations();
	return { title: t.navigation.changelog, description: t.changelog.description };
}

const ChangelogPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <Changelog />;
};

export default ChangelogPage;
