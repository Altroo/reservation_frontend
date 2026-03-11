'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Stack,
	Typography,
	Chip,
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Close as CloseIcon,
	Visibility as VisibilityIcon,
	Edit as EditIcon,
} from '@mui/icons-material';
import {
	GridColDef,
	GridFilterModel,
	GridLogicOperator,
	GridRenderCellParams,
} from '@mui/x-data-grid';
import type { SessionProps, PaginationResponseType } from '@/types/_initTypes';
import type { ReservationClass } from '@/models/classes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { paymentSourceItemsList, PAYMENT_SOURCE_CHIP_COLORS } from '@/utils/rawData';
import { RESERVATIONS_ADD, RESERVATIONS_VIEW, RESERVATIONS_EDIT } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import {
	useGetReservationsListQuery,
	useDeleteReservationMutation,
	useBulkDeleteReservationsMutation,
	useGetApartmentsQuery,
} from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';

const ReservationsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = getAccessTokenFromSession(session);

	const { data: apartments } = useGetApartmentsQuery(undefined, { skip: !token });

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetReservationsListQuery(
		{
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token },
	);

	const data = rawData as PaginationResponseType<ReservationClass> | undefined;

	const [deleteReservation] = useDeleteReservationMutation();
	const [bulkDeleteReservations] = useBulkDeleteReservationsMutation();

	const deleteHandler = async () => {
		try {
			await deleteReservation({ id: selectedId! }).unwrap();
			onSuccess('Réservation supprimée avec succès');
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression de la réservation'));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteReservations({ ids: selectedIds }).unwrap();
			onSuccess(`${selectedIds.length} réservation(s) supprimée(s) avec succès`);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression'));
		} finally {
			setSelectedIds([]);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const deleteModalActions = [
		{ text: 'Annuler', active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: 'Supprimer', active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkDeleteModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: `Supprimer (${selectedIds.length})`,
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const chipFilters = React.useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'apartment',
				label: 'Appartement',
				paramName: 'apartment',
				options: (apartments ?? []).map((a) => ({ id: String(a.id), nom: `${a.code} — ${a.name}` })),
			},
			{
				key: 'payment_source',
				label: 'Source',
				paramName: 'payment_source',
				options: paymentSourceItemsList.map((p) => ({ id: p.code, nom: p.value })),
			},
		],
		[apartments],
	);

	const columns: GridColDef[] = [
		{
			field: 'apartment_code',
			headerName: 'Appart.',
			flex: 0.7,
			minWidth: 90,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={params.row.apartment_name ?? params.value ?? '—'}>
					<Chip label={params.value ?? '—'} size="small" variant="outlined" />
				</DarkTooltip>
			),
		},
		{
			field: 'guest_name',
			headerName: 'Client',
			flex: 1.4,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'check_in',
			headerName: 'Arrivée',
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'check_out',
			headerName: 'Départ',
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'nights',
			headerName: 'Nuits',
			flex: 0.5,
			minWidth: 70,
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<Typography variant="body2">{params.value ?? '—'}</Typography>
			),
		},
		{
			field: 'amount',
			headerName: 'Montant',
			flex: 0.9,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'payment_source',
			headerName: 'Source',
			flex: 0.8,
			minWidth: 100,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ReservationClass>) => {
				const source = params.value as string;
				return (
					<DarkTooltip title={source}>
						<Chip
							label={source}
							size="small"
									color={PAYMENT_SOURCE_CHIP_COLORS[source] ?? 'default'}
							variant="outlined"
						/>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'actions',
			headerName: 'Actions',
			flex: 1.2,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const actions = [
					{
						label: 'Voir',
						icon: <VisibilityIcon />,
						onClick: () => router.push(RESERVATIONS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: 'Modifier',
						icon: <EditIcon />,
						onClick: () => router.push(RESERVATIONS_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: 'Supprimer',
						icon: <DeleteIcon />,
						onClick: () => {
							setSelectedId(params.row.id);
							setShowDeleteModal(true);
						},
						color: 'error' as const,
					},
				];
				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			mt="48px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Liste des réservations">
				<Protected>
					<>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								justifyContent: 'flex-start',
								gap: 2,
								px: { xs: 1, sm: 2, md: 3 },
								mt: { xs: 1, sm: 2, md: 3 },
								mb: { xs: 1, sm: 2, md: 3 },
							}}
						>
							<Button
								variant="contained"
								onClick={() => router.push(RESERVATIONS_ADD)}
								startIcon={<AddIcon fontSize="small" />}
							sx={{
								whiteSpace: 'nowrap',
								px: { xs: 1.5, sm: 2, md: 3 },
								py: { xs: 0.8, sm: 1, md: 1 },
								fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
							}}
							>
								Nouvelle réservation
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap' }}
								>
									Supprimer ({selectedIds.length})
								</Button>
							)}
						</Box>

						<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={1} />

						<PaginatedDataGrid
							data={data}
							isLoading={isLoading}
							columns={columns}
							paginationModel={paginationModel}
							setPaginationModel={setPaginationModel}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							filterModel={filterModel}
							onFilterModelChange={setFilterModel}
							onCustomFilterParamsChange={setCustomFilterParams}
							checkboxSelection
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>

						{showDeleteModal && (
							<ActionModals
								title="Supprimer la réservation"
								body="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
								actions={deleteModalActions}
								onClose={() => setShowDeleteModal(false)}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={`Supprimer ${selectedIds.length} réservation(s)`}
								body="Cette action supprimera définitivement les réservations sélectionnées."
								actions={bulkDeleteModalActions}
								onClose={() => setShowBulkDeleteModal(false)}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ReservationsListClient;
