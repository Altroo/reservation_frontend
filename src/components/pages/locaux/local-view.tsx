'use client';

import React, { isValidElement, useMemo, useState } from 'react';
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
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	CalendarMonth as CalendarMonthIcon,
	CalendarToday as CalendarTodayIcon,
	Check as CheckIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Paid as PaidIcon,
	Person as PersonIcon,
	SquareFoot as SquareFootIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps, ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { LoyerListType, LoyerFormValues } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { textInputTheme } from '@/utils/themes';
import { extractApiErrorMessage, formatDate, setFormikAutoErrors } from '@/utils/helpers';
import { LOCAUX_EDIT, LOCAUX_LIST } from '@/utils/routes';
import { loyerSchema } from '@/utils/formValidationSchemas';
import { TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useToast } from '@/utils/hooks';
import {
	useGetLocalQuery,
	useDeleteLocalMutation,
	useGetLoyersListQuery,
	useGetLocalYearsQuery,
	useCreateLoyerMutation,
	useUpdateLoyerMutation,
	useDeleteLoyerMutation,
	useToggleLoyerPaidMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ChipColor } from '@/utils/rawData';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0)
			? value
			: '-';

	return (
		<Stack direction="row" alignItems="flex-start" spacing={2} sx={{ py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{ flex: 1, flexWrap: 'wrap' }}
			>
				<Typography fontWeight={600} color="text.secondary" sx={{ minWidth: { xs: '100%', sm: 200 }, wordBreak: 'break-word' }}>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? displayValue : <Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>}
				</Box>
			</Stack>
		</Stack>
	);
};

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface Props extends SessionProps {
	id: number;
}

const LocalViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { onSuccess, onError } = useToast();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: local, isLoading, error } = useGetLocalQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const [deleteLocal] = useDeleteLocalMutation();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	// Loyer management
	const currentYear = new Date().getFullYear();
	const [loyerYear, setLoyerYear] = useState(currentYear);
	const { data: yearsData } = useGetLocalYearsQuery(undefined, { skip: !token });
	const loyerYearOptions = useMemo(() => {
		const yrs = yearsData?.years ?? [];
		if (!yrs.includes(currentYear)) return [...yrs, currentYear].sort((a, b) => b - a);
		return [...yrs].sort((a, b) => b - a);
	}, [yearsData, currentYear]);
	const { data: loyersRaw } = useGetLoyersListQuery({ local: id, annee: loyerYear }, { skip: !token });
	const loyers = useMemo(() => (Array.isArray(loyersRaw) ? loyersRaw : []) as LoyerListType[], [loyersRaw]);

	const [toggleLoyerPaid] = useToggleLoyerPaidMutation();
	const [deleteLoyer] = useDeleteLoyerMutation();
	const [showLoyerDialog, setShowLoyerDialog] = useState(false);
	const [editingLoyer, setEditingLoyer] = useState<LoyerListType | null>(null);
	const [showDeleteLoyerModal, setShowDeleteLoyerModal] = useState(false);
	const [selectedLoyerId, setSelectedLoyerId] = useState<number | null>(null);

	const handleDelete = async () => {
		try {
			await deleteLocal({ id }).unwrap();
			onSuccess('Local supprimé avec succès');
			router.push(LOCAUX_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression du local'));
		} finally {
			setShowDeleteModal(false);
		}
	};

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
			await deleteLoyer({ id: selectedLoyerId }).unwrap();
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

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const deleteLoyerModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteLoyerModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDeleteLoyer, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const typeColor = (TYPE_LOCAL_CHIP_COLORS[local?.type_local as string] ?? 'default') as ChipColor;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
				<NavigationBar title="Détails du local">
					<Protected permission="can_view">
						<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
							<Stack
								direction={isMobile ? 'column' : 'row'}
								justifyContent="space-between"
								alignItems={isMobile ? 'stretch' : 'center'}
								spacing={2}
							>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(LOCAUX_LIST)} sx={{ width: isMobile ? '100%' : 'auto' }}>
									Liste des locaux
								</Button>
								{!isLoading && !error && local && (
									<Stack direction="row" gap={1} flexWrap="wrap">
										<Protected permission="can_edit">
											<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(LOCAUX_EDIT(id))}>
												Modifier
											</Button>
										</Protected>
										<Protected permission="can_delete">
											<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
												Supprimer
											</Button>
										</Protected>
									</Stack>
								)}
							</Stack>

							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert
									errorDetails={axiosError?.data.details}
									cssStyle={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
								/>
							) : !local ? (
								<Alert severity="warning">Local introuvable</Alert>
							) : (
								<Stack spacing={3}>
									{/* Identification */}
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={3} alignItems="center">
												<BusinessIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>
													{local.nom}
												</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Stack spacing={0}>
												<InfoRow
													icon={<BusinessIcon />}
													label="Type"
													value={<Chip label={local.type_local as string} size="small" color={typeColor} variant="outlined" />}
												/>
												<Divider />
												<InfoRow icon={<LocationOnIcon />} label="Adresse" value={local.adresse} />
												<Divider />
												<InfoRow icon={<SquareFootIcon />} label="Superficie" value={local.superficie ? `${local.superficie} m²` : null} />
											</Stack>
										</CardContent>
									</Card>

									{/* Financier */}
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<AttachMoneyIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>Financier</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Stack spacing={0}>
												<InfoRow
													icon={<AttachMoneyIcon />}
													label="Prix d'achat"
													value={<Typography fontWeight={600} color="primary">{Number(local.prix_achat).toLocaleString('fr-MA')} MAD</Typography>}
												/>
												<Divider />
												<InfoRow
													icon={<PaidIcon />}
													label="Loyer mensuel"
													value={<Typography fontWeight={600} color="primary">{Number(local.prix_location_mensuel).toLocaleString('fr-MA')} MAD</Typography>}
												/>
												<Divider />
												<InfoRow
													icon={<TrendingUpIcon />}
													label="Rentabilité"
													value={<Typography fontWeight={600} color="success.main">{local.rentabilite}%</Typography>}
												/>
											</Stack>
										</CardContent>
									</Card>

									{/* Location */}
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<PersonIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>Location</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Stack spacing={0}>
												<InfoRow
													icon={<CheckIcon />}
													label="Statut"
													value={<Chip label={local.en_location ? 'En location' : 'Libre'} size="small" color={local.en_location ? 'success' : 'default'} variant="outlined" />}
												/>
												{local.en_location && (
													<>
														<Divider />
														<InfoRow icon={<PersonIcon />} label="Locataire" value={local.locataire_nom} />
														<Divider />
														<InfoRow icon={<CalendarTodayIcon />} label="Début de location" value={formatDate(local.date_debut_location ?? null)} />
													</>
												)}
											</Stack>
										</CardContent>
									</Card>

									{/* Notes */}
									{local.notes && (
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<NotesIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>Notes</Typography>
												</Stack>
												<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
												<InfoRow icon={<NotesIcon />} label="Notes" value={local.notes} />
											</CardContent>
										</Card>
									)}

									{/* Metadata */}
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<CalendarMonthIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>Métadonnées</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Stack spacing={0}>
												<InfoRow icon={<PersonIcon />} label="Créé par" value={local.created_by_user_name ?? '—'} />
												<Divider />
												<InfoRow icon={<CalendarTodayIcon />} label="Date de création" value={formatDate(local.date_created)} />
												<Divider />
												<InfoRow icon={<CalendarTodayIcon />} label="Dernière modification" value={formatDate(local.date_updated)} />
											</Stack>
										</CardContent>
									</Card>

									{/* Loyers */}
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems={isMobile ? 'stretch' : 'center'} justifyContent="space-between" sx={{ mb: 2 }}>
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
													<Protected permission="can_create">
														<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddLoyer}>
															Ajouter
														</Button>
													</Protected>
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
																				<Protected permission="can_edit">
																					<IconButton size="small" onClick={() => openEditLoyer(loyer)}>
																						<EditIcon fontSize="small" />
																					</IconButton>
																				</Protected>
																				<Protected permission="can_delete">
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
																				</Protected>
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
								</Stack>
							)}
						</Stack>
					</Protected>
				</NavigationBar>

				{showDeleteModal && (
					<ActionModals
						title="Supprimer ce local ?"
						body="Êtes-vous sûr de vouloir supprimer ce local ? Cette action est irréversible."
						actions={deleteModalActions}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
					/>
				)}

				{showDeleteLoyerModal && (
					<ActionModals
						title="Supprimer ce loyer ?"
						body="Êtes-vous sûr de vouloir supprimer ce loyer ? Cette action est irréversible."
						actions={deleteLoyerModalActions}
						titleIcon={<DeleteIcon />}
						titleIconColor="#D32F2F"
					/>
				)}

				{showLoyerDialog && (
					<LoyerDialog
						localId={id}
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

const inputTheme = textInputTheme();

const LoyerDialog: React.FC<LoyerDialogProps> = ({ localId, year, loyer, onClose }) => {
	const isEdit = loyer !== null;
	const { onSuccess, onError } = useToast();
	const [createLoyer, { isLoading: isCreateLoading }] = useCreateLoyerMutation();
	const [updateLoyer, { isLoading: isUpdateLoading }] = useUpdateLoyerMutation();
	const isPending = isCreateLoading || isUpdateLoading;

	const formik = useFormik<LoyerFormValues>({
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
			<form onSubmit={formik.handleSubmit}>
				<DialogTitle>{isEdit ? 'Modifier le loyer' : 'Ajouter un loyer'}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<CustomTextInput
							theme={inputTheme}
							id="mois"
							type="number"
							size="small"
							label="Mois *"
							value={String(formik.values.mois)}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => formik.setFieldValue('mois', e.target.value ? Number(e.target.value) : '')}
							onBlur={formik.handleBlur('mois')}
							error={formik.submitCount > 0 && Boolean(formik.errors.mois)}
							helperText={formik.submitCount > 0 ? (formik.errors.mois ?? '') : ''}
							fullWidth
							startIcon={<CalendarMonthIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { min: 1, max: 12 } } }}
						/>
						<CustomTextInput
							theme={inputTheme}
							id="annee"
							type="number"
							size="small"
							label="Année *"
							value={String(formik.values.annee)}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => formik.setFieldValue('annee', e.target.value ? Number(e.target.value) : '')}
							onBlur={formik.handleBlur('annee')}
							error={formik.submitCount > 0 && Boolean(formik.errors.annee)}
							helperText={formik.submitCount > 0 ? (formik.errors.annee ?? '') : ''}
							fullWidth
							startIcon={<CalendarMonthIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { min: 2000, max: 2100 } } }}
						/>
						<CustomTextInput
							theme={inputTheme}
							id="montant"
							type="text"
							size="small"
							label="Montant (MAD) *"
							value={formik.values.montant}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
									formik.setFieldValue('montant', e.target.value);
							}}
							onBlur={formik.handleBlur('montant')}
							error={formik.submitCount > 0 && Boolean(formik.errors.montant)}
							helperText={formik.submitCount > 0 ? (formik.errors.montant ?? '') : ''}
							fullWidth
							startIcon={<AttachMoneyIcon fontSize="small" />}
							slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={formik.values.paye}
									onChange={(e) => formik.setFieldValue('paye', e.target.checked)}
									color="primary"
								/>
							}
							label="Payé"
						/>
						{formik.values.paye && (
							<DatePicker
								label="Date de paiement"
								value={formik.values.date_paiement ? parseISO(formik.values.date_paiement) : null}
								onChange={(date) => formik.setFieldValue('date_paiement', date ? format(date, 'yyyy-MM-dd') : '')}
								slotProps={{
									textField: {
										size: 'small',
										fullWidth: true,
										onBlur: formik.handleBlur('date_paiement'),
										error: formik.submitCount > 0 && Boolean(formik.errors.date_paiement),
										helperText: formik.submitCount > 0 ? (formik.errors.date_paiement ?? '') : '',
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
							theme={inputTheme}
							id="notes"
							type="text"
							size="small"
							label="Notes"
							value={formik.values.notes}
							onChange={formik.handleChange('notes')}
							onBlur={formik.handleBlur('notes')}
							fullWidth
							multiline
							rows={3}
							startIcon={<NotesIcon fontSize="small" />}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Annuler</Button>
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

export default LocalViewClient;
