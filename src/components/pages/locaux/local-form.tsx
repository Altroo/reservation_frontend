'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	CalendarMonth as CalendarMonthIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Paid as PaidIcon,
	Person as PersonIcon,
	SquareFoot as SquareFootIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import type { SessionProps } from '@/types/_initTypes';
import type { LocalFormValues, LoyerListType, LoyerFormValues } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { textInputTheme } from '@/utils/themes';
import { localSchema, loyerSchema } from '@/utils/formValidationSchemas';
import { typeLocalItemsList, LOCAL_FIELD_LABELS } from '@/utils/rawData';
import { extractApiErrorMessage, formatDate, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { LOCAUX_LIST, LOCAUX_EDIT } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import {
	useCreateLocalMutation,
	useUpdateLocalMutation,
	useGetLocalQuery,
	useGetLoyersListQuery,
	useGetLocalYearsQuery,
	useCreateLoyerMutation,
	useUpdateLoyerMutation,
	useDeleteLoyerMutation,
	useToggleLoyerPaidMutation,
	useGetBuildingsQuery,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { DropDownType } from '@/types/accountTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, id }) => {
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const router = useRouter();
	const topRef = useRef<HTMLDivElement | null>(null);
	const loyerSectionRef = useRef<HTMLDivElement | null>(null);

	const { data: rawData } = useGetLocalQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const [createLocal, { isLoading: isCreateLoading }] = useCreateLocalMutation();
	const [updateLocal, { isLoading: isUpdateLoading }] = useUpdateLocalMutation();
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });
	const [isPending, setIsPending] = useState(false);

	// Loyer management (edit mode only)
	const currentYear = new Date().getFullYear();
	const [loyerYear, setLoyerYear] = useState(currentYear);
	const { data: yearsData } = useGetLocalYearsQuery(undefined, { skip: !token || !isEditMode });
	const loyerYearOptions = useMemo(() => {
		const yrs = yearsData?.years ?? [];
		if (!yrs.includes(currentYear)) return [...yrs, currentYear].sort((a, b) => b - a);
		return [...yrs].sort((a, b) => b - a);
	}, [yearsData, currentYear]);
	const { data: loyersRaw } = useGetLoyersListQuery(
		{ local: id!, annee: loyerYear },
		{ skip: !token || !isEditMode },
	);
	const loyers = useMemo(() => (Array.isArray(loyersRaw) ? loyersRaw : []) as LoyerListType[], [loyersRaw]);

	const [toggleLoyerPaid] = useToggleLoyerPaidMutation();
	const [deleteLoyerMut] = useDeleteLoyerMutation();
	const [showLoyerDialog, setShowLoyerDialog] = useState(false);
	const [editingLoyer, setEditingLoyer] = useState<LoyerListType | null>(null);
	const [showDeleteLoyerModal, setShowDeleteLoyerModal] = useState(false);
	const [selectedLoyerId, setSelectedLoyerId] = useState<number | null>(null);

	const typeItems: DropDownType[] = typeLocalItemsList.map((t) => ({
		code: t.code,
		value: t.value,
	}));

	const formik = useFormik<LocalFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
			building: rawData?.building ?? '',
			type_local: (rawData?.type_local ?? '') as LocalFormValues['type_local'],
			adresse: rawData?.adresse ?? '',
			superficie: rawData?.superficie ?? '',
			prix_achat: rawData?.prix_achat ?? '',
			prix_location_mensuel: rawData?.prix_location_mensuel ?? '',
			en_location: rawData?.en_location ?? false,
			locataire_nom: rawData?.locataire_nom ?? '',
			date_debut_location: rawData?.date_debut_location ?? '',
			notes: rawData?.notes ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(localSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			const payload = { ...fields, building: fields.building === '' ? null : fields.building };
			try {
				if (isEditMode) {
					await updateLocal({ id: id!, data: payload as typeof fields }).unwrap();
					onSuccess('Local mis à jour avec succès.');
					router.push(LOCAUX_LIST);
				} else {
					const result = await createLocal(payload as typeof fields).unwrap() as { id: number };
					onSuccess('Local ajouté avec succès.');
					router.push(LOCAUX_EDIT(result.id));
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? 'Échec de la mise à jour du local.' : "Échec de l'ajout du local.");
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedType = typeItems.find((t) => t.value === formik.values.type_local) ?? null;

	const validationEntries = Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][];
	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	// Loyer handlers
	const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

	const handleTogglePaid = async (loyer: LoyerListType) => {
		try {
			await toggleLoyerPaid({ id: loyer.id, paye: !loyer.paye }).unwrap();
			onSuccess(loyer.paye ? 'Loyer marqué comme impayé' : 'Loyer marqué comme payé');
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la mise à jour'));
		}
	};

	const handleDeleteLoyer = async () => {
		if (!selectedLoyerId) return;
		try {
			await deleteLoyerMut({ id: selectedLoyerId }).unwrap();
			onSuccess('Loyer supprimé avec succès');
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression'));
		} finally {
			setShowDeleteLoyerModal(false);
			setSelectedLoyerId(null);
		}
	};

	const openAddLoyer = () => {
		setEditingLoyer(null);
		setShowLoyerDialog(true);
	};

	const openEditLoyer = (loyer: LoyerListType) => {
		setEditingLoyer(loyer);
		setShowLoyerDialog(true);
	};

	const deleteLoyerModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteLoyerModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDeleteLoyer, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	useEffect(() => {
		if (formik.submitCount > 0 && hasValidationErrors) {
			onError('Veuillez corriger les erreurs de validation avant de soumettre.');
			topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, [formik.submitCount, hasValidationErrors, onError]);

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack direction="row" justifyContent="space-between">
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(LOCAUX_LIST)}
						sx={{ whiteSpace: 'nowrap' }}
					>
						Liste des locaux
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
									<Typography variant="body2">
										<strong>{getLabelForKey(LOCAL_FIELD_LABELS, key)}</strong> : {err}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}

				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<BusinessIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Informations du local
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="nom"
											type="text"
											size="small"
											label="Nom *"
											value={formik.values.nom}
											onChange={formik.handleChange('nom')}
											onBlur={formik.handleBlur('nom')}
											error={formik.submitCount > 0 && Boolean(formik.errors.nom)}
											helperText={formik.submitCount > 0 ? (formik.errors.nom ?? '') : ''}
											fullWidth
											startIcon={<BusinessIcon fontSize="small" />}
										/>
										<CustomAutoCompleteSelect
											id="type_local"
											size="small"
											noOptionsText="Aucun type trouvé"
											label="Type *"
											items={typeItems}
											theme={inputTheme}
											value={selectedType}
											fullWidth
											onChange={(_, newVal) => {
												formik.setFieldValue('type_local', newVal ? newVal.value : '');
											}}
											onBlur={formik.handleBlur('type_local')}
											error={formik.submitCount > 0 && Boolean(formik.errors.type_local)}
											helperText={formik.submitCount > 0 ? ((formik.errors.type_local as string) ?? '') : ''}
											startIcon={<BusinessIcon fontSize="small" />}
										/>
									</Stack>
									{buildingsData && buildingsData.length > 0 && (
										<FormControl fullWidth size="small">
											<InputLabel>Résidence</InputLabel>
											<Select
												value={formik.values.building}
												label="Résidence"
												onChange={(e) => formik.setFieldValue('building', e.target.value)}
											>
												<MenuItem value="">
													<em>Aucune</em>
												</MenuItem>
												{buildingsData.map((b) => (
													<MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
												))}
											</Select>
										</FormControl>
									)}
									<CustomTextInput
										theme={inputTheme}
										id="adresse"
										type="text"
										size="small"
										label="Adresse"
										value={formik.values.adresse}
										onChange={formik.handleChange('adresse')}
										onBlur={formik.handleBlur('adresse')}
										error={formik.submitCount > 0 && Boolean(formik.errors.adresse)}
										helperText={formik.submitCount > 0 ? (formik.errors.adresse ?? '') : ''}
										fullWidth
										startIcon={<LocationOnIcon fontSize="small" />}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="superficie"
										type="text"
										size="small"
										label="Superficie (m²)"
										value={formik.values.superficie}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
												formik.setFieldValue('superficie', e.target.value);
										}}
										onBlur={formik.handleBlur('superficie')}
										error={formik.submitCount > 0 && Boolean(formik.errors.superficie)}
										helperText={formik.submitCount > 0 ? (formik.errors.superficie ?? '') : ''}
										fullWidth
										startIcon={<SquareFootIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AttachMoneyIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Financier
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="prix_achat"
											type="text"
											size="small"
											label="Prix d'achat (MAD) *"
											value={formik.values.prix_achat}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													formik.setFieldValue('prix_achat', e.target.value);
											}}
											onBlur={formik.handleBlur('prix_achat')}
											error={formik.submitCount > 0 && Boolean(formik.errors.prix_achat)}
											helperText={formik.submitCount > 0 ? (formik.errors.prix_achat ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
										<CustomTextInput
											theme={inputTheme}
											id="prix_location_mensuel"
											type="text"
											size="small"
											label="Loyer mensuel (MAD) *"
											value={formik.values.prix_location_mensuel}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													formik.setFieldValue('prix_location_mensuel', e.target.value);
											}}
											onBlur={formik.handleBlur('prix_location_mensuel')}
											error={formik.submitCount > 0 && Boolean(formik.errors.prix_location_mensuel)}
											helperText={formik.submitCount > 0 ? (formik.errors.prix_location_mensuel ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
									</Stack>
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Location
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<FormControlLabel
										control={
											<Switch
												checked={formik.values.en_location}
												onChange={(e) => formik.setFieldValue('en_location', e.target.checked)}
												color="primary"
											/>
										}
										label="En location"
									/>
									{formik.values.en_location && (
										<>
											<CustomTextInput
												theme={inputTheme}
												id="locataire_nom"
												type="text"
												size="small"
												label="Nom du locataire"
												value={formik.values.locataire_nom}
												onChange={formik.handleChange('locataire_nom')}
												onBlur={formik.handleBlur('locataire_nom')}
												error={formik.submitCount > 0 && Boolean(formik.errors.locataire_nom)}
												helperText={formik.submitCount > 0 ? (formik.errors.locataire_nom ?? '') : ''}
												fullWidth
												startIcon={<PersonIcon fontSize="small" />}
											/>
											<DatePicker
												label="Début de location"
												value={formik.values.date_debut_location ? parseISO(formik.values.date_debut_location) : null}
												onChange={(date) =>
													formik.setFieldValue('date_debut_location', date ? format(date, 'yyyy-MM-dd') : '')
												}
												disabled={isLoading}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														onBlur: formik.handleBlur('date_debut_location'),
														error: formik.submitCount > 0 && Boolean(formik.errors.date_debut_location),
														helperText: formik.submitCount > 0 ? (formik.errors.date_debut_location ?? '') : '',
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
										</>
									)}
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<NotesIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Notes
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<CustomTextInput
									theme={inputTheme}
									id="notes"
									type="text"
									size="small"
									label="Notes"
									value={formik.values.notes}
									onChange={formik.handleChange('notes')}
									onBlur={formik.handleBlur('notes')}
									error={formik.submitCount > 0 && Boolean(formik.errors.notes)}
									helperText={formik.submitCount > 0 ? (formik.errors.notes ?? '') : ''}
									fullWidth
									multiline
									rows={4}
									startIcon={<NotesIcon fontSize="small" />}
								/>
							</CardContent>
						</Card>

						{/* Loyers (edit mode only) */}
						{isEditMode && (
							<Card ref={loyerSectionRef} elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
										<Stack direction="row" spacing={2} alignItems="center">
											<PaidIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>Loyers</Typography>
										</Stack>
										<Stack direction="row" spacing={1} alignItems="center">
											<FormControl size="small" sx={{ minWidth: 100 }}>
												<InputLabel>Année</InputLabel>
												<Select value={loyerYear} label="Année" onChange={(e) => setLoyerYear(Number(e.target.value))}>
													{loyerYearOptions.map((y) => (
														<MenuItem key={y} value={y}>
															{y}
														</MenuItem>
													))}
												</Select>
											</FormControl>
											<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddLoyer}>
												Ajouter
											</Button>
										</Stack>
									</Stack>
									<Divider sx={{ mb: 2 }} />

									{loyers.length === 0 ? (
										<Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
											Aucun loyer enregistré pour {loyerYear}.
										</Typography>
									) : (
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell>Mois</TableCell>
														<TableCell>Montant</TableCell>
														<TableCell>Statut</TableCell>
														<TableCell>Paiement</TableCell>
														<TableCell align="right">Actions</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{loyers
														.slice()
														.sort((a, b) => a.mois - b.mois)
														.map((loyer) => (
															<TableRow key={loyer.id}>
																<TableCell>{MONTH_NAMES[loyer.mois - 1]}</TableCell>
																<TableCell>{Number(loyer.montant).toLocaleString('fr-MA')} MAD</TableCell>
																<TableCell>
																	<Chip
																		label={loyer.paye ? 'Payé' : 'Impayé'}
																		size="small"
																		color={loyer.paye ? 'success' : 'error'}
																		variant="outlined"
																		onClick={() => handleTogglePaid(loyer)}
																		sx={{ cursor: 'pointer' }}
																	/>
																</TableCell>
																<TableCell>{loyer.date_paiement ? formatDate(loyer.date_paiement) : '—'}</TableCell>
																<TableCell align="right">
																	<Stack direction="row" spacing={0.5} justifyContent="flex-end">
																		<IconButton size="small" onClick={() => openEditLoyer(loyer)}>
																			<EditIcon fontSize="small" />
																		</IconButton>
																		<IconButton
																			size="small"
																			color="error"
																			onClick={() => {
																				setSelectedLoyerId(loyer.id);
																				setShowDeleteLoyerModal(true);
																			}}
																		>
																			<DeleteIcon fontSize="small" />
																		</IconButton>
																	</Stack>
																</TableCell>
															</TableRow>
														))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
								</CardContent>
							</Card>
						)}

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter le local'}
								loading={isPending}
								active={!isPending}
								type="submit"
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								cssClass={Styles.submitButton}
							/>
						</Box>
					</Stack>
				</form>

				{/* Loyer modals (outside form to avoid submit interference) */}
				{isEditMode && showDeleteLoyerModal && (
					<ActionModals
						title="Supprimer ce loyer ?"
						body="Êtes-vous sûr de vouloir supprimer ce loyer ? Cette action est irréversible."
						actions={deleteLoyerModalActions}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
					/>
				)}

				{isEditMode && showLoyerDialog && (
					<LoyerDialog
						localId={id!}
						year={loyerYear}
						loyer={editingLoyer}
						onClose={() => setShowLoyerDialog(false)}
					/>
				)}
			</Stack>
		</LocalizationProvider>
	);
};

interface LoyerDialogProps {
	localId: number;
	year: number;
	loyer: LoyerListType | null;
	onClose: () => void;
}

const loyerInputTheme = textInputTheme();

const LoyerDialog: React.FC<LoyerDialogProps> = ({ localId, year, loyer, onClose }) => {
	const isEdit = loyer !== null;
	const { onSuccess, onError } = useToast();
	const [createLoyer, { isLoading: isCreateLoading }] = useCreateLoyerMutation();
	const [updateLoyer, { isLoading: isUpdateLoading }] = useUpdateLoyerMutation();
	const isPending = isCreateLoading || isUpdateLoading;

	const loyerFormik = useFormik<LoyerFormValues>({
		initialValues: {
			local: localId,
			mois: loyer?.mois ?? '',
			annee: loyer?.annee ?? year,
			montant: loyer?.montant ?? '',
			paye: loyer?.paye ?? false,
			date_paiement: loyer?.date_paiement ?? '',
			notes: loyer?.notes ?? '',
			globalError: '',
		},
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(loyerSchema),
		onSubmit: async (data, { setFieldError }) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEdit) {
					await updateLoyer({ id: loyer.id, data: fields }).unwrap();
					onSuccess('Loyer mis à jour avec succès.');
				} else {
					await createLoyer(fields).unwrap();
					onSuccess('Loyer ajouté avec succès.');
				}
				onClose();
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEdit ? 'Échec de la mise à jour du loyer.' : "Échec de l'ajout du loyer.");
			}
		},
	});

	return (
		<Dialog open onClose={onClose} maxWidth="sm" fullWidth>
			<form onSubmit={loyerFormik.handleSubmit}>
				<DialogTitle>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h6" fontWeight={700}>
							{isEdit ? 'Modifier le loyer' : 'Ajouter un loyer'}
						</Typography>
						<IconButton onClick={onClose} size="small">
							<CloseIcon />
						</IconButton>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<CustomTextInput
							theme={loyerInputTheme}
							id="mois"
							type="number"
							size="small"
							label="Mois *"
							value={String(loyerFormik.values.mois)}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => loyerFormik.setFieldValue('mois', e.target.value ? Number(e.target.value) : '')}
							onBlur={loyerFormik.handleBlur('mois')}
							error={loyerFormik.submitCount > 0 && Boolean(loyerFormik.errors.mois)}
							helperText={loyerFormik.submitCount > 0 ? (loyerFormik.errors.mois ?? '') : ''}
							fullWidth
							startIcon={<CalendarMonthIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { min: 1, max: 12 } } }}
						/>
						<CustomTextInput
							theme={loyerInputTheme}
							id="annee"
							type="number"
							size="small"
							label="Année *"
							value={String(loyerFormik.values.annee)}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => loyerFormik.setFieldValue('annee', e.target.value ? Number(e.target.value) : '')}
							onBlur={loyerFormik.handleBlur('annee')}
							error={loyerFormik.submitCount > 0 && Boolean(loyerFormik.errors.annee)}
							helperText={loyerFormik.submitCount > 0 ? (loyerFormik.errors.annee ?? '') : ''}
							fullWidth
							startIcon={<CalendarMonthIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { min: 2000, max: 2100 } } }}
						/>
						<CustomTextInput
							theme={loyerInputTheme}
							id="montant"
							type="text"
							size="small"
							label="Montant (MAD) *"
							value={loyerFormik.values.montant}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
									loyerFormik.setFieldValue('montant', e.target.value);
							}}
							onBlur={loyerFormik.handleBlur('montant')}
							error={loyerFormik.submitCount > 0 && Boolean(loyerFormik.errors.montant)}
							helperText={loyerFormik.submitCount > 0 ? (loyerFormik.errors.montant ?? '') : ''}
							fullWidth
							startIcon={<AttachMoneyIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={loyerFormik.values.paye}
									onChange={(e) => loyerFormik.setFieldValue('paye', e.target.checked)}
									color="primary"
								/>
							}
							label="Payé"
						/>
						{loyerFormik.values.paye && (
							<DatePicker
								label="Date de paiement"
								value={loyerFormik.values.date_paiement ? parseISO(loyerFormik.values.date_paiement) : null}
								onChange={(date) => loyerFormik.setFieldValue('date_paiement', date ? format(date, 'yyyy-MM-dd') : '')}
								slotProps={{
									textField: {
										size: 'small',
										fullWidth: true,
										onBlur: loyerFormik.handleBlur('date_paiement'),
										error: loyerFormik.submitCount > 0 && Boolean(loyerFormik.errors.date_paiement),
										helperText: loyerFormik.submitCount > 0 ? (loyerFormik.errors.date_paiement ?? '') : '',
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
						)}
						<CustomTextInput
							theme={loyerInputTheme}
							id="notes"
							type="text"
							size="small"
							label="Notes"
							value={loyerFormik.values.notes}
							onChange={loyerFormik.handleChange('notes')}
							onBlur={loyerFormik.handleBlur('notes')}
							fullWidth
							multiline
							rows={3}
							startIcon={<NotesIcon fontSize="small" />}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<PrimaryLoadingButton
						buttonText={isEdit ? 'Mettre à jour' : 'Ajouter'}
						loading={isPending}
						active={!isPending}
						type="submit"
						startIcon={isEdit ? <EditIcon /> : <AddIcon />}
					/>
				</DialogActions>
			</form>
		</Dialog>
	);
};

const LocalFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const title = id !== undefined ? 'Modifier le local' : 'Nouveau local';

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

export default LocalFormClient;
