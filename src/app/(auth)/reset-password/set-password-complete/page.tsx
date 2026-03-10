import { cookies } from 'next/headers';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import SetPasswordCompleteClient from '@/components/pages/auth/reset-password/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';

export const metadata: Metadata = {
	title: 'Mot de passe modifié',
	description: 'Votre mot de passe a été modifié avec succès',
};

const SetPasswordCompletePage = async () => {
	const session = await auth();
	if (session) {
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const passUpdated = cookieStore.get('@pass_updated')?.value ?? '';
	if (!passUpdated) {
		redirect(AUTH_RESET_PASSWORD);
	}

	return (
		<>
			{passUpdated && <ClearCookiesClient />}
			<SetPasswordCompleteClient />
		</>
	);
};

export default SetPasswordCompletePage;
