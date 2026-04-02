import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, RESERVATIONS_LIST } from '@/utils/routes';
import ReservationFormClient from '@/components/pages/reservations/reservation-form';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.reservationsEditTitle,
		description: t.pageMetadata.reservationsEditDescription,
	};
}

interface Props {
	params: Promise<{ id: string }>;
}

const ReservationEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(RESERVATIONS_LIST);
	}

	return <ReservationFormClient session={session} id={Number(id)} />;
};

export default ReservationEditPage;
