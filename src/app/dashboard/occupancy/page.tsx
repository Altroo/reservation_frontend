import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import OccupancyClient from '@/components/pages/reservations/occupancy-view';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.occupancyTitle,
		description: t.pageMetadata.occupancyDescription,
	};
}

const OccupancyPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <OccupancyClient session={session} />;
};

export default OccupancyPage;
