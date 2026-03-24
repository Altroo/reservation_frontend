'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import { useAppSelector } from '@/utils/hooks';
import { getWSMaintenanceState } from '@/store/selectors';
import Logo from '../../../../../public/assets/images/reservation-logo.png';
import MaintenanceSVG from '../../../../../public/assets/images/auth_illu/maintenance.svg';

const Maintenance: React.FC = () => {
	const maintenance = useAppSelector(getWSMaintenanceState);

	if (!maintenance) {
		return null;
	}

	return (
		<Box
			data-testid="maintenance-gate"
			sx={{
				position: 'fixed',
				inset: 0,
				zIndex: (theme) => theme.zIndex.modal + 100,
				backgroundColor: '#FFFFFF',
				overflowY: 'auto',
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'minmax(280px, 32%) 1fr',
					},
					minHeight: '100vh',
				}}
			>
				<Box
					sx={{
						display: { xs: 'none', md: 'flex' },
						flexDirection: 'column',
						justifyContent: 'space-between',
						background: 'linear-gradient(180deg, #FFF3E0 0%, #FCE8CC 100%)',
						p: 5,
						overflow: 'hidden',
					}}
				>
					<Image
						src={Logo}
						alt="E.B.H Réservation - Logo"
						priority
						style={{ width: '150px', height: 'auto' }}
					/>
					<Box sx={{ width: '100%', maxWidth: 420 }}>
						<Image
							src={MaintenanceSVG}
							alt=""
							priority
							style={{ width: '100%', height: 'auto' }}
						/>
					</Box>
				</Box>

				<Stack
					component="main"
					role="alertdialog"
					aria-live="assertive"
					aria-labelledby="maintenance-title"
					aria-describedby="maintenance-description"
					sx={{
						minHeight: '100vh',
						justifyContent: 'center',
						px: { xs: 3, sm: 6, md: 8 },
						py: { xs: 5, sm: 6, md: 8 },
						background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
					}}
				>
					<Stack direction="row" justifyContent="center" sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
						<Image
							src={Logo}
							alt="E.B.H Réservation - Logo"
							priority
							style={{ width: '88px', height: 'auto' }}
						/>
					</Stack>

					<Paper
						elevation={0}
						sx={{
							width: '100%',
							maxWidth: 560,
							p: { xs: 4, sm: 5 },
							borderRadius: 4,
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: '0 24px 80px rgba(13, 7, 11, 0.08)',
							backgroundColor: '#FFFFFF',
						}}
					>
						<Stack spacing={3}>
							<Chip
								icon={<BuildCircleOutlinedIcon />}
								label="Maintenance"
								sx={{
									alignSelf: 'flex-start',
									backgroundColor: '#FFF3E0',
									color: '#A15C07',
									fontWeight: 600,
								}}
							/>

							<Stack spacing={1.5}>
								<Typography
									id="maintenance-title"
									variant="h3"
									sx={{
										fontSize: { xs: '2rem', md: '2.75rem' },
										lineHeight: 1.05,
										fontWeight: 700,
										color: '#0D070B',
									}}
								>
									Maintenance en cours
								</Typography>
								<Typography
									id="maintenance-description"
									variant="body1"
									sx={{
										fontSize: '1rem',
										lineHeight: 1.7,
										color: '#6B7280',
									}}
								>
									Nous effectuons actuellement une maintenance sur E.B.H Réservation afin d&apos;améliorer la
									stabilité de l&apos;application.
								</Typography>
							</Stack>

							<Divider />

							<Stack spacing={1.5}>
								<Typography variant="body1" sx={{ color: '#0D070B', fontWeight: 600 }}>
									L&apos;accès à l&apos;application est momentanément suspendu.
								</Typography>
								<Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.7 }}>
									Merci de revenir plus tard. Vos données restent inchangées pendant l&apos;intervention.
								</Typography>
							</Stack>
						</Stack>
					</Paper>
				</Stack>
			</Box>
		</Box>
	);
};

export default Maintenance;
