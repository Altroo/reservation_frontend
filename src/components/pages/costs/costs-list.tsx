'use client';

import React, { useMemo, useState } from 'react';
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
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
	GridColDef,
	GridFilterModel,
	GridLogicOperator,
	GridRenderCellParams,
} from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { CostType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { COSTS_ADD, COSTS_EDIT, COSTS_VIEW } from '@/utils/routes';
import { useToast } from '@/utils/hooks';
import { useGetCostsQuery, useDeleteCostMutation, useGetCostYearsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { COST_CATEGORY_CHIP_COLORS, costCategoryItemsList } from '@/utils/rawData';
import type { CostCategoryChipColor } from '@/utils/rawData';

const CostsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');

	const { data: costYears } = useGetCostYearsQuery(undefined, { skip: !token });
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const { data: costs, isLoading } = useGetCostsQuery({ year }, { skip: !token });

	const yearOptions = costYears?.years ?? [currentYear];

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(costs ?? []).forEach((c) => {
			if (c.created_by_user_name) nameMap.set(c.created_by_user_name, c.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [costs]);
	const [deleteCost] = useDeleteCostMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	// Client-side filtering
	const filteredCosts = useMemo(() => {
		let result = costs ?? [];

		const categoryParam = chipFilterParams['category'];
		if (categoryParam) {
			const categories = categoryParam.split(',');
			result = result.filter((c) => categories.includes(c.category as string));
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(c) =>
					(c.description ?? '').toLowerCase().includes(term) ||
					(c.created_by_user_name ?? '').toLowerCase().includes(term),
			);
		}

		// Numeric amount filters
		if (customFilterParams['amount'] !== undefined && customFilterParams['amount'] !== '') {
			const val = Number(customFilterParams['amount']);
			result = result.filter((c) => Number(c.amount) === val);
		}
		if (customFilterParams['amount__ne'] !== undefined && customFilterParams['amount__ne'] !== '') {
			const val = Number(customFilterParams['amount__ne']);
			result = result.filter((c) => Number(c.amount) !== val);
		}
		if (customFilterParams['amount__gt'] !== undefined && customFilterParams['amount__gt'] !== '') {
			const val = Number(customFilterParams['amount__gt']);
			result = result.filter((c) => Number(c.amount) > val);
		}
		if (customFilterParams['amount__gte'] !== undefined && customFilterParams['amount__gte'] !== '') {
			const val = Number(customFilterParams['amount__gte']);
			result = result.filter((c) => Number(c.amount) >= val);
		}
		if (customFilterParams['amount__lt'] !== undefined && customFilterParams['amount__lt'] !== '') {
			const val = Number(customFilterParams['amount__lt']);
			result = result.filter((c) => Number(c.amount) < val);
		}
		if (customFilterParams['amount__lte'] !== undefined && customFilterParams['amount__lte'] !== '') {
			const val = Number(customFilterParams['amount__lte']);
			result = result.filter((c) => Number(c.amount) <= val);
		}

		// Date range filters
		if (customFilterParams['date_after']) {
			const after = new Date(customFilterParams['date_after']);
			result = result.filter((c) => new Date(c.date as string) >= after);
		}
		if (customFilterParams['date_before']) {
			const before = new Date(customFilterParams['date_before']);
			result = result.filter((c) => new Date(c.date as string) <= before);
		}

		// Created by dropdown filter
		if (customFilterParams['created_by_user_name']) {
			result = result.filter((c) => c.created_by_user_name === customFilterParams['created_by_user_name']);
		}

		return result;
	}, [costs, chipFilterParams, searchTerm, customFilterParams]);

	// Client-side pagination
	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredCosts.length,
			results: filteredCosts.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredCosts, paginationModel]);

	const totalAmount = filteredCosts.reduce((sum, c) => sum + Number(c.amount), 0);

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

	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'category',
				label: 'Catégorie',
				paramName: 'category',
				options: costCategoryItemsList.map((c) => ({ id: c.code, nom: c.value })),
			},
		],
		[],
	);

	const columns: GridColDef[] = [
		{
			field: 'description',
			headerName: 'Description',
			flex: 1.4,
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
			flex: 0.9,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date',
			headerName: 'Date',
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'category',
			headerName: 'Catégorie',
			flex: 0.9,
			minWidth: 110,
			filterable: false,
			renderCell: (params: GridRenderCellParams<CostType>) => {
				const cat = params.value as string;
				return (
					<DarkTooltip title={cat}>
						<Chip
							label={cat}
							size="small"
							color={(COST_CATEGORY_CHIP_COLORS[cat] ?? 'default') as CostCategoryChipColor}
							variant="outlined"
						/>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'created_by_user_name',
			headerName: 'Créé par',
			flex: 1,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(createdByOptions, 'Tous les utilisateurs'),
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value ?? '—'}
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

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			mt="48px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title="Coûts">
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
								onClick={() => router.push(COSTS_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								Nouveau coût
							</Button>
							<FormControl size="small" sx={{ minWidth: 120 }}>
								<InputLabel>Année</InputLabel>
								<Select
									value={year}
									label="Année"
									onChange={(e) => {
										setYear(Number(e.target.value));
										setPaginationModel((prev) => ({ ...prev, page: 0 }));
									}}
								>
									{yearOptions.map((y) => (
										<MenuItem key={y} value={y}>
											{y}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							{filteredCosts.length > 0 && (
								<Typography variant="subtitle1" fontWeight={700} color="error.main" sx={{ ml: 'auto' }}>
									Total : {totalAmount.toLocaleString('fr-MA')} MAD
								</Typography>
							)}
						</Box>

						<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={1} />

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
						/>

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
