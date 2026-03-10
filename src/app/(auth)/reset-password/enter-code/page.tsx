import { cookies } from 'next/headers';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import EnterCodeClient from '@/components/pages/auth/reset-password/enterCode';

export const metadata: Metadata = {
	title: 'Entrer le code',
	description: 'Entrer le code de vérification reçu par email',
};

const EnterCodePage = async () => {
	const session = await auth();
	if (session) {
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const email = cookieStore.get('@new_email')?.value ?? '';
	if (!email) {
		redirect(AUTH_RESET_PASSWORD);
	}

	return <EnterCodeClient email={email} />;
};

export default EnterCodePage;
