'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	CalendarMonth as CalendarMonthIcon,
	Close as CloseIcon,
	CreditCard as CreditCardIcon,
	CurrencyExchange as CurrencyExchangeIcon,
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
import { format, isWithinInterval, parseISO, subDays } from 'date-fns';
import type { ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import type { ReservationFormValues } from '@/types/reservationTypes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { reservationSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useAddApartmentMutation,
	useCreateReservationMutation,
	useGetApartmentsQuery,
	useGetBuildingsQuery,
	useGetOccupiedDatesQuery,
	useGetReservationQuery,
	useUpdateReservationMutation,
} from '@/store/services/reservation';

const inputTheme = textInputTheme();

interface ReservationDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	token: string | undefined;
	initialCheckIn?: string;
	initialCheckOut?: string;
	reservationId?: number;
}

const ReservationDialog: React.FC<ReservationDialogProps> = ({
	open,
	onClose,
	onSuccess,
	token,
	initialCheckIn = '',
	initialCheckOut = '',
	reservationId,
}) => {
	const { onSuccess: toastSuccess, onError: toastError } = useToast();
	const { t } = useLanguage();
	const isEditMode = reservationId !== undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const topRef = useRef<HTMLDivElement | null>(null);
	const [isPending, setIsPending] = useState(false);
	const [openApartmentModal, setOpenApartmentModal] = useState(false);

	const { data: rawData, isLoading: isDataLoading } = useGetReservationQuery(
		{ id: reservationId! },
		{ skip: !token || !isEditMode },
	);

	const { data: apartments, isLoading: isApartmentsLoading } = useGetApartmentsQuery(undefined, {
		skip: !token,
	});
	const { data: buildings } = useGetBuildingsQuery(undefined, { skip: !token });

	const [createReservation, { isLoading: isCreateLoading, error: createError }] = useCreateReservationMutation();
	const [updateReservation, { isLoading: isUpdateLoading, error: updateError }] = useUpdateReservationMutation();
	const [addApartment] = useAddApartmentMutation();

	const error = isEditMode ? updateError : createError;
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const apartmentItems: DropDownType[] = useMemo(
		() =>
			(apartments ?? []).map((a) => ({
				code: a.building_nom ? `${a.nom} - ${a.building_nom}` : a.nom,
				value: String(a.id),
			})),
		[apartments],
	);

	const formik = useFormik<ReservationFormValues>({
		initialValues: {
			apartment: rawData?.apartment ?? '',
			guest_name: rawData?.guest_name ?? '',
			check_in: rawData?.check_in ?? initialCheckIn,
			check_out: rawData?.check_out ?? initialCheckOut,
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
					await updateReservation({ id: reservationId!, data: fields }).unwrap();
					toastSuccess(t.reservations.reservationUpdatedSuccess);
				} else {
					await createReservation(fields).unwrap();
					toastSuccess(t.reservations.reservationAddedSuccess);
				}
				onSuccess();
				onClose();
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				toastError(isEditMode ? t.reservations.reservationUpdateError : t.reservations.reservationAddError);
				topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
		{ apartment: formik.values.apartment, ...(isEditMode ? { exclude: reservationId } : {}) },
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
		() => [
			{ code: 'Booking', value: 'Booking' },
			{ code: 'Airbnb', value: 'Airbnb' },
			{ code: t.rawData.paymentSources.cash, value: 'Cash' },
			{ code: t.rawData.paymentSources.bankTransfer, value: 'Bank' },
		],
		[t],
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

	const isLoading =
		isCreateLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading) || isApartmentsLoading;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	// Reset form when dialog closes
	useEffect(() => {
		if (!open) {
			formik.resetForm();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Dialog open={open} onClose={onClose} fullScreen={isMobile} maxWidth="md" fullWidth scroll="paper">
				<DialogTitle>
					<Stack
						direction="row"
						sx={{
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<Typography
							variant="h6"
							sx={{
								fontWeight: 700,
							}}
						>
							{isEditMode ? t.reservations.editReservation : t.reservations.newReservation}
						</Typography>
						<IconButton onClick={onClose} size="small">
							<CloseIcon />
						</IconButton>
					</Stack>
				</DialogTitle>

				<DialogContent dividers>
					<Stack ref={topRef} spacing={2.5}>
						{showValidationAlert && (
							<Alert severity="error" icon={<WarningIcon />}>
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 600,
									}}
								>
									{t.reservations.validationErrorsDetected}
								</Typography>
								<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
									{validationEntries.map(([key, err]) => (
										<li key={key}>
											<Typography variant="body2">
												<strong>{getLabelForKey(t.rawData.fieldLabels.reservation, key)}</strong> : {err}
											</Typography>
										</li>
									))}
								</ul>
							</Alert>
						)}

						{formik.errors.globalError && <Alert severity="error">{formik.errors.globalError}</Alert>}

						{shouldShowError && <ApiAlert errorDetails={axiosError?.data as Record<string, unknown>} />}

						{/* Appartement & Client */}
						<Box>
							<Stack
								direction="row"
								spacing={1}
								sx={{
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<HotelIcon color="primary" fontSize="small" />
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
									}}
								>
									{t.reservations.reservationDetailsSection}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 2 }} />
							<Stack spacing={2}>
								<CustomAutoCompleteSelect
									id="apartment"
									size="small"
									noOptionsText={t.reservations.noApartmentFound}
									label={t.reservations.apartmentRequired}
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
											sx={{ ml: 1, whiteSpace: 'nowrap' }}
										>
											{t.reservations.addBtn}
										</Button>
									}
								/>
								<CustomTextInput
									theme={inputTheme}
									id="guest_name"
									type="text"
									size="small"
									label={t.reservations.guestNameRequired}
									value={formik.values.guest_name}
									onChange={formik.handleChange('guest_name')}
									onBlur={formik.handleBlur('guest_name')}
									error={formik.submitCount > 0 && Boolean(formik.errors.guest_name)}
									helperText={formik.submitCount > 0 ? (formik.errors.guest_name ?? '') : ''}
									fullWidth
									startIcon={<PersonIcon fontSize="small" />}
								/>
							</Stack>
						</Box>

						{/* Dates */}
						<Box>
							<Stack
								direction="row"
								spacing={1}
								sx={{
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<CalendarMonthIcon color="primary" fontSize="small" />
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
									}}
								>
									{t.reservations.stayDates}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 2 }} />
							<Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
								<DatePicker
									label={t.reservations.checkInRequired}
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
											slotProps: {
												input: {
													startAdornment: (
														<InputAdornment position="start">
															<CalendarMonthIcon fontSize="small" />
														</InputAdornment>
													),
												},
											},
										},
									}}
								/>
								<DatePicker
									label={t.reservations.checkOutRequired}
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
											slotProps: {
												input: {
													startAdornment: (
														<InputAdornment position="start">
															<CalendarMonthIcon fontSize="small" />
														</InputAdornment>
													),
												},
											},
										},
									}}
								/>
							</Stack>
						</Box>

						{/* Paiement */}
						<Box>
							<Stack
								direction="row"
								spacing={1}
								sx={{
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<CreditCardIcon color="primary" fontSize="small" />
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
									}}
								>
									{t.common.payment}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 2 }} />
							<Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
								<CustomTextInput
									theme={inputTheme}
									id="amount"
									type="text"
									size="small"
									label={t.reservations.totalAmountMAD}
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
									startIcon={<CurrencyExchangeIcon fontSize="small" />}
									slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
								/>
								<CustomAutoCompleteSelect
									id="payment_source"
									size="small"
									noOptionsText={t.reservations.noSourceFound}
									label={t.reservations.paymentSourceRequired}
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
						</Box>

						{/* Notes */}
						<Box>
							<Stack
								direction="row"
								spacing={1}
								sx={{
									alignItems: 'center',
									mb: 1.5,
								}}
							>
								<NotesIcon color="primary" fontSize="small" />
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
									}}
								>
									{t.reservations.notes}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 2 }} />
							<CustomTextInput
								theme={inputTheme}
								id="notes"
								type="text"
								size="small"
								label={t.reservations.notesOptional}
								value={formik.values.notes}
								onChange={formik.handleChange('notes')}
								onBlur={formik.handleBlur('notes')}
								multiline
								rows={3}
								fullWidth
								disabled={isLoading}
								startIcon={<NotesIcon fontSize="small" />}
							/>
						</Box>

						{/* Actions */}
						<PrimaryLoadingButton
							buttonText={isEditMode ? t.common.update : t.reservations.addReservation}
							loading={isPending}
							active={!isPending}
							type="submit"
							startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
							onClick={() => formik.handleSubmit()}
						/>
					</Stack>
				</DialogContent>
			</Dialog>
			<AddEntityModal
				open={openApartmentModal}
				setOpen={setOpenApartmentModal}
				label={t.reservations.apartment.toLowerCase()}
				icon={<HotelIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addApartment(args)}
				onSuccess={(newId) => {
					formik.setFieldValue('apartment', newId);
				}}
				buildings={buildings}
			/>
		</LocalizationProvider>
	);
};

export default ReservationDialog;
