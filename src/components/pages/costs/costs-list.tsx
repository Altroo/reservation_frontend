'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	CalendarMonth as CalendarMonthIcon,
	CalendarToday as CalendarTodayIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { CostType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { COSTS_ADD, COSTS_EDIT, COSTS_VIEW } from '@/utils/routes';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useBulkDeleteCostsMutation,
	useDeleteCostMutation,
	useGetBuildingsQuery,
	useGetCostsQuery,
	useGetCostYearsQuery,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { CostCategoryChipColor } from '@/utils/rawData';
import { COST_CATEGORY_CHIP_COLORS, costCategoryItemsList } from '@/utils/rawData';

const CostsListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;
	const [year, setYear] = useState(currentYear);
	const [month, setMonth] = useState<number | undefined>(currentMonth);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');

	const { data: costYears } = useGetCostYearsQuery(undefined, { skip: !token });
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });
	const { data: costs, isLoading } = useGetCostsQuery({ year, month }, { skip: !token });

	const yearItems: DropDownType[] = useMemo(
		() => (costYears?.years ?? [currentYear]).map((y) => ({ code: String(y), value: String(y) })),
		[costYears?.years, currentYear],
	);

	const monthItems: DropDownType[] = useMemo(
		() => [
			{ code: 'all', value: t.common.all },
			...t.rawData.monthNames.map((name: string, i: number) => ({ code: String(i + 1), value: name })),
		],
		[t],
	);

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(costs ?? []).forEach((c) => {
			if (c.created_by_user_name) nameMap.set(c.created_by_user_name, c.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [costs]);
	const buildingNameOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(costs ?? []).forEach((c) => {
			if (c.building_nom) nameMap.set(c.building_nom, c.building_nom);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [costs]);
	const [deleteCost] = useDeleteCostMutation();
	const [bulkDeleteCosts] = useBulkDeleteCostsMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	// Client-side filtering
	const filteredCosts = useMemo(() => {
		let result = costs ?? [];

		const categoryParam = chipFilterParams['category'];
		if (categoryParam) {
			const categories = categoryParam.split(',');
			result = result.filter((c) => categories.includes(c.category as string));
		}

		const buildingParam = chipFilterParams['building'];
		if (buildingParam) {
			const buildingIds = buildingParam.split(',');
			result = result.filter((c) => c.building !== null && buildingIds.includes(String(c.building)));
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(c) =>
					(c.description ?? '').toLowerCase().includes(term) ||
					(c.created_by_user_name ?? '').toLowerCase().includes(term) ||
					(c.building_nom ?? '').toLowerCase().includes(term),
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

		if (customFilterParams['building_nom']) {
			result = result.filter((c) => c.building_nom === customFilterParams['building_nom']);
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
			onSuccess(t.costs.costDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.costs.costDeleteError));
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

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteCosts({ ids: selectedIds }).unwrap();
			onSuccess(t.costs.bulkCostsDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.costs.bulkCostsDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const bulkDeleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: `${t.common.delete} (${selectedIds.length})`,
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'category',
				label: t.common.category,
				paramName: 'category',
				options: costCategoryItemsList.map((c) => ({ id: c.code, nom: c.value })),
			},
			{
				key: 'building',
				label: t.locaux.residence,
				paramName: 'building',
				options: (buildingsData ?? []).map((building) => ({ id: String(building.id), nom: building.nom })),
			},
		],
		[buildingsData, t.common.category, t.locaux.residence],
	);

	const columns: GridColDef[] = [
		{
			field: 'description',
			headerName: t.common.description,
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
			headerName: t.common.amount,
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
			headerName: t.common.date,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(t.filters.between),
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
			headerName: t.common.category,
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
			field: 'building_nom',
			headerName: t.locaux.residence,
			flex: 1,
			minWidth: 120,
			filterOperators: createDropdownFilterOperators(buildingNameOptions, t.locaux.allResidences, undefined, t.filters.is),
			renderCell: (params: GridRenderCellParams<CostType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{(params.value as string) ?? '—'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'created_by_user_name',
			headerName: t.common.createdBy,
			flex: 1,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(createdByOptions, t.filters.allUsers, undefined, t.filters.is),
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
						onClick: () => router.push(COSTS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(COSTS_EDIT(params.row.id)),
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
			sx={{
				mt: '48px',
				overflowX: 'auto',
				overflowY: 'hidden',
			}}
		>
			<NavigationBar title={t.costs.costsList}>
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
								{t.costs.newCost}
							</Button>
							<Box sx={{ minWidth: 160 }}>
								<CustomDropDownSelect
									id="month-filter"
									size="small"
									label={t.common.month}
									items={monthItems}
									value={month !== undefined ? t.rawData.monthNames[month - 1] : t.common.all}
									onChange={(e) => {
										const val = e.target.value;
										if (!val || val === t.common.all) setMonth(undefined);
										else {
											const idx = t.rawData.monthNames.indexOf(val);
											setMonth(idx >= 0 ? idx + 1 : undefined);
										}
										setPaginationModel((prev) => ({ ...prev, page: 0 }));
									}}
									theme={customDropdownTheme()}
									startIcon={<CalendarMonthIcon />}
								/>
							</Box>
							<Box sx={{ minWidth: 150 }}>
								<CustomDropDownSelect
									id="year-filter"
									size="small"
									label={t.common.year}
									items={yearItems}
									value={String(year)}
									onChange={(e) => {
										setYear(Number(e.target.value));
										setPaginationModel((prev) => ({ ...prev, page: 0 }));
									}}
									theme={customDropdownTheme()}
									startIcon={<CalendarTodayIcon />}
								/>
							</Box>
							{filteredCosts.length > 0 && (
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
										color: 'error.main',
										ml: 'auto',
									}}
								>
									Total : {totalAmount.toLocaleString('fr-MA')} MAD
								</Typography>
							)}{' '}
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
							)}{' '}
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
							checkboxSelection
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>

						{showDeleteModal && (
							<ActionModals title={t.costs.deleteCost} body={t.costs.deleteCostConfirm} actions={deleteModalActions} />
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.costs.bulkDeleteCosts(selectedIds.length)}
								body={t.costs.bulkDeleteCostsConfirm}
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

export default CostsListClient;
