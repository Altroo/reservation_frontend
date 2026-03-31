'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Card,
	CardContent,
	Divider,
	Stack,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Apartment as ApartmentIcon,
	Edit as EditIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps } from '@/types/_initTypes';
import type { BuildingFormValues } from '@/types/buildingTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { buildingSchema } from '@/utils/formValidationSchemas';
import { BUILDING_FIELD_LABELS } from '@/utils/rawData';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { BUILDINGS_LIST } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import { useCreateBuildingMutation, useUpdateBuildingMutation, useGetBuildingQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import Button from '@mui/material/Button';

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

	const { data: rawData } = useGetBuildingQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const [createBuilding, { isLoading: isCreateLoading }] = useCreateBuildingMutation();
	const [updateBuilding, { isLoading: isUpdateLoading }] = useUpdateBuildingMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<BuildingFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(buildingSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateBuilding({ id: id!, data: fields }).unwrap();
					onSuccess('Résidence mise à jour avec succès.');
				} else {
					await createBuilding(fields).unwrap();
					onSuccess('Résidence ajoutée avec succès.');
				}
				router.push(BUILDINGS_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? 'Échec de la mise à jour de la résidence.' : "Échec de l'ajout de la résidence.");
			} finally {
				setIsPending(false);
			}
		},
	});

	const validationEntries = Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][];
	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	useEffect(() => {
		if (formik.submitCount > 0 && hasValidationErrors) {
			onError('Veuillez corriger les erreurs de validation avant de soumettre.');
			topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, [formik.submitCount, hasValidationErrors, onError]);

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<Stack ref={topRef} spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction="row" justifyContent="space-between">
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(BUILDINGS_LIST)}
					sx={{ whiteSpace: 'nowrap' }}
				>
					Liste des résidences
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
									<strong>{getLabelForKey(BUILDING_FIELD_LABELS, key)}</strong> : {err}
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
								<ApartmentIcon color="primary" />
								<Typography variant="h6" fontWeight={700}>
									Informations de la résidence
								</Typography>
							</Stack>
							<Divider sx={{ mb: 3 }} />
							<Stack spacing={2.5}>
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
									startIcon={<ApartmentIcon fontSize="small" />}
								/>
							</Stack>
						</CardContent>
					</Card>

					<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
						<PrimaryLoadingButton
							buttonText={isEditMode ? 'Mettre à jour' : 'Ajouter la résidence'}
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
	);
};

const BuildingFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const title = id !== undefined ? 'Modifier la résidence' : 'Nouvelle résidence';

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

export default BuildingFormClient;
