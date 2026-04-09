'use client';

import React, { useMemo, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	IconButton,
	Stack,
	Tooltip as MuiTooltip,
	Typography,
} from '@mui/material';
import {
	Apartment as ApartmentIcon,
	AttachMoney as MoneyIcon,
	CalendarMonth as CalendarIcon,
	CalendarToday as CalendarTodayIcon,
	EmojiEvents as TrophyIcon,
	Hotel as HotelIcon,
	InfoOutlined as InfoIcon,
	Savings as SavingsIcon,
	TrendingDown as TrendingDownIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
	useGetBuildingsQuery,
	useGetDashboardStatsQuery,
	useGetReservationYearsQuery,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import { APARTMENT_COLORS, CHART_COLORS, CHART_OPTS, SOURCE_COLORS } from '@/utils/rawData';
import { formatNumberMA as fmt } from '@/utils/helpers';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend,
	Filler,
);

/* ── KPI Card with left accent bar ─────────────────────────────────────────── */
interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	color: string;
	tooltip?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color, tooltip }) => (
	<Card
		elevation={2}
		sx={{
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 4,
				height: '100%',
				bgcolor: color,
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
			<Stack
				direction="row"
				sx={{
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<Stack
					direction="row"
					spacing={1.5}
					sx={{
						alignItems: 'center',
						mb: 0.5,
					}}
				>
					<Box sx={{ color, display: 'flex' }}>{icon}</Box>
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
							textTransform: 'uppercase',
							letterSpacing: 0.8,
						}}
					>
						{label}
					</Typography>
				</Stack>
				{tooltip && (
					<MuiTooltip title={tooltip} arrow placement="top">
						<IconButton size="small" sx={{ color: 'text.secondary', mt: -0.5 }}>
							<InfoIcon fontSize="small" />
						</IconButton>
					</MuiTooltip>
				)}
			</Stack>
			<Typography
				variant="h5"
				sx={{
					fontWeight: 700,
				}}
			>
				{value}
			</Typography>
			{sub && (
				<Typography
					variant="body2"
					sx={{
						color: 'text.secondary',
					}}
				>
					{sub}
				</Typography>
			)}
		</CardContent>
	</Card>
);

/* ── Chart wrapper ─────────────────────────────────────────────────────────── */
interface ChartCardProps {
	title: string;
	subheader?: string;
	infoTooltip?: string;
	children: React.ReactNode;
	height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subheader, infoTooltip, children, height = 300 }) => (
	<Card elevation={2} sx={{ overflow: 'hidden' }}>
		<CardHeader
			title={
				<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
					{title}
				</Typography>
			}
			subheader={
				subheader && (
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
						}}
					>
						{subheader}
					</Typography>
				)
			}
			action={
				infoTooltip ? (
					<MuiTooltip title={infoTooltip} arrow placement="top">
						<IconButton size="small" sx={{ color: 'text.secondary' }}>
							<InfoIcon fontSize="small" />
						</IconButton>
					</MuiTooltip>
				) : undefined
			}
			sx={{ pb: 0 }}
		/>
		<CardContent>
			<Box sx={{ height }}>{children}</Box>
		</CardContent>
	</Card>
);

const EmptyChart: React.FC<{ message?: string }> = ({ message }) => {
	const { t } = useLanguage();
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
				bgcolor: 'grey.50',
				borderRadius: 2,
				border: '1px dashed',
				borderColor: 'grey.300',
			}}
		>
			<Typography
				variant="h6"
				gutterBottom
				sx={{
					color: 'text.secondary',
				}}
			>
				📊
			</Typography>
			<Typography
				variant="body2"
				sx={{
					color: 'text.secondary',
					textAlign: 'center',
				}}
			>
				{message ?? t.analytics.noDataAvailable}
			</Typography>
		</Box>
	);
};

const ReservationDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState<number>(() => new Date().getFullYear());
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data, isLoading } = useGetDashboardStatsQuery(
		{ year, ...(buildingId ? { building: buildingId } : {}) },
		{ skip: !token },
	);
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const buildingItems: DropDownType[] = useMemo(
		() => [
			{ code: t.locaux.allResidences, value: t.locaux.allResidences },
			...(buildingsData ?? []).map((b) => ({ code: b.nom, value: b.nom })),
		],
		[buildingsData, t],
	);

	const yearItems: DropDownType[] = useMemo(
		() => (yearsData?.years ?? [currentYear]).map((y) => ({ code: String(y), value: String(y) })),
		[yearsData?.years, currentYear],
	);

	const totalRevenue = data?.total_revenue ?? 0;
	const annualCosts = data?.annual_costs ?? 0;
	const netProfit = data?.net_profit ?? 0;
	const monthlyRevenue = data?.monthly_revenue ?? [];
	const bySource = data?.by_source ?? [];
	const byApartment = data?.by_apartment ?? [];
	const occupancy = data?.occupancy_by_apartment ?? {};

	const totalReservations = bySource.reduce((s, x) => s + x.count, 0);
	const totalOccupied = Object.values(occupancy).reduce((s, a) => s + a.occupied_days, 0);
	const aptCount = Object.keys(occupancy).length;
	const daysInYear = year % 4 === 0 ? 366 : 365;
	const globalOccupancy = aptCount > 0 ? ((totalOccupied / (aptCount * daysInYear)) * 100).toFixed(1) : '0.0';

	const bestMonthIdx =
		monthlyRevenue.length > 0
			? monthlyRevenue.reduce((bIdx, m, i, arr) => (m.total > arr[bIdx].total ? i : bIdx), 0)
			: -1;
	const bestMonthHasRevenue = bestMonthIdx >= 0 && monthlyRevenue[bestMonthIdx].total > 0;
	const bestMonthName = bestMonthHasRevenue ? t.rawData.monthLabels[bestMonthIdx] : '—';
	const bestMonthRevenue = bestMonthHasRevenue ? monthlyRevenue[bestMonthIdx].total : 0;

	// Monthly revenue bar chart
	const monthlyChartData = {
		labels: t.rawData.monthLabels,
		datasets: [
			{
				label: t.analytics.revenueChartLabel,
				data: monthlyRevenue.map((m) => m.total),
				backgroundColor: CHART_COLORS.primaryLight,
				borderColor: CHART_COLORS.primary,
				borderWidth: 2,
				borderRadius: 4,
			},
		],
	};

	// Revenue by source doughnut
	const sourceChartData = {
		labels: bySource.map((s) => s.source),
		datasets: [
			{
				data: bySource.map((s) => s.total),
				backgroundColor: bySource.map((s) => SOURCE_COLORS[s.source] ?? 'rgba(100,100,100,0.7)'),
				borderWidth: 1,
			},
		],
	};

	// Revenue by apartment bar
	const aptChartData = {
		labels: byApartment.map((a) => a.nom),
		datasets: [
			{
				label: t.analytics.revenueChartLabel,
				data: byApartment.map((a) => a.total),
				backgroundColor: byApartment.map((_, i) => APARTMENT_COLORS[i % APARTMENT_COLORS.length]),
				borderRadius: 4,
			},
		],
	};

	// Monthly trend line chart (replaces sparse daily data)
	const monthlyTrendData = {
		labels: t.rawData.monthLabels,
		datasets: [
			{
				data: monthlyRevenue.map((m) => m.total),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.4,
				pointRadius: 4,
				borderWidth: 2,
				fill: true,
			},
		],
	};

	// Occupancy days bar
	const occupancyChartData = {
		labels: Object.keys(occupancy),
		datasets: [
			{
				label: t.analytics.occupiedDaysChartLabel,
				data: Object.values(occupancy).map((a) => a.occupied_days),
				backgroundColor: Object.keys(occupancy).map((_, i) => APARTMENT_COLORS[i % APARTMENT_COLORS.length]),
				borderRadius: 4,
			},
		],
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
			<NavigationBar title={t.common.dashboard}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4, pt: '10px' }}>
						{/* Year & Building selectors */}
						<Stack
							direction="row"
							sx={{
								justifyContent: 'space-between',
								alignItems: 'center',
								mb: 3,
								flexWrap: 'wrap',
								gap: 2,
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 600,
								}}
							>
								{t.analytics.overviewYear(year)}
							</Typography>
							<Stack direction="row" spacing={2}>
								<Box sx={{ minWidth: 180 }}>
									<CustomDropDownSelect
										id="building-filter"
										size="small"
										label={t.reservations.residence}
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
								{/* ── KPI Row ─────────────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
										gap: 2,
									}}
								>
									<KpiCard
										icon={<MoneyIcon fontSize="small" />}
										label={t.analytics.totalRevenue}
										value={`${fmt(totalRevenue)} MAD`}
										color="#1976d2"
										tooltip={t.analytics.totalRevenueTooltip}
									/>
									<KpiCard
										icon={<CalendarIcon fontSize="small" />}
										label={t.analytics.reservationCount}
										value={totalReservations.toString()}
										color="#ed6c02"
										tooltip={t.analytics.reservationCountTooltip}
									/>
									<KpiCard
										icon={<HotelIcon fontSize="small" />}
										label={t.analytics.occupation}
										value={`${globalOccupancy}%`}
										sub={t.analytics.nightsOccupied(totalOccupied)}
										color="#2e7d32"
										tooltip={t.analytics.occupationTooltip}
									/>
									<KpiCard
										icon={<TrendingUpIcon fontSize="small" />}
										label={t.analytics.avgRevenuePerRes}
										value={totalReservations > 0 ? `${fmt(Math.round(totalRevenue / totalReservations))} MAD` : '—'}
										color="#9c27b0"
										tooltip={t.analytics.avgRevenueTooltip}
									/>
									<KpiCard
										icon={<TrophyIcon fontSize="small" />}
										label={t.analytics.bestMonth}
										value={bestMonthName}
										sub={bestMonthRevenue > 0 ? `${fmt(bestMonthRevenue)} MAD` : undefined}
										color="#f57c00"
										tooltip={t.analytics.bestMonthTooltip}
									/>
								</Box>

								{/* ── Cost KPIs ───────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
										gap: 2,
									}}
								>
									<KpiCard
										icon={<TrendingDownIcon fontSize="small" />}
										label={t.analytics.annualCosts}
										value={`${fmt(annualCosts)} MAD`}
										color="#d32f2f"
										tooltip={t.analytics.annualCostsTooltip}
									/>
									<KpiCard
										icon={<SavingsIcon fontSize="small" />}
										label={t.analytics.netProfit}
										value={`${fmt(netProfit)} MAD`}
										color={netProfit >= 0 ? '#2e7d32' : '#d32f2f'}
										tooltip={t.analytics.netProfitTooltip}
									/>
								</Box>

								{/* ── Monthly Revenue Bar ────────────────── */}
								<ChartCard
									title={t.analytics.monthlyRevenue}
									subheader={t.analytics.monthlyRevenueSubheader(year)}
									infoTooltip={t.analytics.monthlyRevenueTooltip}
									height={280}
								>
									{monthlyRevenue.some((m) => m.total > 0) ? (
										<Bar data={monthlyChartData} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} />
									) : (
										<EmptyChart />
									)}
								</ChartCard>

								{/* ── Monthly Trend Line ────────────────── */}
								<ChartCard
									title={t.analytics.monthlyTrend}
									subheader={t.analytics.monthlyTrendSubheader}
									infoTooltip={t.analytics.monthlyTrendTooltip}
									height={280}
								>
									{monthlyRevenue.some((m) => m.total > 0) ? (
										<Line
											data={monthlyTrendData}
											options={{
												...CHART_OPTS,
												plugins: { legend: { display: false } },
												scales: {
													x: { ticks: { font: { size: 10 } } },
													y: { beginAtZero: true },
												},
											}}
										/>
									) : (
										<EmptyChart />
									)}
								</ChartCard>

								{/* ── Source Doughnut + Apartment Bar ──────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
										gap: 2,
									}}
								>
									<ChartCard
										title={t.analytics.sourceDistribution}
										subheader={t.analytics.sourceDistributionSubheader}
										infoTooltip={t.analytics.sourceDistributionTooltip}
										height={280}
									>
										{bySource.length > 0 ? (
											<Doughnut data={sourceChartData} options={{ ...CHART_OPTS, cutout: '55%' }} />
										) : (
											<EmptyChart />
										)}
									</ChartCard>

									<ChartCard
										title={t.analytics.revenueByApartment}
										subheader={t.analytics.revenueByApartmentSubheader}
										infoTooltip={t.analytics.revenueByApartmentTooltip}
										height={280}
									>
										{byApartment.length > 0 ? (
											<Bar data={aptChartData} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} />
										) : (
											<EmptyChart />
										)}
									</ChartCard>
								</Box>

								{/* ── Occupancy Bar ───────────────────────── */}
								<ChartCard
									title={t.analytics.occupancyByApartment}
									subheader={t.analytics.occupancyByApartmentSubheader}
									infoTooltip={t.analytics.occupancyByApartmentTooltip}
									height={260}
								>
									{Object.values(occupancy).some((a) => a.occupied_days > 0) ? (
										<Bar
											data={occupancyChartData}
											options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }}
										/>
									) : (
										<EmptyChart />
									)}
								</ChartCard>

								{/* ── Source breakdown cards ───────────────── */}
								{bySource.length > 0 && (
									<Card elevation={2}>
										<CardHeader
											title={
												<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
													{t.analytics.paymentSourceDetail}
												</Typography>
											}
										/>
										<CardContent>
											<Box
												sx={{
													display: 'grid',
													gridTemplateColumns: {
														xs: '1fr',
														sm: 'repeat(2, 1fr)',
														md: `repeat(${Math.min(bySource.length, 4)}, 1fr)`,
													},
													gap: 2,
												}}
											>
												{bySource.map((src) => (
													<Box
														key={src.source}
														sx={{
															p: 2,
															border: '1px solid',
															borderColor: 'divider',
															borderRadius: 2,
															borderLeft: 4,
															borderLeftColor: SOURCE_COLORS[src.source] ?? 'grey.400',
														}}
													>
														<Stack
															direction="row"
															sx={{
																justifyContent: 'space-between',
																alignItems: 'center',
															}}
														>
															<Typography
																variant="subtitle2"
																sx={{
																	fontWeight: 600,
																}}
															>
																{src.source}
															</Typography>
															<Chip label={`${src.count} ${t.analytics.res}`} size="small" />
														</Stack>
														<Typography
															variant="h6"
															color="primary"
															sx={{
																mt: 1,
															}}
														>
															{fmt(src.total)} MAD
														</Typography>
													</Box>
												))}
											</Box>
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

export default ReservationDashboardClient;
