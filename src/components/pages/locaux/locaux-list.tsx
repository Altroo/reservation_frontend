'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { LocalListType } from '@/types/localTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { extractApiErrorMessage } from '@/utils/helpers';
import { LOCAUX_ADD, LOCAUX_EDIT, LOCAUX_VIEW } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import {
	useGetLocauxListQuery,
	useDeleteLocalMutation,
	useBulkDeleteLocauxMutation,
	useGetBuildingsQuery,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { TYPE_LOCAL_CHIP_COLORS, LOCAL_TYPE_LABEL_KEYS } from '@/utils/rawData';
import type { ChipColor } from '@/utils/rawData';

const LocauxListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const { data: locauxRaw, isLoading } = useGetLocauxListQuery({}, { skip: !token });
	const locaux = useMemo(() => (Array.isArray(locauxRaw) ? locauxRaw : []) as LocalListType[], [locauxRaw]);
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const [deleteLocal] = useDeleteLocalMutation();
	const [bulkDeleteLocaux] = useBulkDeleteLocauxMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const filteredLocaux = useMemo(() => {
		let result = locaux;

		const typeParam = chipFilterParams['type_local'];
		if (typeParam) {
			const types = typeParam.split(',');
			result = result.filter((l) => types.includes(l.type_local));
		}

		const locationParam = chipFilterParams['en_location'];
		if (locationParam) {
			const isEnLocation = locationParam === 'true';
			result = result.filter((l) => l.en_location === isEnLocation);
		}

		const buildingParam = chipFilterParams['building'];
		if (buildingParam) {
			const buildingIds = buildingParam.split(',').map(Number);
			result = result.filter((l) => l.building !== null && buildingIds.includes(l.building));
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(l) =>
					l.nom.toLowerCase().includes(term) ||
					l.locataire_nom.toLowerCase().includes(term) ||
					l.adresse.toLowerCase().includes(term),
			);
		}

		if (customFilterParams['prix_achat__gte']) {
			const val = Number(customFilterParams['prix_achat__gte']);
			result = result.filter((l) => Number(l.prix_achat) >= val);
		}
		if (customFilterParams['prix_achat__lte']) {
			const val = Number(customFilterParams['prix_achat__lte']);
			result = result.filter((l) => Number(l.prix_achat) <= val);
		}
		if (customFilterParams['prix_location_mensuel__gte']) {
			const val = Number(customFilterParams['prix_location_mensuel__gte']);
			result = result.filter((l) => Number(l.prix_location_mensuel) >= val);
		}
		if (customFilterParams['prix_location_mensuel__lte']) {
			const val = Number(customFilterParams['prix_location_mensuel__lte']);
			result = result.filter((l) => Number(l.prix_location_mensuel) <= val);
		}

		return result;
	}, [locaux, chipFilterParams, searchTerm, customFilterParams]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredLocaux.length,
			results: filteredLocaux.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredLocaux, paginationModel]);

	const deleteHandler = async () => {
		try {
			await deleteLocal({ id: selectedId! }).unwrap();
			onSuccess(t.locaux.localDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.locaux.localDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteLocaux({ ids: selectedIds }).unwrap();
			onSuccess(t.locaux.bulkLocauxDeletedSuccess);
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.locaux.bulkLocauxDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
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

	const bulkDeleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'type_local',
				label: t.common.type,
				paramName: 'type_local',
				options: [
					{ id: 'Bureau', nom: t.rawData.localTypes.office },
					{ id: 'Magasin', nom: t.rawData.localTypes.shop },
				],
			},
			{
				key: 'en_location',
				label: t.common.status,
				paramName: 'en_location',
				options: [
					{ id: 'true', nom: t.common.rented },
					{ id: 'false', nom: t.common.free },
				],
			},
			{
				key: 'building',
				label: t.locaux.residence,
				paramName: 'building',
				options: (buildingsData ?? []).map((b) => ({ id: String(b.id), nom: b.nom })),
			},
		],
		[buildingsData, t.common.status, t.common.type, t.locaux.residence, t.common.rented, t.common.free, t.rawData.localTypes.office, t.rawData.localTypes.shop],
	);

	const columns: GridColDef[] = [
		{
			field: 'nom',
			headerName: t.common.name,
			flex: 1.2,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'building_nom',
			headerName: t.locaux.residence,
			flex: 0.8,
			minWidth: 120,
			filterable: false,
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value || '—'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'type_local',
			headerName: t.common.type,
			flex: 0.7,
			minWidth: 100,
			filterable: false,
			renderCell: (params: GridRenderCellParams<LocalListType>) => {
				const type = params.value as 'Bureau' | 'Magasin';
				const label = t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[type]] ?? type;
				return (
					<DarkTooltip title={label}>
						<Chip
							label={label}
							size="small"
							color={(TYPE_LOCAL_CHIP_COLORS[type] ?? 'default') as ChipColor}
							variant="outlined"
						/>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'prix_achat',
			headerName: t.locaux.purchasePrice,
			flex: 1,
			minWidth: 120,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'prix_location_mensuel',
			headerName: t.locaux.monthlyRent,
			flex: 1,
			minWidth: 120,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'en_location',
			headerName: t.common.status,
			flex: 0.7,
			minWidth: 100,
			filterable: false,
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<Chip
					label={params.value ? t.locaux.inRental : t.common.free}
					size="small"
					color={params.value ? 'success' : 'default'}
					variant="outlined"
				/>
			),
		},
		{
			field: 'locataire_nom',
			headerName: t.locaux.tenantName,
			flex: 1,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value || '—'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'rentabilite',
			headerName: t.locaux.profitability,
			flex: 0.8,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<LocalListType>) => (
				<DarkTooltip title={`${params.value}%`}>
					<Typography variant="body2" noWrap>
						{params.value}%
					</Typography>
				</DarkTooltip>
			),
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
						onClick: () => router.push(LOCAUX_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(LOCAUX_EDIT(params.row.id)),
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
			<NavigationBar title={t.locaux.localsList}>
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
								flexWrap: 'wrap',
								alignItems: 'center',
							}}
						>
							<Button
								variant="contained"
								onClick={() => router.push(LOCAUX_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								{t.locaux.newLocal}
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap' }}
								>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Box>

						<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />

						<PaginatedDataGrid
							data={paginatedData}
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
							title={t.locaux.deleteLocal}
							body={t.locaux.deleteLocalConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
							title={t.locaux.bulkDeleteLocaux}
							body={t.locaux.bulkDeleteLocauxConfirm(selectedIds.length)}
								actions={bulkDeleteModalActions}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default LocauxListClient;
