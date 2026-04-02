import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BalanceClient from '@/components/pages/reservations/balance-view';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.balanceTitle,
		description: t.pageMetadata.balanceDescription,
	};
}

const BalancePage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BalanceClient session={session} />;
};

export default BalancePage;
