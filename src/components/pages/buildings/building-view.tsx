'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Apartment as ApartmentIcon,
	ArrowBack as ArrowBackIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Hotel as HotelIcon,
	Person as PersonIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { BUILDINGS_EDIT, BUILDINGS_LIST, LOCAUX_VIEW } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import {
	useGetBuildingQuery,
	useDeleteBuildingMutation,
	useGetApartmentsQuery,
	useGetLocauxListQuery,
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

const BuildingViewClient: React.FC<SessionProps & { id: number }> = ({ session, id }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

	const { data: building, isLoading, isError } = useGetBuildingQuery({ id }, { skip: !token });
	const [deleteBuilding] = useDeleteBuildingMutation();
	const { data: apartmentsRaw } = useGetApartmentsQuery(undefined, { skip: !token });
	const { data: locauxRaw } = useGetLocauxListQuery({}, { skip: !token });

	const buildingApartments = useMemo(
		() => (Array.isArray(apartmentsRaw) ? apartmentsRaw : []).filter((a) => a.building === id),
		[apartmentsRaw, id],
	);
	const buildingLocaux = useMemo(
		() => (Array.isArray(locauxRaw) ? locauxRaw : []).filter((l) => l.building === id),
		[locauxRaw, id],
	);

	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const deleteHandler = async () => {
		try {
			await deleteBuilding({ id }).unwrap();
			onSuccess(t.buildings.residenceDeletedSuccess);
			router.push(BUILDINGS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.buildings.residenceDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: deleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title={t.buildings.residenceDetail}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(BUILDINGS_LIST)}
								sx={{ whiteSpace: 'nowrap' }}
							>
								{t.buildings.residencesList}
							</Button>
							<Stack direction="row" spacing={1}>
								<Protected permission="can_edit">
									<Button
										variant="contained"
										startIcon={<EditIcon />}
										onClick={() => router.push(BUILDINGS_EDIT(id))}
										sx={{ whiteSpace: 'nowrap' }}
									>
										{t.common.edit}
									</Button>
								</Protected>
								<Protected permission="can_delete">
									<Button
										variant="outlined"
										color="error"
										startIcon={<DeleteIcon />}
										onClick={() => setShowDeleteModal(true)}
										sx={{ whiteSpace: 'nowrap' }}
									>
										{t.common.delete}
									</Button>
								</Protected>
							</Stack>
						</Stack>

						{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
						{isError && <ApiAlert>{t.buildings.loadError}</ApiAlert>}

						{building && (
							<>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<ApartmentIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.common.identification}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 1 }} />
										<InfoRow icon={<ApartmentIcon />} label={t.common.name} value={building.nom} />
									</CardContent>
								</Card>

								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<CalendarTodayIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.common.metadata}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 1 }} />
								<InfoRow icon={<PersonIcon />} label={t.common.createdBy} value={building.created_by_user_name} />
								<InfoRow icon={<CalendarTodayIcon />} label={t.common.creationDate} value={formatDate(building.date_created)} />
								<InfoRow icon={<CalendarTodayIcon />} label={t.common.lastUpdate} value={formatDate(building.date_updated)} />
									</CardContent>
								</Card>

								{/* Apartments */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<HotelIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.buildings.apartments}
											</Typography>
											<Chip label={buildingApartments.length} size="small" color="primary" />
										</Stack>
										<Divider sx={{ mb: 1 }} />
										{buildingApartments.length === 0 ? (
											<Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
												{t.buildings.noApartments}
											</Typography>
										) : (
											<List dense disablePadding>
												{buildingApartments.map((apt) => (
													<ListItem key={apt.id} disablePadding sx={{ py: 0.5 }}>
														<ListItemIcon sx={{ minWidth: 36 }}>
															<HotelIcon fontSize="small" color="action" />
														</ListItemIcon>
														<ListItemText primary={apt.nom} />
													</ListItem>
												))}
											</List>
										)}
									</CardContent>
								</Card>

								{/* Locaux */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<BusinessIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.navigation.locaux}
											</Typography>
											<Chip label={buildingLocaux.length} size="small" color="primary" />
										</Stack>
										<Divider sx={{ mb: 1 }} />
										{buildingLocaux.length === 0 ? (
											<Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
												{t.buildings.noLocaux}
											</Typography>
										) : (
											<List dense disablePadding>
												{buildingLocaux.map((loc) => (
													<ListItem
														key={loc.id}
														disablePadding
														sx={{ py: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
														onClick={() => loc.id && router.push(LOCAUX_VIEW(loc.id))}
													>
														<ListItemIcon sx={{ minWidth: 36 }}>
															<BusinessIcon fontSize="small" color="action" />
														</ListItemIcon>
														<ListItemText
															primary={loc.nom}
															secondary={loc.type_local}
														/>
													</ListItem>
												))}
											</List>
										)}
									</CardContent>
								</Card>
							</>
						)}

						{showDeleteModal && (
							<ActionModals
							title={t.buildings.deleteResidence}
							body={t.buildings.deleteResidenceConfirm}
								actions={deleteModalActions}
							/>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default BuildingViewClient;
