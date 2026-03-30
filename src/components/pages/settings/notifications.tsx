'use client';

import React, { useEffect, useState } from 'react';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import type { SelectChangeEvent } from '@mui/material';
import {
	Box,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { setFormikAutoErrors } from '@/utils/helpers';
import { useFormik } from 'formik';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import {
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
} from '@/store/services/reservation';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useToast } from '@/utils/hooks';
import { Edit as EditIcon } from '@mui/icons-material';
import type { NotificationPreferenceFormValues, ReminderMinutesValue } from '@/types/reservationTypes';

const REMINDER_OPTIONS: { value: ReminderMinutesValue; label: string }[] = [
	{ value: 0, label: 'Pas de rappel' },
	{ value: 15, label: '15 minutes avant' },
	{ value: 30, label: '30 minutes avant' },
	{ value: 60, label: '1 heure avant' },
	{ value: 120, label: '2 heures avant' },
	{ value: 1440, label: '1 jour avant' },
	{ value: 2880, label: '2 jours avant' },
];

const FormikContent: React.FC = () => {
	const { onSuccess, onError } = useToast();
	const { data: preferences, isLoading: isPreferencesLoading } = useGetNotificationPreferencesQuery();
	const [updatePreferences, { isLoading: isUpdateLoading }] = useUpdateNotificationPreferencesMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<NotificationPreferenceFormValues>({
		initialValues: {
			notify_check_in: preferences?.notify_check_in ?? true,
			notify_check_out: preferences?.notify_check_out ?? true,
			reminder_minutes: preferences?.reminder_minutes ?? 60,
			globalError: '',
		},
		enableReinitialize: true,
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			try {
				await updatePreferences({
					notify_check_in: values.notify_check_in,
					notify_check_out: values.notify_check_out,
					reminder_minutes: values.reminder_minutes,
				}).unwrap();
				onSuccess('Les préférences de notification ont été mises à jour.');
			} catch (e) {
				onError('Échec de la mise à jour des préférences.');
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	// Request Browser Notification permission on mount
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
			void Notification.requestPermission();
		}
	}, []);

	return (
		<Stack direction="column" alignItems="center" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
			{(isPreferencesLoading || isUpdateLoading || isPending) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>Préférences de notifications</h2>

			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" justifyContent="center" alignItems="center" spacing={3}>
					<Box sx={{ maxWidth: 365, width: '100%' }}>
						<Stack spacing={2}>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_check_in}
										onChange={(e) => formik.setFieldValue('notify_check_in', e.target.checked)}
									/>
								}
								label="Notifications de check-in"
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_check_out}
										onChange={(e) => formik.setFieldValue('notify_check_out', e.target.checked)}
									/>
								}
								label="Notifications de check-out"
							/>
							<FormControl size="small" fullWidth>
								<InputLabel id="reminder-minutes-label">Délai de rappel</InputLabel>
								<Select
									labelId="reminder-minutes-label"
									value={String(formik.values.reminder_minutes)}
									label="Délai de rappel"
									onChange={(e: SelectChangeEvent) => formik.setFieldValue('reminder_minutes', Number(e.target.value))}
								>
									{REMINDER_OPTIONS.map((opt) => (
										<MenuItem key={opt.value} value={String(opt.value)}>
											{opt.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>
					</Box>
					<PrimaryLoadingButton
						buttonText="Enregistrer"
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

const NotificationsClient: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title="Préférences de notifications">
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
							<FormikContent />
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default NotificationsClient;
