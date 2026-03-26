'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	InputAdornment,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarMonth as CalendarMonthIcon,
	CreditCard as CreditCardIcon,
	Edit as EditIcon,
	Hotel as HotelIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parseISO, isWithinInterval, subDays } from 'date-fns';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import type { DropDownType } from '@/types/accountTypes';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { reservationSchema } from '@/utils/formValidationSchemas';
import { paymentSourceItemsList } from '@/utils/rawData';
import { setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import { RESERVATIONS_LIST, RESERVATIONS_VIEW } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useToast } from '@/utils/hooks';
import {
	useAddApartmentMutation,
	useCreateReservationMutation,
	useGetApartmentsQuery,
	useGetOccupiedDatesQuery,
	useGetReservationQuery,
	useUpdateReservationMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { Protected } from '@/components/layouts/protected/protected';

const inputTheme = textInputTheme();

export interface ReservationFormValues {
	apartment: number | '';
	guest_name: string;
	check_in: string;
	check_out: string;
	amount: string;
	payment_source: string;
	notes: string;
	globalError: string;
}

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, id }) => {
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const router = useRouter();
	const topRef = useRef<HTMLDivElement | null>(null);

	const { data: rawData, isLoading: isDataLoading } = useGetReservationQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const { data: apartments, isLoading: isApartmentsLoading } = useGetApartmentsQuery(undefined, { skip: !token });

	const [createReservation, { isLoading: isCreateLoading, error: createError }] = useCreateReservationMutation();
	const [updateReservation, { isLoading: isUpdateLoading, error: updateError }] = useUpdateReservationMutation();
	const [addApartment] = useAddApartmentMutation();

	const error = isEditMode ? updateError : createError;
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const [isPending, setIsPending] = useState(false);
	const [openApartmentModal, setOpenApartmentModal] = useState(false);

	const apartmentItems: DropDownType[] = useMemo(
		() => (apartments ?? []).map((a) => ({ code: a.nom, value: String(a.id) })),
		[apartments],
	);

	const formik = useFormik<ReservationFormValues>({
		initialValues: {
			apartment: rawData?.apartment ?? '',
			guest_name: rawData?.guest_name ?? '',
			check_in: rawData?.check_in ?? '',
			check_out: rawData?.check_out ?? '',
			amount: rawData?.amount ?? '',
			payment_source: rawData?.payment_source ?? '',
			notes: rawData?.notes ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(reservationSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateReservation({ id: id!, data: fields }).unwrap();
					onSuccess('La réservation a été mise à jour avec succès.');
					router.push(RESERVATIONS_VIEW(id!));
				} else {
					await createReservation(fields).unwrap();
					onSuccess('La réservation a été ajoutée avec succès.');
					router.push(RESERVATIONS_LIST);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? 'Échec de la mise à jour de la réservation.' : "Échec de l'ajout de la réservation.");
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedApartment = useMemo<DropDownType | null>(() => {
		const v = formik.values.apartment;
		if (!v || apartmentItems.length === 0) return null;
		return apartmentItems.find((a) => a.value === String(v)) ?? null;
	}, [formik.values.apartment, apartmentItems]);

	const { data: occupiedRanges } = useGetOccupiedDatesQuery(
		{ apartment: formik.values.apartment, ...(isEditMode ? { exclude: id } : {}) },
		{ skip: !token || !formik.values.apartment },
	);

	const shouldDisableDate = useCallback(
		(date: Date) => {
			if (!occupiedRanges || occupiedRanges.length === 0) return false;
			return occupiedRanges.some((r) => {
				const start = parseISO(r.check_in);
				const end = subDays(parseISO(r.check_out), 1);
				return isWithinInterval(date, { start, end });
			});
		},
		[occupiedRanges],
	);

	const paymentSourceItems: DropDownType[] = useMemo(
		() => paymentSourceItemsList.map((p) => ({ code: p.value, value: p.code })),
		[],
	);

	const selectedPaymentSource = useMemo<DropDownType | null>(() => {
		const v = formik.values.payment_source;
		if (!v) return null;
		return paymentSourceItems.find((p) => p.value === v) ?? null;
	}, [formik.values.payment_source, paymentSourceItems]);

	const validationEntries = useMemo(
		() => Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][],
		[formik.errors],
	);

	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	useEffect(() => {
		if (formik.submitCount > 0 && hasValidationErrors) {
			onError('Veuillez corriger les erreurs de validation avant de soumettre.');
			topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, [formik.submitCount, hasValidationErrors, onError]);

	const isLoading =
		isCreateLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading) || isApartmentsLoading;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				{/* Header */}
				<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(RESERVATIONS_LIST)}
						sx={{
							whiteSpace: 'nowrap',
							px: { xs: 1.5, sm: 2, md: 3 },
							py: { xs: 0.8, sm: 1, md: 1 },
							fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
						}}
					>
						Liste des réservations
					</Button>
				</Stack>

				{showValidationAlert && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography variant="subtitle2" fontWeight={600}>
							Erreurs de validation détectées:
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{validationEntries.map(([key, err]) => (
								<li key={key}>
									<Typography variant="body2">{err}</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}

				{isLoading ? (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				) : shouldShowError ? (
					<ApiAlert errorDetails={axiosError?.data as unknown as Record<string, string[]>} />
				) : (
					<form onSubmit={formik.handleSubmit}>
						<Stack spacing={3}>
							{/* Détails de la réservation */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<HotelIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Détails de la réservation
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomAutoCompleteSelect
											id="apartment"
											size="small"
											noOptionsText="Aucun appartement trouvé"
											label="Appartement *"
											items={apartmentItems}
											theme={inputTheme}
											value={selectedApartment}
											fullWidth
											onChange={(_, newVal) => {
												formik.setFieldValue('apartment', newVal ? Number(newVal.value) : '');
											}}
											onBlur={formik.handleBlur('apartment')}
											error={formik.submitCount > 0 && Boolean(formik.errors.apartment)}
											helperText={formik.submitCount > 0 ? ((formik.errors.apartment as string) ?? '') : ''}
											disabled={isLoading}
											startIcon={<HotelIcon fontSize="small" />}
											endIcon={
												<Button
													size="small"
													variant="outlined"
													onClick={() => setOpenApartmentModal(true)}
													sx={{ ml: 1 }}
												>
													Ajouter
												</Button>
											}
										/>
										<CustomTextInput
											theme={inputTheme}
											id="guest_name"
											type="text"
											size="small"
											label="Nom du client *"
											value={formik.values.guest_name}
											onChange={formik.handleChange('guest_name')}
											onBlur={formik.handleBlur('guest_name')}
											error={formik.submitCount > 0 && Boolean(formik.errors.guest_name)}
											helperText={formik.submitCount > 0 ? (formik.errors.guest_name ?? '') : ''}
											fullWidth
											startIcon={<PersonIcon fontSize="small" />}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Dates du séjour */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<CalendarMonthIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Dates du séjour
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
											<DatePicker
												label="Date d'arrivée *"
												value={formik.values.check_in ? parseISO(formik.values.check_in) : null}
												onChange={(date) => formik.setFieldValue('check_in', date ? format(date, 'yyyy-MM-dd') : '')}
												maxDate={formik.values.check_out ? parseISO(formik.values.check_out) : undefined}
												shouldDisableDate={shouldDisableDate}
												disabled={isLoading}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														onBlur: formik.handleBlur('check_in'),
														error: formik.submitCount > 0 && Boolean(formik.errors.check_in),
														helperText: formik.submitCount > 0 ? (formik.errors.check_in ?? '') : '',
														InputProps: {
															startAdornment: (
																<InputAdornment position="start">
																	<CalendarMonthIcon fontSize="small" />
																</InputAdornment>
															),
														},
													},
												}}
											/>
											<DatePicker
												label="Date de départ *"
												value={formik.values.check_out ? parseISO(formik.values.check_out) : null}
												onChange={(date) => formik.setFieldValue('check_out', date ? format(date, 'yyyy-MM-dd') : '')}
												minDate={formik.values.check_in ? parseISO(formik.values.check_in) : undefined}
												shouldDisableDate={shouldDisableDate}
												disabled={isLoading}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														onBlur: formik.handleBlur('check_out'),
														error: formik.submitCount > 0 && Boolean(formik.errors.check_out),
														helperText: formik.submitCount > 0 ? (formik.errors.check_out ?? '') : '',
														InputProps: {
															startAdornment: (
																<InputAdornment position="start">
																	<CalendarMonthIcon fontSize="small" />
																</InputAdornment>
															),
														},
													},
												}}
											/>
										</Stack>
									</Stack>
								</CardContent>
							</Card>

							{/* Paiement */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<CreditCardIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Paiement
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
											<CustomTextInput
												theme={inputTheme}
												id="amount"
												type="text"
												size="small"
												label="Montant total (MAD) *"
												value={formik.values.amount}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
														formik.setFieldValue('amount', e.target.value);
												}}
												onBlur={formik.handleBlur('amount')}
												error={formik.submitCount > 0 && Boolean(formik.errors.amount)}
												helperText={formik.submitCount > 0 ? (formik.errors.amount ?? '') : ''}
												fullWidth
												disabled={isLoading}
												startIcon={<AttachMoneyIcon fontSize="small" />}
												slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
											/>
											<CustomAutoCompleteSelect
												id="payment_source"
												size="small"
												noOptionsText="Aucune source trouvée"
												label="Source de paiement *"
												items={paymentSourceItems}
												theme={inputTheme}
												value={selectedPaymentSource}
												fullWidth
												onChange={(_, newVal) => {
													formik.setFieldValue('payment_source', newVal ? newVal.value : '');
												}}
												onBlur={formik.handleBlur('payment_source')}
												error={formik.submitCount > 0 && Boolean(formik.errors.payment_source)}
												helperText={formik.submitCount > 0 ? (formik.errors.payment_source ?? '') : ''}
												disabled={isLoading}
												startIcon={<CreditCardIcon fontSize="small" />}
											/>
										</Stack>
									</Stack>
								</CardContent>
							</Card>

							{/* Notes */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
										<NotesIcon color="primary" />
										<Typography variant="h6" fontWeight={700}>
											Notes
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<CustomTextInput
											theme={inputTheme}
											id="notes"
											type="text"
											size="small"
											label="Notes (optionnel)"
											value={formik.values.notes}
											onChange={formik.handleChange('notes')}
											onBlur={formik.handleBlur('notes')}
											multiline
											rows={3}
											fullWidth
											disabled={isLoading}
											startIcon={<NotesIcon fontSize="small" />}
										/>
									</Stack>
								</CardContent>
							</Card>

							{/* Submit */}
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
								<PrimaryLoadingButton
									buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter la réservation'}
									loading={isPending}
									active={!isPending}
									type="submit"
									startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (showValidationAlert) {
											e.preventDefault();
											onError('Veuillez corriger les erreurs de validation avant de soumettre.');
											topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
										}
									}}
									cssClass={Styles.submitButton}
								/>
							</Box>
						</Stack>
					</form>
				)}
			</Stack>

			<AddEntityModal
				open={openApartmentModal}
				setOpen={setOpenApartmentModal}
				label="appartement"
				icon={<HotelIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addApartment(args)}
				onSuccess={(newId) => {
					formik.setFieldValue('apartment', newId);
				}}
			/>
		</LocalizationProvider>
	);
};

const ReservationFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken();
	const title = id !== undefined ? 'Modifier la réservation' : 'Nouvelle réservation';

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<FormikContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ReservationFormClient;



