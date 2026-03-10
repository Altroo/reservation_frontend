'use client';

import React, { useMemo, isValidElement, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { getAccessTokenFromSession } from '@/store/session';
import { useGetUserQuery, useDeleteUserMutation } from '@/store/services/account';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Stack,
	Typography,
	Avatar,
	useTheme,
	useMediaQuery,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Box,
	Alert,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Person as PersonIcon,
	AdminPanelSettings as AdminPanelSettingsIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	CalendarToday as CalendarTodayIcon,
	Login as LoginIcon,
	Badge as BadgeIcon,
	Public as PublicIcon,
	Security as SecurityIcon,
} from '@mui/icons-material';
import { USERS_LIST, USERS_EDIT } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { useToast } from '@/utils/hooks';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const displayValue = React.isValidElement(value) ? value : value && value.toString().length > 1 ? value : '-';

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={2}
			sx={{
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box
				sx={{
					color: 'primary.main',
					display: 'flex',
					alignItems: 'center',
					minWidth: 40,
				}}
			>
				{icon}
			</Box>

			<Stack
				direction="row"
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{
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

const UsersViewClient: React.FC<Props> = ({ session, id }) => {
	const router = useRouter();
	const token = getAccessTokenFromSession(session);
	const { data: userData, isLoading, error } = useGetUserQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteRecord] = useDeleteUserMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRecord({ id }).unwrap();
			onSuccess('Utilisateur supprimé avec succès');
			router.push(USERS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression de l\u2019utilisateur'));
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
			<NavigationBar title="Détails de l'utilisateur">
				<Protected>
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} spacing={2}>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(USERS_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								Liste des utilisateurs
							</Button>
							{!isLoading && !error && (
								<Stack direction="row" gap={1} flexWrap="wrap">
									<Button
										variant="outlined"
										size="small"
										startIcon={<EditIcon />}
										onClick={() => router.push(USERS_EDIT(id))}
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
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert
								errorDetails={axiosError?.data.details}
								cssStyle={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
								}}
							/>
						) : !userData ? (
							<Alert severity="warning">Utilisateur introuvable</Alert>
						) : (
							<Stack spacing={3}>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction={isMobile ? 'column' : 'row'}
											spacing={3}
											alignItems={isMobile ? 'center' : 'flex-start'}
										>
											<Avatar
												src={`${userData?.avatar}`}
												alt={userData?.email}
												sx={{
													width: isMobile ? 100 : 120,
													height: isMobile ? 100 : 120,
													border: '4px solid',
													borderColor: 'primary.light',
													boxShadow: 3,
													'& img': {
														objectFit: 'contain',
													},
												}}
											/>
											<Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
												<Stack spacing={1} alignItems={isMobile ? 'center' : 'flex-start'}>
													<Typography
														variant="h4"
														textAlign={isMobile ? 'center' : 'inherit'}
														fontSize={isMobile ? '20px' : '25px'}
														fontWeight={700}
													>
														{[userData?.first_name, userData?.last_name].filter(Boolean).join(' ') || userData?.email || "Nom de l'utilisateur"}
													</Typography>
													<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
														<Chip icon={<BadgeIcon />} label={`ID: ${userData?.id}`} size="small" variant="outlined" />
														{userData?.is_staff && (
															<Chip
																icon={<AdminPanelSettingsIcon />}
																label="Administrateur"
																color="primary"
																size="small"
															/>
														)}
														{userData?.is_active ? (
															<Chip icon={<CheckCircleIcon />} label="Actif" color="success" size="small" />
														) : (
															<Chip icon={<CancelIcon />} label="Inactif" color="error" size="small" />
														)}
													</Stack>
												</Stack>
											</Stack>
										</Stack>
									</CardContent>
								</Card>

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent
										sx={{
											px: { xs: 2, md: 3 },
											py: { xs: 2, md: 3 },
										}}
									>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<PublicIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Informations générales
											</Typography>
										</Stack>

										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

										<Stack spacing={0}>
											<InfoRow icon={<EmailIcon />} label="Email" value={userData?.email} />
											<Divider />
											<InfoRow icon={<PersonIcon />} label="Sexe" value={userData?.gender} />
											<Divider />
											<InfoRow
												icon={<AdminPanelSettingsIcon />}
												label="Admin"
												value={
													userData?.is_staff ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="primary" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Active"
												value={
													userData?.is_active ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" color="error" size="small" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label="Date d&apos;inscription"
												value={userData?.date_joined && formatDate(userData?.date_joined)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label="Dernière mise à jour"
												value={userData?.date_updated && formatDate(userData?.date_updated)}
											/>
											<Divider />
											<InfoRow
												icon={<LoginIcon />}
												label="Dernière connexion"
												value={userData?.last_login && formatDate(userData?.last_login)}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Permissions */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<SecurityIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												Permissions
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Peut voir"
												value={
													userData?.can_view ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Peut imprimer"
												value={
													userData?.can_print ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Peut créer"
												value={
													userData?.can_create ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Peut modifier"
												value={
													userData?.can_edit ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
											<Divider />
											<InfoRow
												icon={<CheckCircleIcon />}
												label="Peut supprimer"
												value={
													userData?.can_delete ? (
														<Chip icon={<CheckCircleIcon />} label="Oui" color="success" size="small" />
													) : (
														<Chip icon={<CancelIcon />} label="Non" size="small" variant="outlined" />
													)
												}
											/>
										</Stack>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		{showDeleteModal && (
			<ActionModals
				title="Supprimer cet utilisateur ?"
				body="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
				actions={deleteModalActions}
				titleIcon={<DeleteIcon />}
				titleIconColor="#D32F2F"
			/>
		)}
		</Stack>
	);
};

export default UsersViewClient;
