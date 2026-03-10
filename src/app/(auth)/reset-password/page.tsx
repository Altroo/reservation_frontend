import { type Metadata } from 'next';
import ResetPasswordClient from '@/components/pages/auth/reset-password/resetPassword';

export const metadata: Metadata = {
	title: 'Réinitialiser le mot de passe',
};

const ResetPasswordPage = () => <ResetPasswordClient />;

export default ResetPasswordPage;
