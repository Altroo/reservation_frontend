import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CalendarClient from '@/components/pages/reservations/calendar-client';

export const metadata: Metadata = {
	title: 'Calendrier',
	description: 'Calendrier mensuel des réservations',
};

const CalendarPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CalendarClient session={session} />;
};

export default CalendarPage;
