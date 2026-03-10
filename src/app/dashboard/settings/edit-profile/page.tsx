import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import EditProfilClient from '@/components/pages/settings/edit-profile';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Modifier le Profil',
	description: 'Modifier les informations du profil utilisateur',
};

const EditProfilePage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <EditProfilClient session={session} />;
};

export default EditProfilePage;
