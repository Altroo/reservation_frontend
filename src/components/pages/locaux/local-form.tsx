'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	FormControlLabel,
	InputAdornment,
	Stack,
	Switch,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	CalendarMonth as CalendarMonthIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
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
import type { LocalFormValues } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { localSchema } from '@/utils/formValidationSchemas';
import { typeLocalItemsList, LOCAL_FIELD_LABELS } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { LOCAUX_LIST } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import { useCreateLocalMutation, useUpdateLocalMutation, useGetLocalQuery } from '@/store/services/reservation';
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

	const { data: rawData } = useGetLocalQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const [createLocal, { isLoading: isCreateLoading }] = useCreateLocalMutation();
	const [updateLocal, { isLoading: isUpdateLoading }] = useUpdateLocalMutation();
	const [isPending, setIsPending] = useState(false);

	const typeItems: DropDownType[] = typeLocalItemsList.map((t) => ({
		code: t.code,
		value: t.value,
	}));

	const formik = useFormik<LocalFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
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
			try {
				if (isEditMode) {
					await updateLocal({ id: id!, data: fields }).unwrap();
					onSuccess('Local mis à jour avec succès.');
				} else {
					await createLocal(fields).unwrap();
					onSuccess('Local ajouté avec succès.');
				}
				router.push(LOCAUX_LIST);
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

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
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
			</Stack>
		</LocalizationProvider>
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
