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
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
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
	ArrowBack as ArrowBackIcon,
	Apartment as ApartmentIcon,
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	CalendarMonth as CalendarMonthIcon,
	CalendarToday as CalendarTodayIcon,
	Check as CheckIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	LocationOn as LocationOnIcon,
	Notes as NotesIcon,
	Paid as PaidIcon,
	Person as PersonIcon,
	SquareFoot as SquareFootIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { SessionProps, ApiErrorResponseType, ResponseDataInterface } from '@/types/_initTypes';
import type { LoyerListType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { LOCAUX_EDIT, LOCAUX_LIST } from '@/utils/routes';
import { TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useToast } from '@/utils/hooks';
import {
	useGetLocalQuery,
	useDeleteLocalMutation,
	useGetLoyersListQuery,
	useGetLocalYearsQuery,
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

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const typeColor = (TYPE_LOCAL_CHIP_COLORS[local?.type_local as string] ?? 'default') as ChipColor;

	return (
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
												<InfoRow
													icon={<ApartmentIcon />}
													label="Résidence"
													value={local.building_nom ? <Chip label={local.building_nom} size="small" color="primary" variant="outlined" /> : '—'}
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

			</Stack>
	);
};

export default LocalViewClient;
