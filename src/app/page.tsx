import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, DASHBOARD } from '@/utils/routes';

export const metadata: Metadata = {
	title: 'Accueil',
	description: "Page d'accueil de l'application E.B.H Réservation",
};

const HomePage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	} else {
		redirect(AUTH_LOGIN);
	}
};

export default HomePage;
