'use client';

import React, { useState } from 'react';
import { Alert, Box, InputAdornment, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AccountBalanceWallet as WalletIcon, Edit as EditIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import type { SessionProps } from '@/types/_initTypes';
import {
	useGetHiltonReportSettingsQuery,
	useUpdateHiltonReportSettingsMutation,
} from '@/store/services/reservation';

type FormValues = {
	carry_forward_balance: string;
};

const HiltonReportSettingsContent: React.FC<{ token?: string }> = ({ token }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data: settings, isLoading } = useGetHiltonReportSettingsQuery(undefined, { skip: !token });
	const [updateSettings, { isLoading: isUpdating }] = useUpdateHiltonReportSettingsMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<FormValues>({
		initialValues: {
			carry_forward_balance: settings?.carry_forward_balance ?? '0',
		},
		enableReinitialize: true,
		onSubmit: async (values) => {
			setIsPending(true);
			try {
				await updateSettings({
					carry_forward_balance: values.carry_forward_balance || '0',
				}).unwrap();
				onSuccess(t.settings.hiltonBalanceUpdateSuccess);
			} catch (err) {
				onError(extractApiErrorMessage(err, t.settings.hiltonBalanceUpdateError));
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{ alignItems: 'center', mt: '32px' }}
		>
			{(isLoading || isUpdating || isPending) && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			<h2 className={Styles.pageTitle}>{t.settings.hiltonReportSettings}</h2>
			<form className={Styles.form} onSubmit={(event) => event.preventDefault()}>
				<Stack direction="column" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
					<Box sx={{ maxWidth: 365, width: '100%' }}>
						<Alert severity="info">{t.settings.hiltonBalanceHelp}</Alert>
					</Box>
					<TextField
						id="carry_forward_balance"
						type="number"
						size="small"
						fullWidth
						className={Styles.maxInputWidth}
						label={t.settings.balanceToCarryForward}
						value={formik.values.carry_forward_balance}
						onChange={formik.handleChange('carry_forward_balance')}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<WalletIcon fontSize="small" />
									</InputAdornment>
								),
								endAdornment: <InputAdornment position="end">MAD</InputAdornment>,
							},
							htmlInput: { inputMode: 'decimal', step: '0.01' },
						}}
					/>
					{settings?.date_updated && (
						<Typography variant="caption" sx={{ color: 'text.secondary', width: '100%', maxWidth: 365 }}>
							{t.common.lastUpdate}: {formatDate(settings.date_updated.slice(0, 10))}
						</Typography>
					)}
					<PrimaryLoadingButton
						buttonText={t.settings.save}
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						startIcon={<EditIcon />}
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const HiltonReportSettingsClient: React.FC<SessionProps> = ({ session }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const token = useInitAccessToken(session);
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.hiltonReportSettings}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: isMobile ? 'center' : 'flex-start',
							alignItems: 'flex-start',
						}}
					>
						<Box sx={{ width: '100%' }}>
							<Protected>
								<HiltonReportSettingsContent token={token} />
							</Protected>
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default HiltonReportSettingsClient;
