'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteReservationMutation, useGetReservationQuery } from '@/store/services/reservation';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Apartment as ApartmentIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as MoneyIcon,
	CalendarMonth as CalendarIcon,
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Hotel as HotelIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
} from '@mui/icons-material';
import { RESERVATIONS_EDIT, RESERVATIONS_LIST } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { PAYMENT_SOURCE_CHIP_COLORS } from '@/utils/rawData';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const displayValue = React.isValidElement(value)
		? value
		: value === null || value === undefined || String(value).trim() === ''
			? '-'
			: value;

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
					{React.isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue as string}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

interface Props extends SessionProps {
	id: number;
}

const ReservationViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: reservation, isLoading, error } = useGetReservationQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteRecord] = useDeleteReservationMutation();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess(t.reservations.reservationDeletedSuccess);
			router.push(RESERVATIONS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.reservations.reservationDeleteError));
		} finally {
			setShowDeleteModal(false);
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
		{
			text: t.common.delete,
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.reservations.reservationDetails}>
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
								size="large"
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(RESERVATIONS_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.reservations.reservationsList}
							</Button>
							{!isLoading && !error && (
								<Stack
									direction="row"
									sx={{
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(RESERVATIONS_EDIT(id))}
									>
										{t.common.edit}
									</Button>
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<DeleteIcon />}
										onClick={() => setShowDeleteModal(true)}
									>
										{t.common.delete}
									</Button>
								</Stack>
							)}
						</Stack>

						{/* Loading / error gate */}
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert errorDetails={axiosError?.data as Record<string, unknown>} />
						) : !reservation ? (
							<Alert severity="warning">{t.reservations.reservationNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								{/* Header card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={2}
											sx={{
												alignItems: isMobile ? 'flex-start' : 'center',
											}}
										>
											<Stack spacing={1} sx={{ flex: 1 }}>
												<Typography
													variant="h5"
													sx={{
														fontWeight: 700,
														fontSize: isMobile ? '20px' : '24px',
													}}
												>
													{t.reservations.reservationNumber(reservation.id)}
												</Typography>
												<Stack
													direction="row"
													spacing={1}
													sx={{
														alignItems: 'center',
														flexWrap: 'wrap',
													}}
												>
													{reservation.apartment_building_nom && (
														<Chip
															icon={<ApartmentIcon />}
															label={reservation.apartment_building_nom}
															size="small"
															color="primary"
															variant="outlined"
														/>
													)}
													<Chip
														icon={<HotelIcon />}
														label={reservation.apartment_nom}
														size="small"
														variant="outlined"
													/>
													<Chip
														label={reservation.payment_source}
														size="small"
														color={PAYMENT_SOURCE_CHIP_COLORS[reservation.payment_source] ?? 'default'}
													/>
												</Stack>
											</Stack>
										</Stack>
									</CardContent>
								</Card>

								{/* Séjour */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
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
												{t.reservations.stayInfo}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<PersonIcon />} label={t.reservations.client} value={reservation.guest_name} />
											<Divider />
											<InfoRow
												icon={<ApartmentIcon />}
												label={t.reservations.residence}
												value={
													reservation.apartment_building_nom ? (
														<Chip
															label={reservation.apartment_building_nom}
															size="small"
															color="primary"
															variant="outlined"
														/>
													) : (
														'—'
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<HotelIcon />}
												label={t.reservations.apartment}
												value={<Chip label={reservation.apartment_nom} size="small" variant="outlined" />}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarIcon />}
												label={t.reservations.arrival}
												value={formatDate(reservation.check_in)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarIcon />}
												label={t.reservations.departure}
												value={formatDate(reservation.check_out)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarIcon />}
												label={t.reservations.duration}
												value={
													<Chip
														label={t.reservations.nightCount(reservation.nights ?? 0)}
														size="small"
														color="info"
														variant="outlined"
													/>
												}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Paiement */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
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
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<MoneyIcon />}
												label={t.reservations.amountLabel}
												value={
													<Typography
														color="primary"
														sx={{
															fontWeight: 600,
														}}
													>
														{Number(reservation.amount).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<CreditCardIcon />}
												label={t.reservations.paymentSourceLabel}
												value={
													<Chip
														label={reservation.payment_source}
														size="small"
														color={PAYMENT_SOURCE_CHIP_COLORS[reservation.payment_source] ?? 'default'}
													/>
												}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Notes */}
								{reservation.notes && (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
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
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Typography
												variant="body2"
												sx={{
													color: 'text.secondary',
													whiteSpace: 'pre-wrap',
												}}
											>
												{reservation.notes}
											</Typography>
										</CardContent>
									</Card>
								)}
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals
					title={t.reservations.deleteReservation}
					body={t.reservations.deleteReservationConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ReservationViewClient;
