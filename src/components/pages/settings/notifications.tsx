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
import { useLanguage, useToast } from '@/utils/hooks';
import { Edit as EditIcon } from '@mui/icons-material';
import type { NotificationPreferenceFormValues, ReminderMinutesValue } from '@/types/reservationTypes';

const FormikContent: React.FC = () => {
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const reminderOptions: { value: ReminderMinutesValue; label: string }[] = t.settings.reminderOptions as {
		value: ReminderMinutesValue;
		label: string;
	}[];
	const { data: preferences, isLoading: isPreferencesLoading } = useGetNotificationPreferencesQuery();
	const [updatePreferences, { isLoading: isUpdateLoading }] = useUpdateNotificationPreferencesMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<NotificationPreferenceFormValues>({
		initialValues: {
			notify_check_in: preferences?.notify_check_in ?? true,
			notify_check_out: preferences?.notify_check_out ?? true,
			notify_unpaid_rents: preferences?.notify_unpaid_rents ?? true,
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
					notify_unpaid_rents: values.notify_unpaid_rents,
					reminder_minutes: values.reminder_minutes,
				}).unwrap();
				onSuccess(t.settings.notificationUpdateSuccess);
			} catch (e) {
				onError(t.settings.notificationUpdateError);
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
		<Stack
			direction="column"
			spacing={2}
			className={`${Styles.flexRootStack}`}
			sx={{
				alignItems: 'center',
				mt: '32px',
			}}
		>
			{(isPreferencesLoading || isUpdateLoading || isPending) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>{t.settings.notificationPreferences}</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack
					direction="column"
					spacing={3}
					sx={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Box sx={{ maxWidth: 365, width: '100%' }}>
						<Stack spacing={2}>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_check_in}
										onChange={(e) => formik.setFieldValue('notify_check_in', e.target.checked)}
									/>
								}
								label={t.settings.checkInNotifications}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_check_out}
										onChange={(e) => formik.setFieldValue('notify_check_out', e.target.checked)}
									/>
								}
								label={t.settings.checkOutNotifications}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_unpaid_rents}
										onChange={(e) => formik.setFieldValue('notify_unpaid_rents', e.target.checked)}
									/>
								}
								label={t.settings.unpaidRentReminders}
							/>
							<FormControl size="small" fullWidth>
								<InputLabel id="reminder-minutes-label">{t.settings.reminderDelay}</InputLabel>
								<Select
									labelId="reminder-minutes-label"
									value={String(formik.values.reminder_minutes)}
									label={t.settings.reminderDelay}
									onChange={(e: SelectChangeEvent) => formik.setFieldValue('reminder_minutes', Number(e.target.value))}
								>
									{reminderOptions.map((opt) => (
										<MenuItem key={opt.value} value={String(opt.value)}>
											{opt.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>
					</Box>
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

const NotificationsClient: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.notificationPreferences}>
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
