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
import { useToast } from '@/utils/hooks';
import {
	useGetBuildingsQuery,
	useDeleteBuildingMutation,
	useBulkDeleteBuildingsMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';

const BuildingsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});

	const { data: buildingsRaw, isLoading } = useGetBuildingsQuery(undefined, { skip: !token });
	const buildings = useMemo(() => (Array.isArray(buildingsRaw) ? buildingsRaw : []) as BuildingListType[], [buildingsRaw]);

	const [deleteBuilding] = useDeleteBuildingMutation();
	const [bulkDeleteBuildings] = useBulkDeleteBuildingsMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const filteredBuildings = useMemo(() => {
		let result = buildings;

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter((b) => b.nom.toLowerCase().includes(term));
		}

		return result;
	}, [buildings, searchTerm]);

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
			onSuccess('Résidence supprimée avec succès');
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression de la résidence'));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteBuildings({ ids: selectedIds }).unwrap();
			onSuccess('Résidences supprimées avec succès');
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression des résidences'));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: 'Annuler',
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: 'Supprimer',
			active: true,
			onClick: deleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
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
			text: 'Supprimer',
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const columns: GridColDef[] = [
		{
			field: 'nom',
			headerName: 'Nom',
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
			headerName: 'Date de création',
			flex: 1,
			minWidth: 140,
			renderCell: (params: GridRenderCellParams<BuildingListType>) => (
				<Typography variant="body2" noWrap>
					{formatDate(params.value)}
				</Typography>
			),
		},
		{
			field: 'created_by_user_name',
			headerName: 'Créé par',
			flex: 1,
			minWidth: 140,
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
						onClick: () => router.push(BUILDINGS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: 'Modifier',
						icon: <EditIcon />,
						onClick: () => router.push(BUILDINGS_EDIT(params.row.id)),
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
			<NavigationBar title="Gestion des Résidences">
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
								Nouvelle résidence
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
							checkboxSelection
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>

						{showDeleteModal && (
							<ActionModals
								title="Supprimer la résidence"
								body="Êtes-vous sûr de vouloir supprimer cette résidence ? Cette action est irréversible."
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title="Supprimer les résidences"
								body={`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} résidences ? Les résidences avec des appartements ou locaux seront ignorées.`}
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
