'use client';

import React, { useState, useMemo } from 'react';
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
import { PAYMENT_SOURCE_CHIP_COLORS } from '@/utils/rawData';
import { RESERVATIONS_ADD, RESERVATIONS_VIEW, RESERVATIONS_EDIT } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import {
	useGetReservationsListQuery,
	useDeleteReservationMutation,
	useBulkDeleteReservationsMutation,
	useGetApartmentsQuery,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';

const ReservationsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

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
		isError,
		error,
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

	const guestNameOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(data?.results ?? []).forEach((r) => {
			if (r.guest_name) nameMap.set(r.guest_name, r.guest_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [data?.results]);

	const [deleteReservation] = useDeleteReservationMutation();
	const [bulkDeleteReservations] = useBulkDeleteReservationsMutation();

	const deleteHandler = async () => {
		try {
			await deleteReservation({ id: selectedId! }).unwrap();
			onSuccess(t.reservations.reservationDeletedSuccess);
			refetch();
		} catch (err) {
			onError(extractApiErrorMessage(err, t.reservations.reservationDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteReservations({ ids: selectedIds }).unwrap();
			onSuccess(t.reservations.bulkReservationsDeletedSuccess(selectedIds.length));
		} catch (err) {
			onError(extractApiErrorMessage(err, t.reservations.bulkReservationsDeleteError));
		} finally {
			setSelectedIds([]);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkDeleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.reservations.deleteBtnCount(selectedIds.length),
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
				label: t.reservations.apartment,
				paramName: 'apartment',
				options: (apartments ?? []).map((a) => ({ id: String(a.id), nom: a.nom })),
			},
			{
				key: 'payment_source',
				label: t.reservations.columnSource,
				paramName: 'payment_source',
				options: [
					{ id: 'Booking', nom: 'Booking' },
					{ id: 'Airbnb', nom: 'Airbnb' },
					{ id: 'Cash', nom: t.rawData.paymentSources.cash },
					{ id: 'Bank', nom: t.rawData.paymentSources.bankTransfer },
				],
			},
		],
		[apartments, t.reservations.apartment, t.reservations.columnSource, t.rawData.paymentSources.bankTransfer, t.rawData.paymentSources.cash],
	);

	const columns: GridColDef[] = [
		{
			field: 'apartment_nom',
			headerName: t.reservations.columnAppartment,
			flex: 0.7,
			minWidth: 90,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Chip label={params.value ?? '—'} size="small" variant="outlined" sx={{ maxWidth: 110 }} />
				</DarkTooltip>
			),
		},
		{
			field: 'guest_name',
			headerName: t.reservations.columnClient,
			flex: 1.4,
			minWidth: 130,
			filterOperators: createDropdownFilterOperators(guestNameOptions, t.reservations.allClients),
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
			headerName: t.reservations.columnCheckIn,
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
			headerName: t.reservations.columnCheckOut,
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
			headerName: t.reservations.columnNights,
			flex: 0.5,
			minWidth: 70,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ReservationClass>) => (
				<Typography variant="body2">{params.value ?? '—'}</Typography>
			),
		},
		{
			field: 'amount',
			headerName: t.reservations.columnAmount,
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
			headerName: t.reservations.columnSource,
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
			headerName: t.common.actions,
			flex: 1.2,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const actions = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(RESERVATIONS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(RESERVATIONS_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: t.common.delete,
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
			<NavigationBar title={t.reservations.reservationsList}>
				<Protected permission="can_view">
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
								{t.reservations.newReservation}
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap' }}
								>
									{t.reservations.deleteBtnCount(selectedIds.length)}
								</Button>
							)}
						</Box>

						{isError ? (
							<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
								<Typography color="text.secondary" variant="h6" textAlign="center">
									{t.reservations.loadError}
								</Typography>
								<Typography color="error.main" variant="body2" textAlign="center">
									{(error as { data?: { message?: string } })?.data?.message ?? t.reservations.networkError}
								</Typography>
								<Button variant="outlined" onClick={() => refetch()}>
									{t.common.retry}
								</Button>
							</Box>
						) : (
							<>
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
							</>
						)}

						{showDeleteModal && (
							<ActionModals
								title={t.reservations.deleteReservation}
								body={t.reservations.deleteReservationConfirm}
								actions={deleteModalActions}
								onClose={() => setShowDeleteModal(false)}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.reservations.bulkDeleteReservations(selectedIds.length)}
								body={t.reservations.bulkDeleteReservationsConfirm}
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



