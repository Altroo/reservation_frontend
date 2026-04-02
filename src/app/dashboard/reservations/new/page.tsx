import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ReservationFormClient from '@/components/pages/reservations/reservation-form';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.reservationsNewTitle,
		description: t.pageMetadata.reservationsNewDescription,
	};
}

const ReservationAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ReservationFormClient session={session} />;
};

export default ReservationAddPage;
