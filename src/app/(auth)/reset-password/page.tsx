import type { Metadata } from 'next';
import ResetPasswordClient from '@/components/pages/auth/reset-password/resetPassword';
import { getServerTranslations } from '@/utils/getServerTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return {
		title: t.pageMetadata.resetPasswordTitle,
	};
}

const ResetPasswordPage = () => <ResetPasswordClient />;

export default ResetPasswordPage;
