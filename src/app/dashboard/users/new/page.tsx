import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import UsersFormClient from '@/components/pages/users/users-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Nouvel utilisateur',
	description: 'Créer un nouvel utilisateur',
};

const UserAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <UsersFormClient session={session} />;
};

export default UserAddPage;
