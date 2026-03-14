'use client';

import React, { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	LinearProgress,
	MenuItem,
	Select,
	Stack,
	Tooltip as MuiTooltip,
	Typography,
} from '@mui/material';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { SessionProps } from '@/types/_initTypes';
import type { ReservationListType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetDashboardStatsQuery, useGetPlanningQuery, useGetReservationYearsQuery } from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import { formatDate } from '@/utils/helpers';
import { APARTMENT_COLORS, PAYMENT_SOURCE_BG, MONTH_NAMES } from '@/utils/rawData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;

const fmt = (val: number) => val.toLocaleString('fr-MA');

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
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box sx={{ color }}>{icon}</Box>
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
								{label}
							</Typography>
							<Typography variant="h6" fontWeight={700}>
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

const OccupancyClient: React.FC<SessionProps> = ({ session }) => {
	const token = getAccessTokenFromSession(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [heatmapMonth, setHeatmapMonth] = useState(new Date().getMonth() + 1);

	const { data, isLoading } = useGetDashboardStatsQuery({ year }, { skip: !token });
	const { data: planningData, isFetching: planningLoading } = useGetPlanningQuery(
		{ year, month: heatmapMonth },
		{ skip: !token },
	);
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });

	const yearOptions = yearsData?.years ?? [currentYear];

	const occupancy = data?.occupancy_by_apartment ?? {};

	const daysInYear = year % 4 === 0 ? 366 : 365;

	const aptCount = Object.keys(occupancy).length;
	const totalOccupied = Object.values(occupancy).reduce((s, a) => s + a.occupied_days, 0);
	const totalRevenue = Object.values(occupancy).reduce((s, a) => s + Number(a.revenue), 0);
	const totalAvailable = daysInYear * aptCount;
	const availableNights = totalAvailable - totalOccupied;
	const globalOccPct = totalAvailable > 0 ? ((totalOccupied / totalAvailable) * 100).toFixed(1) : '0.0';

	/* ── Heatmap data (per-day, per-apartment for the selected month) ────── */
	const lastDay = planningData?.last_day ?? new Date(year, heatmapMonth, 0).getDate();

	interface DayCell {
		day: number;
		reservation: ReservationListType | null;
	}
	interface AptHeatRow {
		nom: string;
		days: DayCell[];
		occupied: number;
		revenue: number;
	}

	const heatmapRows: AptHeatRow[] = useMemo(() => {
		if (!planningData) return [];
		return Object.entries(planningData.apartments).map(([nom, apt]) => {
			const days: DayCell[] = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1, reservation: null }));
			let occupied = 0;
			let revenue = 0;

			for (const res of apt.reservations) {
				const checkIn = new Date(res.check_in + 'T00:00:00');
				const checkOut = new Date(res.check_out + 'T00:00:00');
				for (let d = 1; d <= lastDay; d++) {
					const cur = new Date(year, heatmapMonth - 1, d);
					if (cur >= checkIn && cur < checkOut) {
						days[d - 1] = { day: d, reservation: res };
						occupied++;
					}
				}
				revenue += Number(res.amount);
			}
			return { nom, days, occupied, revenue };
		});
	}, [planningData, lastDay, year, heatmapMonth]);

	const prevHeatmapMonth = () => {
		if (heatmapMonth === 1) {
			setHeatmapMonth(12);
			setYear((y) => y - 1);
		} else {
			setHeatmapMonth((m) => m - 1);
		}
	};
	const nextHeatmapMonth = () => {
		if (heatmapMonth === 12) {
			setHeatmapMonth(1);
			setYear((y) => y + 1);
		} else {
			setHeatmapMonth((m) => m + 1);
		}
	};

	const chartData = {
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
			<NavigationBar title="Taux d'occupation">
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
							<Typography variant="h5" fontWeight={600}>
								Taux d&apos;occupation {year}
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
								{/* Occupancy KPIs */}
								<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' } }}>
									<KpiCard
										color="#2e7d32"
										icon={<PieChartOutlineIcon />}
										label="Occupation globale"
										value={`${globalOccPct}%`}
										tooltip="Pourcentage de nuits occupées sur le total disponible"
									/>
									<KpiCard
										color="#1565c0"
										icon={<AttachMoneyIcon />}
										label="Revenus annuels"
										value={`${fmt(totalRevenue)} MAD`}
										tooltip="Somme de tous les montants de réservation"
									/>
									<KpiCard
										color="#e65100"
										icon={<NightsStayIcon />}
										label="Nuits occupées"
										value={fmt(totalOccupied)}
										tooltip={`Sur un total de ${fmt(totalAvailable)} nuits disponibles`}
									/>
									<KpiCard
										color="#6a1b9a"
										icon={<EventAvailableIcon />}
										label="Nuits libres"
										value={fmt(availableNights)}
										tooltip="Nuits restantes non réservées"
									/>
								</Box>

								{/* Bar chart */}
								<Card elevation={2}>
									<CardHeader
										title="Jours occupés par appartement"
										subheader={`Données pour l'année ${year}`}
										action={
											<MuiTooltip title="Nombre de jours occupés par appartement sur l'année" arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										<Box height={300}>
										{Object.values(occupancy).some((a) => a.occupied_days > 0) ? (
												<Bar
													data={chartData}
													options={{
														...CHART_OPTS,
														plugins: { legend: { display: false } },
														scales: {
															y: {
																beginAtZero: true,
																max: daysInYear,
																title: { display: true, text: 'Jours' },
															},
														},
													}}
												/>
											) : (
												<Box
													display="flex"
													flexDirection="column"
													alignItems="center"
													justifyContent="center"
													height="100%"
													sx={{ border: '1px dashed', borderColor: 'grey.300', borderRadius: 2, bgcolor: 'grey.50' }}
												>
													<Typography variant="h6" color="text.secondary" gutterBottom>📊</Typography>
													<Typography variant="body2" color="text.secondary">Aucune donnée disponible</Typography>
												</Box>
											)}
										</Box>
									</CardContent>
								</Card>

								{/* ── Calendar heatmap ─────────────────────── */}
								<Card elevation={2}>
									<CardHeader
										title="Vue calendrier"
										subheader="Occupation jour par jour par appartement"
										action={
											<MuiTooltip title="Chaque carré représente un jour du mois, coloré par source de paiement" arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										{/* Month navigation */}
										<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={2}>
											<IconButton onClick={prevHeatmapMonth} size="small">
												<ChevronLeftIcon />
											</IconButton>
											<Typography variant="h6" fontWeight={600} minWidth={180} textAlign="center">
												{MONTH_NAMES[heatmapMonth - 1]} {year}
											</Typography>
											<IconButton onClick={nextHeatmapMonth} size="small">
												<ChevronRightIcon />
											</IconButton>
										</Stack>

										{/* Legend */}
										<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" mb={2}>
											{Object.entries(PAYMENT_SOURCE_BG)
												.filter(([src]) => src !== 'Bank transfer')
												.map(([source, color]) => (
													<Chip
														key={source}
														label={source}
														size="small"
														sx={{ bgcolor: color, color: 'white', fontWeight: 500, fontSize: '0.7rem' }}
													/>
												))}
											<Chip
												label="Vacant"
												size="small"
												variant="outlined"
												sx={{ fontWeight: 500, fontSize: '0.7rem' }}
											/>
										</Stack>

										{planningLoading ? (
											<Box display="flex" justifyContent="center" py={4}>
												<CircularProgress size={28} />
											</Box>
										) : heatmapRows.length > 0 ? (
											<Stack spacing={2}>
												{heatmapRows.map((row) => {
													const pct = lastDay > 0 ? Math.round((row.occupied / lastDay) * 100) : 0;
													return (
														<Box
															key={row.nom}
															sx={{
																border: 1,
																borderColor: 'divider',
																borderRadius: 2,
																p: 1.5,
															}}
														>
															{/* Apartment header */}
															<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
																<Typography variant="subtitle2" fontWeight={700}>
																	{row.nom}
																</Typography>
																<Stack direction="row" spacing={2}>
																	<Typography variant="caption" color="text.secondary">
																		{pct}% occupé
																	</Typography>
																	<Typography variant="caption" color="text.secondary">
																		{row.occupied}/{lastDay} jours
																	</Typography>
																	<Typography variant="caption" fontWeight={600} color="primary.main">
																		{fmt(row.revenue)} MAD
																	</Typography>
																</Stack>
															</Stack>

															{/* Day squares grid */}
															<Box sx={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
																{row.days.map((cell) => {
																	const res = cell.reservation;
																	const bg = res
																		? PAYMENT_SOURCE_BG[res.payment_source] ?? '#555'
																		: undefined;

																	const square = (
																		<Box
																			key={cell.day}
																			sx={{
																				width: 26,
																				height: 26,
																				borderRadius: '4px',
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'center',
																				fontSize: '0.6rem',
																				fontWeight: 500,
																				color: res ? 'rgba(255,255,255,.8)' : 'text.disabled',
																				bgcolor: bg ?? 'action.hover',
																				cursor: res ? 'pointer' : 'default',
																				transition: 'transform .1s',
																				'&:hover': res
																					? { transform: 'scale(1.2)', zIndex: 2 }
																					: undefined,
																			}}
																		>
																			{cell.day}
																		</Box>
																	);

																	if (!res) return square;

																	return (
																		<MuiTooltip
																			key={cell.day}
																			arrow
																			title={
																				<Box>
																					<Typography variant="caption" display="block" fontWeight={600}>
																						{res.guest_name}
																					</Typography>
																					<Typography variant="caption" display="block">
																						{formatDate(res.check_in)} → {formatDate(res.check_out)}
																					</Typography>
																					<Typography variant="caption" display="block">
																						{Number(res.amount).toLocaleString('fr-MA')} MAD · {res.nights} nuit(s)
																					</Typography>
																					<Typography variant="caption" display="block">
																						{res.payment_source}
																					</Typography>
																				</Box>
																			}
																		>
																			{square}
																		</MuiTooltip>
																	);
																})}
															</Box>
														</Box>
													);
												})}
											</Stack>
										) : (
											<Box
												display="flex"
												alignItems="center"
												justifyContent="center"
												py={4}
												sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}
											>
												<Typography color="text.secondary">
													Aucune donnée pour {MONTH_NAMES[heatmapMonth - 1]} {year}
												</Typography>
											</Box>
										)}
									</CardContent>
								</Card>

								{/* Progress bars */}
								<Card elevation={2}>
									<CardHeader
										title="Détail par appartement"
										action={
											<MuiTooltip title="Taux d'occupation, nombre de réservations et revenus par appartement" arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										<Stack spacing={2}>
											{Object.entries(occupancy).map(([code, apt], i) => {
												const pct = Math.min(100, Math.round((apt.occupied_days / daysInYear) * 100));
												return (
													<Box key={code}>
														<Stack direction="row" justifyContent="space-between" mb={0.5}>
															<Typography variant="subtitle2" fontWeight={600}>
																{code}
															</Typography>
															<Stack direction="row" spacing={2}>
																<Typography variant="caption" color="text.secondary">
																	{apt.occupied_days} jours
																</Typography>
																<Typography variant="caption" color="text.secondary">
																	{apt.reservation_count} réservations
																</Typography>
																<Typography variant="caption" fontWeight={600} color="primary">
																	{pct}%
																</Typography>
															</Stack>
														</Stack>
														<LinearProgress
															variant="determinate"
															value={pct}
															sx={{
																height: 10,
																borderRadius: 5,
																bgcolor: 'action.hover',
																'& .MuiLinearProgress-bar': {
																	bgcolor: APARTMENT_COLORS[i % APARTMENT_COLORS.length],
																},
															}}
														/>
														<Typography variant="caption" color="text.secondary">
															Revenus: {fmt(Number(apt.revenue))} MAD
														</Typography>
													</Box>
												);
											})}
											{Object.keys(occupancy).length === 0 && (
												<Box display="flex" flexDirection="column" alignItems="center" py={2}>
													<Typography variant="h6" color="text.secondary" gutterBottom>📊</Typography>
													<Typography variant="body2" color="text.secondary" textAlign="center">
														Aucune donnée disponible pour {year}
													</Typography>
												</Box>
											)}
										</Stack>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default OccupancyClient;
