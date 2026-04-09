'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip as MuiTooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	CalendarMonth as CalendarMonthIcon,
	CalendarToday as CalendarTodayIcon,
	CheckCircleOutlined as CheckCircleOutlineIcon,
	HighlightOff as HighlightOffIcon,
	InfoOutlined as InfoOutlinedIcon,
	RemoveCircleOutlined as EmptyIcon,
} from '@mui/icons-material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import type { SessionProps } from '@/types/_initTypes';
import type { PlanningLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { LOCAUX_VIEW } from '@/utils/routes';
import {
	useGetBuildingsQuery,
	useGetLocalPlanningQuery,
	useGetLocalYearsQuery,
	useToggleLoyerPaidMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useLanguage } from '@/utils/hooks';
import { LOCAL_TYPE_LABEL_KEYS } from '@/utils/rawData';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface KpiCardProps {
	color: string;
	icon: React.ReactNode;
	label: string;
	value: string;
	tooltip?: string;
}

function KpiCard({ color, icon, label, value, tooltip }: KpiCardProps) {
	return (
		<Card
			elevation={1}
			sx={{
				position: 'relative',
				overflow: 'visible',
				'&::before': {
					content: '""',
					position: 'absolute',
					left: 0,
					top: 0,
					bottom: 0,
					width: 4,
					bgcolor: color,
					borderRadius: '4px 0 0 4px',
				},
			}}
		>
			<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
				<Stack
					direction="row"
					sx={{
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Stack
						direction="row"
						spacing={1.5}
						sx={{
							alignItems: 'center',
						}}
					>
						<Box sx={{ color }}>{icon}</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: 'text.secondary',
									textTransform: 'uppercase',
									letterSpacing: 0.5,
								}}
							>
								{label}
							</Typography>
							<Typography
								variant="h6"
								sx={{
									fontWeight: 700,
								}}
							>
								{value}
							</Typography>
						</Box>
					</Stack>
					{tooltip && (
						<MuiTooltip title={tooltip} arrow>
							<IconButton size="small">
								<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
							</IconButton>
						</MuiTooltip>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}

const LocauxPlanningClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data: yearsData } = useGetLocalYearsQuery(undefined, { skip: !token });
	const availableYears = useMemo(() => {
		const yrs = yearsData?.years ?? [];
		if (!yrs.includes(currentYear)) return [...yrs, currentYear].sort((a, b) => b - a);
		return [...yrs].sort((a, b) => b - a);
	}, [yearsData, currentYear]);

	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const buildingItems: DropDownType[] = useMemo(
		() => [
			{ code: t.locaux.allResidences, value: t.locaux.allResidences },
			...(buildingsData ?? []).map((b) => ({ code: b.nom, value: b.nom })),
		],
		[buildingsData, t],
	);

	const yearItems: DropDownType[] = useMemo(
		() => availableYears.map((y) => ({ code: String(y), value: String(y) })),
		[availableYears],
	);

	const { data: planningData, isLoading } = useGetLocalPlanningQuery(
		{ year, ...(buildingId ? { building: buildingId } : {}) },
		{ skip: !token },
	);
	const locaux = useMemo(() => (planningData?.locaux ?? []) as PlanningLocalType[], [planningData]);
	const [toggleLoyerPaid] = useToggleLoyerPaidMutation();

	const handleTogglePaid = async (id: number, currentPaye: boolean) => {
		await toggleLoyerPaid({ id, paye: !currentPaye });
	};

	// Compute KPI stats
	const stats = useMemo(() => {
		let totalPaid = 0;
		let totalUnpaid = 0;
		let paidCount = 0;
		let unpaidCount = 0;
		locaux.forEach((local) => {
			for (let m = 1; m <= 12; m++) {
				const data = local.months[m];
				if (!data) continue;
				if (data.paye) {
					totalPaid += Number(data.montant);
					paidCount++;
				} else {
					totalUnpaid += Number(data.montant);
					unpaidCount++;
				}
			}
		});
		return { totalPaid, totalUnpaid, paidCount, unpaidCount };
	}, [locaux]);

	const renderMonthChip = (local: PlanningLocalType, month: number) => {
		const data = local.months[month];
		if (!data) {
			return (
				<MuiTooltip title={t.locaux.noRentRegistered} arrow>
					<EmptyIcon fontSize="small" sx={{ color: 'grey.400' }} />
				</MuiTooltip>
			);
		}
		return (
			<MuiTooltip
				title={t.locaux.clickPaidUnpaidTooltip(
					Number(data.montant).toLocaleString('fr-MA'),
					data.paye ? t.locaux.markUnpaid : t.locaux.markPaid,
				)}
				arrow
			>
				<Chip
					icon={data.paye ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
					label={data.paye ? t.common.paid : t.common.unpaid}
					color={data.paye ? 'success' : 'error'}
					size="small"
					variant="outlined"
					onClick={() => handleTogglePaid(data.id, data.paye)}
					sx={{ cursor: 'pointer', fontWeight: 600, minWidth: 42 }}
				/>
			</MuiTooltip>
		);
	};

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '48px',
			}}
		>
			<NavigationBar title={t.locaux.rentPlanning}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack
							direction="row"
							sx={{
								justifyContent: 'space-between',
								alignItems: 'center',
								py: 2,
								flexWrap: 'wrap',
								gap: 1,
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 600,
								}}
							>
								{t.locaux.rentPlanningYear(year)}
							</Typography>
							<Stack direction="row" spacing={2}>
								<Box sx={{ minWidth: 180 }}>
									<CustomDropDownSelect
										id="building-filter"
										size="small"
										label={t.locaux.residence}
										items={buildingItems}
										value={
											buildingId === ''
												? t.locaux.allResidences
												: ((buildingsData ?? []).find((b) => b.id === buildingId)?.nom ?? t.locaux.allResidences)
										}
										onChange={(e) => {
											const name = e.target.value;
											if (!name || name === t.locaux.allResidences) setBuildingId('');
											else {
												const b = (buildingsData ?? []).find((x) => x.nom === name);
												setBuildingId(b ? b.id : '');
											}
										}}
										theme={customDropdownTheme()}
										startIcon={<ApartmentIcon />}
									/>
								</Box>
								<Box sx={{ minWidth: 150 }}>
									<CustomDropDownSelect
										id="year-filter"
										size="small"
										label={t.common.year}
										items={yearItems}
										value={String(year)}
										onChange={(e) => setYear(Number(e.target.value))}
										theme={customDropdownTheme()}
										startIcon={<CalendarTodayIcon />}
									/>
								</Box>
							</Stack>
						</Stack>

						{isLoading ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									py: 8,
								}}
							>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								{/* KPI cards */}
								<Box
									sx={{
										display: 'grid',
										gap: 2,
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
									}}
								>
									<KpiCard
										color="#1565c0"
										icon={<CalendarMonthIcon />}
										label={t.locaux.locauxCount}
										value={`${locaux.length}`}
										tooltip={t.locaux.locauxCountTooltip}
									/>
									<KpiCard
										color="#2e7d32"
										icon={<CheckCircleOutlineIcon />}
										label={t.locaux.paidRentsCount}
										value={`${stats.totalPaid.toLocaleString('fr-MA')} MAD`}
										tooltip={t.locaux.paidRentsTooltip(stats.paidCount, year)}
									/>
									<KpiCard
										color="#d32f2f"
										icon={<HighlightOffIcon />}
										label={t.locaux.unpaidRentsCount}
										value={`${stats.totalUnpaid.toLocaleString('fr-MA')} MAD`}
										tooltip={t.locaux.unpaidRentsTooltip(stats.unpaidCount, year)}
									/>
									<KpiCard
										color="#6a1b9a"
										icon={<CalendarMonthIcon />}
										label={t.locaux.paymentRate}
										value={
											stats.paidCount + stats.unpaidCount > 0
												? `${Math.round((stats.paidCount / (stats.paidCount + stats.unpaidCount)) * 100)}%`
												: '—'
										}
										tooltip={t.locaux.paymentRateTooltip}
									/>
								</Box>

								{locaux.length === 0 ? (
									<Card elevation={2}>
										<CardContent sx={{ py: 6, textAlign: 'center' }}>
											<CalendarMonthIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
											<Typography
												sx={{
													color: 'text.secondary',
												}}
											>
												{t.locaux.noLocauxRegistered}
											</Typography>
										</CardContent>
									</Card>
								) : (
									<Card elevation={2}>
										<CardHeader
											title={t.locaux.rentDetailByLocal}
											subheader={t.locaux.monthlyPaymentStatus(year)}
											action={
												<MuiTooltip title={t.locaux.clickToChangeStatus} arrow>
													<IconButton size="small">
														<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
													</IconButton>
												</MuiTooltip>
											}
										/>
										<CardContent sx={{ p: 0 }}>
											{isMobile ? (
												<Stack spacing={1.5} sx={{ p: 2 }}>
													{locaux.map((local) => (
														<Card key={local.id} elevation={1} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
															<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
																<Stack
																	direction="row"
																	onClick={() => router.push(LOCAUX_VIEW(local.id))}
																	sx={{
																		justifyContent: 'space-between',
																		alignItems: 'center',
																		mb: 1,
																		cursor: 'pointer',
																	}}
																>
																	<Box>
																		<Typography
																			variant="body2"
																			sx={{
																				fontWeight: 600,
																			}}
																		>
																			{local.nom}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'text.secondary',
																			}}
																		>
																			{t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[local.type_local]]} —{' '}
																			{local.en_location ? local.locataire_nom || t.locaux.inRental : t.common.free}
																		</Typography>
																	</Box>
																</Stack>
																<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
																	{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
																		<Stack
																			key={month}
																			spacing={0.25}
																			sx={{
																				alignItems: 'center',
																			}}
																		>
																			<Typography
																				variant="caption"
																				sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}
																			>
																				{t.rawData.monthLabels[month - 1]}
																			</Typography>
																			{renderMonthChip(local, month)}
																		</Stack>
																	))}
																</Box>
															</CardContent>
														</Card>
													))}
												</Stack>
											) : (
												<TableContainer component={Paper} elevation={0}>
													<Table size="small" sx={{ minWidth: 900 }}>
														<TableHead>
															<TableRow sx={{ bgcolor: 'primary.main' }}>
																<TableCell
																	sx={{
																		color: 'white',
																		fontWeight: 700,
																		minWidth: 180,
																		position: 'sticky',
																		left: 0,
																		zIndex: 3,
																		bgcolor: 'primary.main',
																	}}
																>
																	{t.locaux.local}
																</TableCell>
																{t.rawData.monthLabels.map((m, i) => (
																	<TableCell
																		key={i}
																		align="center"
																		sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}
																	>
																		{m}
																	</TableCell>
																))}
															</TableRow>
														</TableHead>
														<TableBody>
															{locaux.map((local, rowIdx) => (
																<TableRow
																	key={local.id}
																	sx={{ bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover' }}
																>
																	<TableCell
																		sx={{
																			fontWeight: 600,
																			position: 'sticky',
																			left: 0,
																			zIndex: 1,
																			bgcolor: 'inherit',
																			cursor: 'pointer',
																			'&:hover': { color: 'primary.main' },
																		}}
																		onClick={() => router.push(LOCAUX_VIEW(local.id))}
																	>
																		<Stack>
																			<Typography
																				variant="body2"
																				noWrap
																				sx={{
																					fontWeight: 600,
																				}}
																			>
																				{local.nom}
																			</Typography>
																			<Typography
																				variant="caption"
																				noWrap
																				sx={{
																					color: 'text.secondary',
																				}}
																			>
																				{t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[local.type_local]]} —{' '}
																				{local.en_location ? local.locataire_nom || t.locaux.inRental : t.common.free}
																			</Typography>
																		</Stack>
																	</TableCell>
																	{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
																		<TableCell key={month} align="center" sx={{ px: 0.5 }}>
																			{renderMonthChip(local, month)}
																		</TableCell>
																	))}
																</TableRow>
															))}
														</TableBody>
													</Table>
												</TableContainer>
											)}
										</CardContent>
									</Card>
								)}
							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default LocauxPlanningClient;
