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
import { useToast } from '@/utils/hooks';
import { PAYMENT_SOURCE_CHIP_COLORS } from '@/utils/rawData';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const displayValue =
		React.isValidElement(value)
			? value
			: value === null || value === undefined || String(value).trim() === ''
				? '-'
				: value;

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={2}
			sx={{ py: 1.5, flexWrap: 'wrap' }}
		>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>
				{icon}
			</Box>
			<Stack
				direction="row"
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{ flex: 1, flexWrap: 'wrap' }}
			>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{ minWidth: { xs: '100%', sm: 200 }, wordBreak: 'break-word' }}
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
	const token = useInitAccessToken();
	const { data: reservation, isLoading, error } = useGetReservationQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteRecord] = useDeleteReservationMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess('Réservation supprimée avec succès');
			router.push(RESERVATIONS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression de la réservation'));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{
			text: 'Supprimer',
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title="Détails de la réservation">
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							justifyContent="space-between"
							alignItems={isMobile ? 'stretch' : 'center'}
							spacing={2}
						>
							<Button
								size="large"
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(RESERVATIONS_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Liste des réservations
							</Button>
							{!isLoading && !error && (
								<Stack direction="row" gap={1} flexWrap="wrap">
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(RESERVATIONS_EDIT(id))}
									>
										Modifier
									</Button>
									<Button
										variant="outlined"
										color="error"
										size="small"
										startIcon={<DeleteIcon />}
										onClick={() => setShowDeleteModal(true)}
									>
										Supprimer
									</Button>
								</Stack>
							)}
						</Stack>

						{/* Loading / error gate */}
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert errorDetails={axiosError?.data as unknown as Record<string, string[]>} />
						) : !reservation ? (
							<Alert severity="warning">Réservation introuvable</Alert>
						) : (
							<Stack spacing={3}>
								{/* Header card */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={2}
											alignItems={isMobile ? 'flex-start' : 'center'}
										>
											<Stack spacing={1} sx={{ flex: 1 }}>
												<Typography variant="h5" fontWeight={700} fontSize={isMobile ? '20px' : '24px'}>
													Réservation #{reservation.id}
												</Typography>
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<PersonIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Informations du séjour
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<PersonIcon />} label="Client" value={reservation.guest_name} />
											<Divider />
											<InfoRow
												icon={<HotelIcon />}
												label="Appartement"
												value={
													<Chip
													label={reservation.apartment_nom}
														size="small"
														variant="outlined"
													/>
												}
											/>
											<Divider />
											<InfoRow icon={<CalendarIcon />} label="Arrivée" value={formatDate(reservation.check_in)} />
											<Divider />
											<InfoRow icon={<CalendarIcon />} label="Départ" value={formatDate(reservation.check_out)} />
											<Divider />
											<InfoRow
												icon={<CalendarIcon />}
												label="Durée"
												value={
													<Chip
														label={`${reservation.nights} nuit${(reservation.nights ?? 0) > 1 ? 's' : ''}`}
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
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<CreditCardIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Paiement
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<MoneyIcon />}
												label="Montant"
												value={
													<Typography fontWeight={600} color="primary">
														{Number(reservation.amount).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<CreditCardIcon />}
												label="Source de paiement"
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
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<NotesIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>
													Notes
												</Typography>
											</Stack>
											<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
											<Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
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
					title="Supprimer cette réservation ?"
					body="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ReservationViewClient;



