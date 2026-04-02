import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import PasswordClient from '@/components/pages/settings/password';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.changePasswordTitle,
		description: t.pageMetadata.changePasswordDescription,
	};
}

const EditPasswordPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PasswordClient />;
};

export default EditPasswordPage;
