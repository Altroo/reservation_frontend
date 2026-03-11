import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import BalanceClient from '@/components/pages/reservations/balance-view';

export const metadata: Metadata = {
	title: 'Balance & Airbnb',
	description: 'Balance mensuelle et revenus Airbnb',
};

const BalancePage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <BalanceClient session={session} />;
};

export default BalancePage;
