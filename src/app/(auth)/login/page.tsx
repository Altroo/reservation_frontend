import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import LoginClient from '@/components/pages/auth/login/login';
import { DASHBOARD } from '@/utils/routes';

export const metadata: Metadata = {
	title: 'Connexion',
	description: 'Connexion à votre compte',
};

const LoginPage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	}

	return <LoginClient />;
};

export default LoginPage;
