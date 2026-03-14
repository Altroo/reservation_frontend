'use client';

import React, { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Typography,
	CircularProgress,
	Stack,
	Chip,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	IconButton,
	Tooltip as MuiTooltip,
} from '@mui/material';
import {
	Hotel as HotelIcon,
	AttachMoney as MoneyIcon,
	CalendarMonth as CalendarIcon,
	TrendingUp as TrendingUpIcon,
	EmojiEvents as TrophyIcon,
	InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	LineElement,
	PointElement,
	Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useGetDashboardStatsQuery, useGetReservationYearsQuery } from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import { MONTH_LABELS, CHART_COLORS, SOURCE_COLORS, APARTMENT_COLORS } from '@/utils/rawData';
import type { DailyRevenueType } from '@/types/reservationTypes';

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

const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;
const fmt = (val: number) => val.toLocaleString('fr-MA');

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
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
				<Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
					<Box sx={{ color, display: 'flex' }}>{icon}</Box>
					<Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
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
			<Typography variant="h5" fontWeight={700}>
				{value}
			</Typography>
			{sub && (
				<Typography variant="body2" color="text.secondary">
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
			title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>{title}</Typography>}
			subheader={subheader && <Typography variant="caption" color="text.secondary">{subheader}</Typography>}
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

const EmptyChart: React.FC<{ message?: string }> = ({ message }) => (
	<Box
		display="flex"
		flexDirection="column"
		justifyContent="center"
		alignItems="center"
		height="100%"
		sx={{ bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}
	>
		<Typography variant="h6" color="text.secondary" gutterBottom>
			📊
		</Typography>
		<Typography variant="body2" color="text.secondary" textAlign="center">
			{message ?? 'Aucune donnée disponible'}
		</Typography>
	</Box>
);

const ReservationDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const token = getAccessTokenFromSession(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState<number>(currentYear);

	const { data, isLoading } = useGetDashboardStatsQuery({ year }, { skip: !token });
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });

	const yearOptions = yearsData?.years ?? [currentYear];

	const totalRevenue = data?.total_revenue ?? 0;
	const monthlyRevenue = data?.monthly_revenue ?? [];
	const bySource = data?.by_source ?? [];
	const byApartment = data?.by_apartment ?? [];
	const occupancy = data?.occupancy_by_apartment ?? {};
	const dailyRevenue: DailyRevenueType[] = data?.daily_revenue ?? [];

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
	const bestMonthName = bestMonthHasRevenue ? MONTH_LABELS[bestMonthIdx] : '—';
	const bestMonthRevenue = bestMonthHasRevenue ? monthlyRevenue[bestMonthIdx].total : 0;

	// Monthly revenue bar chart
	const monthlyChartData = {
		labels: MONTH_LABELS,
		datasets: [
			{
				label: 'Revenus (MAD)',
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
		labels: byApartment.map((a) => a.code),
		datasets: [
			{
				label: 'Revenus (MAD)',
				data: byApartment.map((a) => a.total),
				backgroundColor: byApartment.map((_, i) => APARTMENT_COLORS[i % APARTMENT_COLORS.length]),
				borderRadius: 4,
			},
		],
	};

	// Daily revenue line chart
	const dailyChartData = {
		labels: dailyRevenue.map((d) => d.date.slice(5)),
		datasets: [
			{
				data: dailyRevenue.map((d) => d.total),
				borderColor: CHART_COLORS.primary,
				backgroundColor: CHART_COLORS.primaryLight,
				tension: 0.3,
				pointRadius: 0,
				borderWidth: 1.5,
				fill: true,
			},
		],
	};

	// Occupancy days bar
	const occupancyChartData = {
		labels: Object.keys(occupancy),
		datasets: [
			{
				label: 'Jours occupés',
				data: Object.values(occupancy).map((a) => a.occupied_days),
				backgroundColor: Object.keys(occupancy).map((_, i) => APARTMENT_COLORS[i % APARTMENT_COLORS.length]),
				borderRadius: 4,
			},
		],
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Tableau de bord">
				<Protected>
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						{/* Year selector */}
						<Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
							<Typography variant="h5" fontWeight={600}>
								Vue d&apos;ensemble {year}
							</Typography>
							<FormControl size="small" sx={{ minWidth: 120 }}>
								<InputLabel>Année</InputLabel>
								<Select value={year} label="Année" onChange={(e) => setYear(Number(e.target.value))}>
									{yearOptions.map((y) => (
										<MenuItem key={y} value={y}>
											{y}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>

						{isLoading ? (
							<Box display="flex" justifyContent="center" py={8}>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								{/* ── KPI Row ─────────────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
										gap: 2,
									}}
								>
									<KpiCard
										icon={<MoneyIcon fontSize="small" />}
										label="Revenus totaux"
										value={`${fmt(totalRevenue)} MAD`}
										color="#1976d2"
										tooltip="Chiffre d'affaires total de l'année sélectionnée"
									/>
									<KpiCard
										icon={<CalendarIcon fontSize="small" />}
										label="Réservations"
										value={totalReservations.toString()}
										color="#ed6c02"
										tooltip="Nombre total de réservations enregistrées"
									/>
									<KpiCard
										icon={<HotelIcon fontSize="small" />}
										label="Occupation"
										value={`${globalOccupancy}%`}
										sub={`${totalOccupied} nuits occupées`}
										color="#2e7d32"
										tooltip="Taux d'occupation global de tous les appartements"
									/>
									<KpiCard
										icon={<TrendingUpIcon fontSize="small" />}
										label="Revenu moy. / rés."
										value={
											totalReservations > 0
												? `${fmt(Math.round(totalRevenue / totalReservations))} MAD`
												: '—'
										}
										color="#9c27b0"
										tooltip="Montant moyen par réservation"
									/>
									<KpiCard
										icon={<TrophyIcon fontSize="small" />}
										label="Meilleur mois"
										value={bestMonthName}
										sub={bestMonthRevenue > 0 ? `${fmt(bestMonthRevenue)} MAD` : undefined}
										color="#f57c00"
										tooltip="Mois avec le plus haut chiffre d'affaires"
									/>
								</Box>

								{/* ── Monthly Revenue Bar ────────────────── */}
								<ChartCard
									title="Revenus mensuels"
									subheader={`Évolution des revenus sur l'année ${year}`}
									infoTooltip="Total des montants encaissés par mois"
									height={280}
								>
									<Bar data={monthlyChartData} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} />
								</ChartCard>

								{/* ── Daily Revenue Line ─────────────────── */}
								<ChartCard
									title="Revenus journaliers"
									subheader="Courbe annuelle des revenus par jour d'arrivée"
									height={280}
								>
									{dailyRevenue.length > 0 ? (
										<Line
											data={dailyChartData}
											options={{
												...CHART_OPTS,
												plugins: { legend: { display: false } },
												scales: {
													x: { ticks: { maxTicksLimit: 20, font: { size: 9 } } },
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
										title="Répartition par source"
										subheader="Booking, Airbnb, Espèces, Virement"
										infoTooltip="Répartition du chiffre d'affaires selon la source de réservation (Booking, Airbnb, Espèces, Virement)"
										height={280}
									>
										{bySource.length > 0 ? (
											<Doughnut data={sourceChartData} options={{ ...CHART_OPTS, cutout: '55%' }} />
										) : (
											<EmptyChart />
										)}
									</ChartCard>

									<ChartCard
										title="Revenus par appartement"
										subheader="Répartition du CA par unité"
										infoTooltip="Montant total des revenus générés par chaque appartement sur l'année"
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
									title="Jours d'occupation par appartement"
									subheader="Nombre total de nuitées enregistrées"
									infoTooltip="Nombre total de nuits occupées par appartement, basé sur les dates d'arrivée et de départ"
									height={260}
								>
									{Object.keys(occupancy).length > 0 ? (
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
													Détail par source de paiement
												</Typography>
											}
										/>
										<CardContent>
											<Box
												sx={{
													display: 'grid',
													gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(bySource.length, 4)}, 1fr)` },
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
														<Stack direction="row" justifyContent="space-between" alignItems="center">
															<Typography variant="subtitle2" fontWeight={600}>
																{src.source}
															</Typography>
															<Chip label={`${src.count} rés.`} size="small" />
														</Stack>
														<Typography variant="h6" color="primary" mt={1}>
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
