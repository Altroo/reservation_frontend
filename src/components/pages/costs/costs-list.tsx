'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import type { SessionProps } from '@/types/_initTypes';
import type { CostType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { getDefaultTheme } from '@/utils/themes';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { COSTS_ADD, COSTS_EDIT, COSTS_VIEW } from '@/utils/routes';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import { useToast } from '@/utils/hooks';
import { useGetCostsQuery, useDeleteCostMutation } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { COST_CATEGORY_CHIP_COLORS } from '@/utils/rawData';
import type { CostCategoryChipColor } from '@/utils/rawData';

const CostsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	const { data: costs, isLoading } = useGetCostsQuery({ year }, { skip: !token });
	const [deleteCost] = useDeleteCostMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const totalAmount = (costs ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

	const deleteHandler = async () => {
		try {
			await deleteCost({ id: selectedId! }).unwrap();
			onSuccess('Coût supprimé avec succès');
		} catch (err) {
			onError(extractApiErrorMessage(err, 'Erreur lors de la suppression du coût'));
		} finally {
			setShowDeleteModal(false);
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

	const columns: GridColDef[] = [
		{
			field: 'description',
			headerName: 'Description',
			flex: 2,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'amount',
			headerName: 'Montant',
			flex: 0.8,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<Typography variant="body2" noWrap>
					{Number(params.value).toLocaleString('fr-MA')} MAD
				</Typography>
			),
		},
		{
			field: 'date',
			headerName: 'Date',
			flex: 0.9,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<Typography variant="body2" noWrap>
					{formatDate(params.value as string)}
				</Typography>
			),
		},
		{
			field: 'category',
			headerName: 'Catégorie',
			flex: 0.9,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<Chip
					label={params.value}
					size="small"
					color={(COST_CATEGORY_CHIP_COLORS[params.value as string] ?? 'default') as CostCategoryChipColor}
					variant="outlined"
				/>
			),
		},
		{
			field: 'created_by_user_name',
			headerName: 'Créé par',
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<Typography variant="body2" noWrap>
					{params.value ?? '—'}
				</Typography>
			),
		},
		{
			field: 'actions',
			headerName: 'Actions',
			flex: 0.6,
			minWidth: 60,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const actions = [
					{
						label: 'Voir',
						icon: <VisibilityIcon />,
						onClick: () => router.push(COSTS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: 'Modifier',
						icon: <EditIcon />,
						onClick: () => router.push(COSTS_EDIT(params.row.id)),
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

	const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px" sx={{ overflowX: 'auto' }}>
			<NavigationBar title="Coûts">
				<Protected permission="can_view">
					<>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							flexWrap="wrap"
							gap={2}
							sx={{ px: { xs: 1, sm: 2, md: 3 }, mt: { xs: 1, sm: 2, md: 3 }, mb: 1 }}
						>
							<Stack direction="row" spacing={2} alignItems="center">
								<Button
									variant="contained"
									onClick={() => router.push(COSTS_ADD)}
									startIcon={<AddIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap' }}
								>
									Nouveau coût
								</Button>
								<FormControl size="small" sx={{ minWidth: 120 }}>
									<InputLabel>Année</InputLabel>
									<Select
										value={year}
										label="Année"
										onChange={(e) => setYear(Number(e.target.value))}
									>
										{yearOptions.map((y) => (
											<MenuItem key={y} value={y}>
												{y}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Stack>
							{costs && costs.length > 0 && (
								<Typography variant="subtitle1" fontWeight={700} color="error.main">
									Total : {totalAmount.toLocaleString('fr-MA')} MAD
								</Typography>
							)}
						</Stack>

						<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, position: 'relative' }}>
							{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
							<ThemeProvider theme={getDefaultTheme()}>
								<DataGrid
									rows={costs ?? []}
									columns={columns}
									loading={isLoading}
									pageSizeOptions={[10, 25, 50]}
									initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
									localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
									disableRowSelectionOnClick
									sx={{
										'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
									}}
								/>
							</ThemeProvider>
						</Box>

						{showDeleteModal && (
							<ActionModals
								title="Supprimer le coût"
								body="Êtes-vous sûr de vouloir supprimer ce coût ? Cette action est irréversible."
								actions={deleteModalActions}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default CostsListClient;
