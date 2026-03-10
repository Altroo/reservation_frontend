import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, USERS_LIST } from '@/utils/routes';
import UsersViewClient from '@/components/pages/users/users-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: "Détails de l'Utilisateur",
	description: "Consulter les détails d'un utilisateur",
};

interface Props {
	params: Promise<{ id: string }>;
}

const UserDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(USERS_LIST);
	}

	return <UsersViewClient session={session} id={Number(id)} />;
};

export default UserDetailPage;
