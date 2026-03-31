import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, BUILDINGS_LIST } from '@/utils/routes';
import BuildingFormClient from '@/components/pages/buildings/building-form';

export const metadata: Metadata = {
	title: 'Modifier la résidence',
	description: 'Modifier une résidence existante',
};

interface Props {
	params: Promise<{ id: string }>;
}

const BuildingEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(BUILDINGS_LIST);
	}

	return <BuildingFormClient session={session} id={Number(id)} />;
};

export default BuildingEditPage;
