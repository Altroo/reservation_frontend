'use client';

import { useState, type ReactNode, type Ref } from 'react';
import Styles from './authLayout.module.sass';
import { Box, Stack } from '@mui/material';
import Image from 'next/image';
import Logo from '../../../../public/assets/images/reservation-logo.png';
import { useLanguage } from '@/utils/hooks';
import { AUTH_BACKGROUND_IMAGES } from '@/utils/rawData';
import type { AuthBackground } from '@/types/authTypes';

type Props = {
	children?: ReactNode;
};

const AuthLayout = ({ ref, ...props }: Props & { ref?: Ref<HTMLAnchorElement> }) => {
	const { t } = useLanguage();
	const [authIlluRandom] = useState<AuthBackground>(
		() => AUTH_BACKGROUND_IMAGES[Math.floor(Math.random() * AUTH_BACKGROUND_IMAGES.length)],
	);

	return (
		<main className={Styles.main} ref={ref}>
			<Stack direction="row">
				{/* Left side */}
				<Box
					className={Styles.leftBox}
					sx={{
						background: `url(${authIlluRandom ? authIlluRandom.image : ''}) bottom left no-repeat scroll ${
							authIlluRandom && authIlluRandom.color
						}`,
						msFilter: `progid:DXImageTransform.Microsoft.AlphaImageLoader(src='${
							authIlluRandom ? authIlluRandom.image : ''
						}', sizingMethod='scale')`,
						backgroundSize: 'contain',
					}}
				>
					<Image src={Logo} alt={t.common.appName} width="0" height="0" sizes="100vw" className={Styles.logo} />
				</Box>
				{/* Right side */}
				<Box className={Styles.rightBox}>
					{/* Children content */}
					{props.children}
				</Box>
			</Stack>
		</main>
	);
};
AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
