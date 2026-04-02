import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CalendarClient from '@/components/pages/reservations/calendar-client';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.calendarTitle,
		description: t.pageMetadata.calendarDescription,
	};
}

const CalendarPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CalendarClient session={session} />;
};

export default CalendarPage;
