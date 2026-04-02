import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import EditProfilClient from '@/components/pages/settings/edit-profile';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.editProfileTitle,
		description: t.pageMetadata.editProfileDescription,
	};
}

const EditProfilePage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <EditProfilClient session={session} />;
};

export default EditProfilePage;
