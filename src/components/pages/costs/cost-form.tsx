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
	InputAdornment,
	Stack,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarMonth as CalendarMonthIcon,
	Category as CategoryIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
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
import type { CostFormValues } from '@/types/reservationTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { costSchema } from '@/utils/formValidationSchemas';
import { costCategoryItemsList, COST_FIELD_LABELS } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { COSTS_LIST } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import { useCreateCostMutation, useUpdateCostMutation, useGetCostsQuery } from '@/store/services/reservation';
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

	const { data: costs } = useGetCostsQuery(
		{},
		{ skip: !token || !isEditMode },
	);
	const rawData = isEditMode ? (costs ?? []).find((c) => c.id === id) : undefined;

	const [createCost, { isLoading: isCreateLoading }] = useCreateCostMutation();
	const [updateCost, { isLoading: isUpdateLoading }] = useUpdateCostMutation();
	const [isPending, setIsPending] = useState(false);

	const categoryItems: DropDownType[] = costCategoryItemsList.map((c) => ({
		code: c.code,
		value: c.value,
	}));

	const formik = useFormik<CostFormValues>({
		initialValues: {
			description: rawData?.description ?? '',
			amount: rawData?.amount ?? '',
			date: rawData?.date ?? '',
			category: rawData?.category ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(costSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateCost({ id: id!, data: fields }).unwrap();
					onSuccess('Coût mis à jour avec succès.');
				} else {
					await createCost({ data: fields }).unwrap();
					onSuccess('Coût ajouté avec succès.');
				}
				router.push(COSTS_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? 'Échec de la mise à jour du coût.' : "Échec de l'ajout du coût.");
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedCategory = categoryItems.find((c) => c.value === formik.values.category) ?? null;

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
						onClick={() => router.push(COSTS_LIST)}
						sx={{ whiteSpace: 'nowrap' }}
					>
						Liste des coûts
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
										<strong>{getLabelForKey(COST_FIELD_LABELS, key)}</strong> : {err}
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
									<NotesIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										Détails du coût
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										theme={inputTheme}
										id="description"
										type="text"
										size="small"
										label="Description *"
										value={formik.values.description}
										onChange={formik.handleChange('description')}
										onBlur={formik.handleBlur('description')}
										error={formik.submitCount > 0 && Boolean(formik.errors.description)}
										helperText={formik.submitCount > 0 ? (formik.errors.description ?? '') : ''}
										fullWidth
										startIcon={<NotesIcon fontSize="small" />}
									/>
									<Stack direction="row" spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="amount"
											type="text"
											size="small"
											label="Montant (MAD) *"
											value={formik.values.amount}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													formik.setFieldValue('amount', e.target.value);
											}}
											onBlur={formik.handleBlur('amount')}
											error={formik.submitCount > 0 && Boolean(formik.errors.amount)}
											helperText={formik.submitCount > 0 ? (formik.errors.amount ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
										<DatePicker
											label="Date *"
											value={formik.values.date ? parseISO(formik.values.date) : null}
											onChange={(date) =>
												formik.setFieldValue('date', date ? format(date, 'yyyy-MM-dd') : '')
											}
											disabled={isLoading}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date'),
													error: formik.submitCount > 0 && Boolean(formik.errors.date),
													helperText: formik.submitCount > 0 ? (formik.errors.date ?? '') : '',
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
									<CustomAutoCompleteSelect
										id="category"
										size="small"
										noOptionsText="Aucune catégorie trouvée"
										label="Catégorie *"
										items={categoryItems}
										theme={inputTheme}
										value={selectedCategory}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('category', newVal ? newVal.value : '');
										}}
										onBlur={formik.handleBlur('category')}
										error={formik.submitCount > 0 && Boolean(formik.errors.category)}
										helperText={formik.submitCount > 0 ? ((formik.errors.category as string) ?? '') : ''}
										startIcon={<CategoryIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter le coût'}
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

const CostFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const title = id !== undefined ? 'Modifier le coût' : 'Nouveau coût';

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

export default CostFormClient;
