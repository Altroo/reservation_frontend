'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { ReservationFormValues } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogActions,
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
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarMonthIcon,
	Close as CloseIcon,
	CreditCard as CreditCardIcon,
	CurrencyExchange as CurrencyExchangeIcon,
	Delete as DeleteIcon,
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
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import type { DropDownType } from '@/types/accountTypes';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import { reservationSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { RESERVATIONS_LIST, RESERVATIONS_VIEW } from '@/utils/routes';
import { useRouter } from 'next/navigation';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useAddApartmentMutation,
	useAddPaymentSourceMutation,
	useCreateReservationMutation,
	useDeleteApartmentMutation,
	useDeletePaymentSourceMutation,
	useGetApartmentsQuery,
	useGetBuildingsQuery,
	useGetOccupiedDatesQuery,
	useGetPaymentSourcesQuery,
	useGetReservationQuery,
	useUpdateApartmentMutation,
	useUpdatePaymentSourceMutation,
	useUpdateReservationMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { Protected } from '@/components/layouts/protected/protected';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, id }) => {
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
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
	const { data: buildings } = useGetBuildingsQuery(undefined, { skip: !token });
	const { data: paymentSources } = useGetPaymentSourcesQuery(undefined, { skip: !token });

	const [createReservation, { isLoading: isCreateLoading, error: createError }] = useCreateReservationMutation();
	const [updateReservation, { isLoading: isUpdateLoading, error: updateError }] = useUpdateReservationMutation();
	const [addApartment] = useAddApartmentMutation();
	const [addPaymentSource] = useAddPaymentSourceMutation();
	const [updateApartment] = useUpdateApartmentMutation();
	const [deleteApartment] = useDeleteApartmentMutation();
	const [updatePaymentSource] = useUpdatePaymentSourceMutation();
	const [deletePaymentSource] = useDeletePaymentSourceMutation();

	// Apartment edit/delete state
	const [editAptId, setEditAptId] = useState<number | null>(null);
	const [editAptName, setEditAptName] = useState('');
	const [editAptBuilding, setEditAptBuilding] = useState<number | ''>('');
	const [editAptError, setEditAptError] = useState<string | null>(null);
	const [deleteAptId, setDeleteAptId] = useState<number | null>(null);
	const [deleteAptName, setDeleteAptName] = useState('');
	const [aptActionLoading, setAptActionLoading] = useState(false);

	const error = isEditMode ? updateError : createError;
	const axiosError: ResponseDataInterface<ApiErrorResponseType> | undefined = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const [isPending, setIsPending] = useState(false);
	const [openApartmentModal, setOpenApartmentModal] = useState(false);

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
					onSuccess(t.reservations.reservationUpdatedSuccess);
					router.push(RESERVATIONS_VIEW(id!));
				} else {
					await createReservation(fields).unwrap();
					onSuccess(t.reservations.reservationAddedSuccess);
					router.push(RESERVATIONS_LIST);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.reservations.reservationUpdateError : t.reservations.reservationAddError);
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

	const handleEditAptOpen = (aptId: number, aptName: string) => {
		setEditAptId(aptId);
		setEditAptName(aptName);
		const apt = apartments?.find((a) => a.id === aptId);
		setEditAptBuilding(apt?.building ?? '');
		setEditAptError(null);
	};

	const handleEditAptSubmit = async () => {
		if (!editAptId || !editAptName.trim()) return;
		setAptActionLoading(true);
		try {
			await updateApartment({
				id: editAptId,
				data: { nom: editAptName.trim(), building: editAptBuilding === '' ? null : editAptBuilding },
			}).unwrap();
			onSuccess(t.reservations.apartmentEditedSuccess);
			setEditAptId(null);
		} catch (e) {
			setEditAptError(extractApiErrorMessage(e, t.reservations.apartmentEditError));
		} finally {
			setAptActionLoading(false);
		}
	};

	const handleDeleteAptOpen = (aptId: number, aptName: string) => {
		setDeleteAptId(aptId);
		setDeleteAptName(aptName);
	};

	const handleDeleteAptConfirm = async () => {
		if (!deleteAptId) return;
		setAptActionLoading(true);
		try {
			await deleteApartment({ id: deleteAptId }).unwrap();
			onSuccess(t.reservations.apartmentDeletedSuccess);
			if (formik.values.apartment === deleteAptId) {
				await formik.setFieldValue('apartment', '');
			}
			setDeleteAptId(null);
		} catch (e) {
			onError(extractApiErrorMessage(e, t.reservations.apartmentDeleteError));
			setDeleteAptId(null);
		} finally {
			setAptActionLoading(false);
		}
	};

	const paymentSourceItems: DropDownType[] = useMemo(
		() => (paymentSources ?? []).map((source) => ({ code: source.nom, value: String(source.id) })),
		[paymentSources],
	);

	const selectedPaymentSource = useMemo<DropDownType | null>(() => {
		const v = formik.values.payment_source;
		if (!v) return null;
		return paymentSourceItems.find((p) => p.code === v) ?? null;
	}, [formik.values.payment_source, paymentSourceItems]);

	const buildingItems: DropDownType[] = useMemo(
		() => [
			{ code: 'none', value: t.common.none },
			...(buildings ?? []).map((building) => ({ code: String(building.id), value: building.nom })),
		],
		[buildings, t.common.none],
	);

	const selectedBuildingValue = useMemo(() => {
		if (editAptBuilding === '') return t.common.none;
		return buildings?.find((building) => building.id === editAptBuilding)?.nom ?? t.common.none;
	}, [buildings, editAptBuilding, t.common.none]);

	const validationEntries = useMemo(
		() => Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][],
		[formik.errors],
	);

	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	useEffect(() => {
		if (formik.submitCount > 0 && hasValidationErrors) {
			onError(t.reservations.fixValidationErrors);
			topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, [formik.submitCount, hasValidationErrors, onError, t.reservations.fixValidationErrors]);

	const isLoading =
		isCreateLoading || isUpdateLoading || isPending || (isEditMode && isDataLoading) || isApartmentsLoading;
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				{/* Header */}
				<Stack
					direction={isMobile ? 'column' : 'row'}
					spacing={2}
					sx={{
						justifyContent: 'space-between',
					}}
				>
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
						{t.reservations.reservationsList}
					</Button>
				</Stack>

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

				{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}

				{isLoading ? (
					<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
				) : shouldShowError ? (
					<ApiAlert errorDetails={axiosError?.data as Record<string, unknown>} />
				) : (
					<form onSubmit={formik.handleSubmit}>
						<Stack spacing={3}>
							{/* Détails de la réservation */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<HotelIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reservations.reservationDetailsSection}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
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
												<Stack
													direction="row"
													spacing={0.5}
													sx={{
														alignItems: 'center',
														ml: 1,
													}}
												>
													{selectedApartment && (
														<>
															<IconButton
																size="small"
																onClick={() =>
																	handleEditAptOpen(Number(selectedApartment.value), selectedApartment.code)
																}
																title={t.common.rename}
															>
																<EditIcon fontSize="small" />
															</IconButton>
															<IconButton
																size="small"
																onClick={() =>
																	handleDeleteAptOpen(Number(selectedApartment.value), selectedApartment.code)
																}
																title={t.common.delete}
																color="error"
															>
																<DeleteIcon fontSize="small" />
															</IconButton>
														</>
													)}
													<Button size="small" variant="outlined" onClick={() => setOpenApartmentModal(true)}>
														{t.common.add}
													</Button>
												</Stack>
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
								</CardContent>
							</Card>

							{/* Dates du séjour */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<CalendarMonthIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reservations.stayDates}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
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
									</Stack>
								</CardContent>
							</Card>

							{/* Paiement */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<CreditCardIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.common.payment}
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
													formik.setFieldValue('payment_source', newVal ? newVal.code : '');
												}}
												onBlur={formik.handleBlur('payment_source')}
												error={formik.submitCount > 0 && Boolean(formik.errors.payment_source)}
												helperText={formik.submitCount > 0 ? (formik.errors.payment_source ?? '') : ''}
												disabled={isLoading}
												startIcon={<CreditCardIcon fontSize="small" />}
												endIcon={
													<EntityCrudControls
														label={t.reservations.paymentSource.toLowerCase()}
														icon={<CreditCardIcon fontSize="small" />}
														inputTheme={inputTheme}
														selectedItem={selectedPaymentSource}
														addEntity={(args) => addPaymentSource(args)}
														editEntity={({ id: entityId, data }) => updatePaymentSource({ id: entityId, data })}
														deleteEntity={({ id: entityId }) => deletePaymentSource({ id: entityId })}
														onAddSuccess={(newId) => {
															const createdSource = paymentSources?.find((item) => item.id === newId);
															formik.setFieldValue('payment_source', createdSource?.nom ?? '');
														}}
														onDeleteSuccess={() => {
															formik.setFieldValue('payment_source', '');
														}}
													/>
												}
											/>
										</Stack>
									</Stack>
								</CardContent>
							</Card>

							{/* Notes */}
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack
										direction="row"
										spacing={2}
										sx={{
											alignItems: 'center',
											mb: 2,
										}}
									>
										<NotesIcon color="primary" />
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
											}}
										>
											{t.reservations.notes}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
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
									</Stack>
								</CardContent>
							</Card>

							{/* Submit */}
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
								<PrimaryLoadingButton
									buttonText={isEditMode ? t.common.update : t.reservations.addReservation}
									loading={isPending}
									active={!isPending}
									type="submit"
									startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
									onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (showValidationAlert) {
											e.preventDefault();
											onError(t.reservations.fixValidationErrors);
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
				label={t.reservations.apartment}
				icon={<HotelIcon fontSize="small" />}
				inputTheme={inputTheme}
				mutationFn={(args) => addApartment(args)}
				onSuccess={(newId) => {
					formik.setFieldValue('apartment', newId);
				}}
				buildings={buildings}
			/>
			{/* Edit apartment dialog */}
			<Dialog open={editAptId !== null} onClose={() => setEditAptId(null)}>
				<DialogTitle>{t.reservations.editApartment}</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>
						<CustomTextInput
							autoFocus
							id="edit_apartment_name"
							type="text"
							label={t.reservations.newApartmentName}
							fullWidth
							size="small"
							value={editAptName}
							onChange={(e) => {
								setEditAptName(e.target.value);
								if (editAptError) setEditAptError(null);
							}}
							error={Boolean(editAptError)}
							helperText={editAptError ?? ''}
							theme={inputTheme}
						/>
					</Box>
					{buildings && buildings.length > 0 && (
						<Box sx={{ mt: 2 }}>
							<CustomDropDownSelect
								id="edit_apartment_building"
								size="small"
								label={t.reservations.residence}
								items={buildingItems}
								value={selectedBuildingValue}
								onChange={(e) => {
									const nextValue = e.target.value;
									if (!nextValue || nextValue === t.common.none) {
										setEditAptBuilding('');
										return;
									}

									const building = buildings.find((item) => item.nom === nextValue);
									setEditAptBuilding(building ? building.id : '');
								}}
								theme={dropdownTheme}
							/>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditAptId(null)}>{t.common.cancel}</Button>
					<Button onClick={handleEditAptSubmit} variant="contained" disabled={aptActionLoading || !editAptName.trim()}>
						{t.settings.save}
					</Button>
				</DialogActions>
			</Dialog>
			{/* Delete apartment confirmation dialog */}
			{deleteAptId !== null && (
				<ActionModals
					title={t.reservations.deleteApartment}
					body={t.reservations.deleteApartmentConfirm(deleteAptName)}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setDeleteAptId(null),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							text: t.common.delete,
							active: true,
							onClick: handleDeleteAptConfirm,
							icon: <DeleteIcon />,
							color: '#D32F2F',
							disabled: aptActionLoading,
						},
					]}
					onClose={() => setDeleteAptId(null)}
				/>
			)}
		</LocalizationProvider>
	);
};

const ReservationFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.reservations.editReservation : t.reservations.newReservation;

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '48px',
			}}
		>
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<FormikContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ReservationFormClient;
