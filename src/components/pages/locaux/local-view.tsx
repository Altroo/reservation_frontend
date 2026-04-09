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
	Apartment as ApartmentIcon,
	ArrowBack as ArrowBackIcon,
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
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { LoyerListType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { LOCAUX_EDIT, LOCAUX_LIST } from '@/utils/routes';
import type { ChipColor } from '@/utils/rawData';
import { LOCAL_TYPE_LABEL_KEYS, TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useDeleteLocalMutation,
	useGetLocalQuery,
	useGetLocalYearsQuery,
	useGetLoyersListQuery,
	useToggleLoyerPaidMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
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
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

interface Props extends SessionProps {
	id: number;
}

const LocalViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const { t } = useLanguage();
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
			onSuccess(t.locaux.localDeletedSuccess);
			router.push(LOCAUX_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.locaux.localDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const handleTogglePaid = async (loyer: LoyerListType) => {
		try {
			await toggleLoyerPaid({ id: loyer.id, paye: !loyer.paye }).unwrap();
			onSuccess(loyer.paye ? t.locaux.rentMarkedUnpaid : t.locaux.rentMarkedPaid);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.locaux.rentUpdateError));
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const typeColor = (TYPE_LOCAL_CHIP_COLORS[local?.type_local as string] ?? 'default') as ChipColor;

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.locaux.localDetail}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							spacing={2}
							sx={{
								justifyContent: 'space-between',
								alignItems: isMobile ? 'stretch' : 'center',
							}}
						>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(LOCAUX_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.locaux.localsList}
							</Button>
							{!isLoading && !error && local && (
								<Stack
									direction="row"
									sx={{
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<EditIcon />}
											onClick={() => router.push(LOCAUX_EDIT(id))}
										>
											{t.common.edit}
										</Button>
									</Protected>
									<Protected permission="can_delete">
										<Button
											variant="outlined"
											color="error"
											size="small"
											startIcon={<DeleteIcon />}
											onClick={() => setShowDeleteModal(true)}
										>
											{t.common.delete}
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
							<Alert severity="warning">{t.locaux.localNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								{/* Identification */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={3}
											sx={{
												alignItems: 'center',
											}}
										>
											<BusinessIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{local.nom}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<BusinessIcon />}
												label={t.common.type}
												value={
													<Chip
														label={
															t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[local.type_local as 'Bureau' | 'Magasin']]
														}
														size="small"
														color={typeColor}
														variant="outlined"
													/>
												}
											/>
											<Divider />
											<InfoRow
												icon={<ApartmentIcon />}
												label={t.locaux.residence}
												value={
													local.building_nom ? (
														<Chip label={local.building_nom} size="small" color="primary" variant="outlined" />
													) : (
														'—'
													)
												}
											/>
											<Divider />
											<InfoRow icon={<LocationOnIcon />} label={t.common.address} value={local.adresse} />
											<Divider />
											<InfoRow
												icon={<SquareFootIcon />}
												label={t.locaux.surface}
												value={local.superficie ? `${local.superficie} m²` : null}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Financier */}
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
											<AttachMoneyIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.locaux.financial}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.locaux.purchasePrice}
												value={
													<Typography
														color="primary"
														sx={{
															fontWeight: 600,
														}}
													>
														{Number(local.prix_achat).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<PaidIcon />}
												label={t.locaux.monthlyRent}
												value={
													<Typography
														color="primary"
														sx={{
															fontWeight: 600,
														}}
													>
														{Number(local.prix_location_mensuel).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<TrendingUpIcon />}
												label={t.locaux.profitability}
												value={
													<Typography
														sx={{
															fontWeight: 600,
															color: 'success.main',
														}}
													>
														{local.rentabilite}%
													</Typography>
												}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Location */}
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
											<PersonIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.locaux.rental}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<CheckIcon />}
												label={t.common.status}
												value={
													<Chip
														label={local.en_location ? t.locaux.inRental : t.common.free}
														size="small"
														color={local.en_location ? 'success' : 'default'}
														variant="outlined"
													/>
												}
											/>
											{local.en_location && (
												<>
													<Divider />
													<InfoRow icon={<PersonIcon />} label={t.locaux.tenantName} value={local.locataire_nom} />
													<Divider />
													<InfoRow
														icon={<CalendarTodayIcon />}
														label={t.locaux.rentalStartDate}
														value={formatDate(local.date_debut_location ?? null)}
													/>
												</>
											)}
										</Stack>
									</CardContent>
								</Card>

								{/* Notes */}
								{local.notes && (
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
													{t.common.notes}
												</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<InfoRow icon={<NotesIcon />} label={t.common.notes} value={local.notes} />
										</CardContent>
									</Card>
								)}

								{/* Metadata */}
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
												{t.common.metadata}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<PersonIcon />}
												label={t.common.createdBy}
												value={local.created_by_user_name ?? '—'}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.common.creationDate}
												value={formatDate(local.date_created)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.common.lastUpdate}
												value={formatDate(local.date_updated)}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Loyers */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={2}
											sx={{
												alignItems: isMobile ? 'stretch' : 'center',
												justifyContent: 'space-between',
												mb: 2,
											}}
										>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
												}}
											>
												<PaidIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.locaux.rents}
												</Typography>
											</Stack>
											<FormControl size="small" sx={{ minWidth: 100 }}>
												<InputLabel>{t.common.year}</InputLabel>
												<Select
													value={loyerYear}
													label={t.common.year}
													onChange={(e) => setLoyerYear(Number(e.target.value))}
												>
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
											<Typography
												sx={{
													color: 'text.secondary',
													py: 2,
													textAlign: 'center',
												}}
											>
												{t.locaux.noRentsForYear(loyerYear)}
											</Typography>
										) : (
											<TableContainer>
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>{t.common.month}</TableCell>
															<TableCell>{t.common.amount}</TableCell>
															<TableCell>{t.common.status}</TableCell>
															<TableCell>{t.common.payment}</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{loyers
															.slice()
															.sort((a, b) => a.mois - b.mois)
															.map((loyer) => (
																<TableRow key={loyer.id}>
																	<TableCell>{t.rawData.monthLabels[loyer.mois - 1]}</TableCell>
																	<TableCell>{Number(loyer.montant).toLocaleString('fr-MA')} MAD</TableCell>
																	<TableCell>
																		<Chip
																			label={loyer.paye ? t.common.paid : t.common.unpaid}
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
					title={t.locaux.deleteLocal}
					body={t.locaux.deleteLocalConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default LocalViewClient;
