import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, DASHBOARD_EDIT_PROFILE } from '@/utils/routes';

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	redirect(DASHBOARD_EDIT_PROFILE);
};

export default DashboardPage;
