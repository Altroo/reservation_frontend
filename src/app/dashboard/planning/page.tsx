import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import PlanningMonthClient from '@/components/pages/reservations/planning-month';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.planningTitle,
		description: t.pageMetadata.planningDescription,
	};
}

const PlanningPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PlanningMonthClient session={session} />;
};

export default PlanningPage;
