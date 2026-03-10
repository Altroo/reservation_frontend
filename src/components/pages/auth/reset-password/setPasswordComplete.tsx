import React from 'react';
import Styles from '@/styles/auth/auth.module.sass';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack } from '@mui/material';
import Image from 'next/image';
import SuccessIlluSVG from '../../../../../public/assets/images/success-illu.svg';
import PrimaryAnchorButton from '@/components/htmlElements/buttons/primaryAnchorButton/primaryAnchorButton';
import { AUTH_LOGIN } from '@/utils/routes';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { Login as LoginIcon } from '@mui/icons-material';

const SetPasswordCompleteClient: React.FC = () => {
	return (
		<>
			<Desktop>
				<div>
					<AuthLayout>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
						<h1 className={Styles.header}>Mot de passe modifié</h1>
						<p className={Styles.subHeader}>Votre mot de passe a été modifié, connectez-vous</p>
							<PrimaryAnchorButton
								startIcon={<LoginIcon />}
								buttonText="Me connecter"
								active={true}
								nextPage={AUTH_LOGIN}
							/>
						</Stack>
					</AuthLayout>
				</div>
			</Desktop>
			<TabletAndMobile>
				<div>
					<main className={Styles.main}>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
						<h1 className={Styles.header}>Mot de passe modifié</h1>
						<p className={Styles.subHeader}>Votre mot de passe a été modifié, connectez-vous</p>
						</Stack>
						<div className={Styles.primaryButtonWrapper}>
							<PrimaryAnchorButton
								startIcon={<LoginIcon />}
								buttonText="Me connecter"
								active={true}
								nextPage={AUTH_LOGIN}
							/>
						</div>
					</main>
				</div>
			</TabletAndMobile>
		</>
	);
};

export default SetPasswordCompleteClient;
