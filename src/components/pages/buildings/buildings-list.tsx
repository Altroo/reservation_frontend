'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { BuildingListType } from '@/types/buildingTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { BUILDINGS_ADD, BUILDINGS_EDIT, BUILDINGS_VIEW } from '@/utils/routes';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { useToast, useLanguage } from '@/utils/hooks';
import {
	useGetBuildingsQuery,
	useDeleteBuildingMutation,
	useBulkDeleteBuildingsMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';

const BuildingsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const { data: buildingsRaw, isLoading } = useGetBuildingsQuery(undefined, { skip: !token });
	const buildings = useMemo(() => (Array.isArray(buildingsRaw) ? buildingsRaw : []) as BuildingListType[], [buildingsRaw]);

	const [deleteBuilding] = useDeleteBuildingMutation();
	const [bulkDeleteBuildings] = useBulkDeleteBuildingsMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const createdByOptions = useMemo(() => {
		const names = new Set<string>();
		buildings.forEach((b) => {
			if (b.created_by_user_name) names.add(b.created_by_user_name);
		});
		return Array.from(names).map((n) => ({ value: n, label: n }));
	}, [buildings]);

	const filteredBuildings = useMemo(() => {
		let result = buildings;

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter((b) => b.nom.toLowerCase().includes(term));
		}

		const after = customFilterParams['date_created_after'];
		const before = customFilterParams['date_created_before'];
		if (after) {
			const afterDate = new Date(after);
			result = result.filter((b) => b.date_created && new Date(b.date_created) >= afterDate);
		}
		if (before) {
			const beforeDate = new Date(before);
			result = result.filter((b) => b.date_created && new Date(b.date_created) <= beforeDate);
		}

		const createdBy = customFilterParams['created_by_user_name'];
		if (createdBy) {
			result = result.filter((b) => b.created_by_user_name === createdBy);
		}

		return result;
	}, [buildings, searchTerm, customFilterParams]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredBuildings.length,
			results: filteredBuildings.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredBuildings, paginationModel]);

	const deleteHandler = async () => {
		try {
			await deleteBuilding({ id: selectedId! }).unwrap();
			onSuccess(t.buildings.residenceDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.buildings.residenceDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteBuildings({ ids: selectedIds }).unwrap();
			onSuccess(t.buildings.bulkResidencesDeletedSuccess);
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.buildings.bulkResidencesDeleteError));
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

	const columns: GridColDef[] = [
		{
			field: 'nom',
			headerName: t.common.name,
			flex: 2,
			minWidth: 200,
			renderCell: (params: GridRenderCellParams<BuildingListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: t.common.creationDate,
			flex: 1,
			minWidth: 140,
			filterOperators: createDateRangeFilterOperator(t.filters.between),
			renderCell: (params: GridRenderCellParams<BuildingListType>) => (
				<Typography variant="body2" noWrap>
					{formatDate(params.value)}
				</Typography>
			),
		},
		{
			field: 'created_by_user_name',
			headerName: t.common.createdBy,
			flex: 1,
			minWidth: 140,
			filterOperators: createDropdownFilterOperators(createdByOptions, t.common.all, undefined, t.filters.is),
			renderCell: (params: GridRenderCellParams<BuildingListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value || '—'}
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
						onClick: () => router.push(BUILDINGS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(BUILDINGS_EDIT(params.row.id)),
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
			<NavigationBar title={t.buildings.residencesList}>
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
								onClick={() => router.push(BUILDINGS_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
							{t.buildings.newResidence}
						</Button>
						{selectedIds.length > 0 && (
							<Button
								variant="outlined"
								color="error"
								onClick={() => setShowBulkDeleteModal(true)}
								startIcon={<DeleteIcon fontSize="small" />}
								sx={{ whiteSpace: 'nowrap' }}
							>
								{t.buildings.bulkDeleteResidences} ({selectedIds.length})
								</Button>
							)}
						</Box>

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
							title={t.buildings.deleteResidence}
							body={t.buildings.deleteResidenceConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
							title={t.buildings.bulkDeleteResidences}
							body={t.buildings.bulkDeleteResidencesConfirm(selectedIds.length)}
								actions={bulkDeleteModalActions}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default BuildingsListClient;
