'use client';

import React, { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
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
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';
import {
	TrendingUp as TrendingUpIcon,
	EmojiEvents as TrophyIcon,
	AccountBalanceWallet as WalletIcon,
	CalendarMonth as CalendarIcon,
	InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
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
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetBalanceQuery, useGetReservationYearsQuery } from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import { MONTH_LABELS, MONTH_NAMES, APARTMENT_COLORS } from '@/utils/rawData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;

const fmt = (val: number) => val.toLocaleString('fr-MA');

/* ── KPI Card ──────────────────────────────────────────────────────────────── */
interface KpiProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	color?: string;
}
const KpiCard: React.FC<KpiProps> = ({ icon, label, value, sub, color }) => (
	<Card
		elevation={1}
		sx={{
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 3,
				height: '100%',
				bgcolor: color ?? 'primary.main',
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
			<Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
				<Box sx={{ color: color ?? 'primary.main', display: 'flex' }}>{icon}</Box>
				<Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
					{label}
				</Typography>
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

const GainsClient: React.FC<SessionProps> = ({ session }) => {
	const token = getAccessTokenFromSession(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	const { data, isLoading } = useGetBalanceQuery({ year }, { skip: !token });
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });

	const yearOptions = yearsData?.years ?? [currentYear];

	const apartments = useMemo(() => data?.apartments ?? {}, [data?.apartments]);
	const aptCodes = useMemo(() => Object.keys(apartments), [apartments]);
	const monthlyCost = data?.total_monthly_cost ?? 0;

	const totalYearRevenue = aptCodes.reduce((s, c) => s + apartments[c].year_total, 0);

	// Derived KPI data
	const { bestApt, bestMonth } = useMemo(() => {
		let bestAptCode = '';
		let bestAptTotal = 0;
		for (const code of aptCodes) {
			if (apartments[code].year_total > bestAptTotal) {
				bestAptTotal = apartments[code].year_total;
				bestAptCode = code;
			}
		}

		let bestMonthIdx = 0;
		let bestMonthTotal = 0;
		for (let m = 1; m <= 12; m++) {
			const mTotal = aptCodes.reduce((s, c) => s + (apartments[c].monthly[m]?.total ?? 0), 0);
			if (mTotal > bestMonthTotal) {
				bestMonthTotal = mTotal;
				bestMonthIdx = m - 1;
			}
		}

		return {
			bestApt: bestAptCode ? { code: bestAptCode, total: bestAptTotal } : null,
			bestMonth: bestMonthTotal > 0 ? { name: MONTH_NAMES[bestMonthIdx], total: bestMonthTotal } : null,
		};
	}, [apartments, aptCodes]);

	// Monthly totals for cards
	const monthlyData = useMemo(() => {
		return Array.from({ length: 12 }, (_, i) => {
			const month = i + 1;
			const aptBreakdown: { code: string; total: number }[] = [];
			let monthTotal = 0;
			for (const code of aptCodes) {
				const val = apartments[code].monthly[month]?.total ?? 0;
				if (val > 0) aptBreakdown.push({ code, total: val });
				monthTotal += val;
			}
			aptBreakdown.sort((a, b) => b.total - a.total);
			return { month, monthTotal, aptBreakdown };
		});
	}, [apartments, aptCodes]);

	const maxAptGain = useMemo(() => {
		let max = 0;
		for (const md of monthlyData) {
			for (const ab of md.aptBreakdown) {
				if (ab.total > max) max = ab.total;
			}
		}
		return max;
	}, [monthlyData]);

	// Stacked bar chart
	const stackedChartData = {
		labels: MONTH_LABELS,
		datasets: aptCodes.map((code, i) => ({
			label: code,
			data: Array.from({ length: 12 }, (_, monthIdx) => apartments[code].monthly[monthIdx + 1]?.total ?? 0),
			backgroundColor: APARTMENT_COLORS[i % APARTMENT_COLORS.length],
			borderRadius: 2,
		})),
	};

	const annualCost = monthlyCost * 12;
	const annualSolde = totalYearRevenue - annualCost;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Gains & Revenus">
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
							<Typography variant="h5" fontWeight={600}>
								Gains & Revenus {year}
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
								{/* ── KPI Row ──────────────────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
										gap: 2,
									}}
								>
									<KpiCard
										icon={<TrendingUpIcon fontSize="small" />}
										label="Gain total"
										value={`${fmt(totalYearRevenue)} MAD`}
										sub={monthlyCost > 0 ? `Solde net : ${fmt(annualSolde)} MAD` : undefined}
										color="#1976d2"
									/>
									<KpiCard
										icon={<TrophyIcon fontSize="small" />}
										label="Meilleur appartement"
										value={bestApt?.code ?? '—'}
										sub={bestApt ? `${fmt(bestApt.total)} MAD` : undefined}
										color="#d4af6e"
									/>
									<KpiCard
										icon={<WalletIcon fontSize="small" />}
										label="Coût mensuel location"
										value={monthlyCost > 0 ? `${fmt(monthlyCost)} MAD` : '—'}
										sub={monthlyCost > 0 ? 'MAD / mois' : 'Non configuré'}
										color="#e57373"
									/>
									<KpiCard
										icon={<CalendarIcon fontSize="small" />}
										label="Meilleur mois"
										value={bestMonth?.name ?? '—'}
										sub={bestMonth ? `${fmt(bestMonth.total)} MAD` : undefined}
										color="#66bb6a"
									/>
								</Box>

								{/* ── Stacked bar chart ─────────────────────── */}
								<Card elevation={2}>
									<CardHeader
										title="Gains par appartement"
										subheader="Vue empilée — contribution de chaque appartement par mois"
										action={
											<MuiTooltip title="Revenus mensuels empilés par appartement, permettant de visualiser la contribution de chaque unité" arrow placement="top">
												<IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										<Box height={360}>
											{aptCodes.length > 0 ? (
												<Bar
													data={stackedChartData}
													options={{
														...CHART_OPTS,
														scales: {
															x: { stacked: true },
															y: { stacked: true, beginAtZero: true, title: { display: true, text: 'MAD' } },
														},
													}}
												/>
											) : (
												<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%"
													sx={{ bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}>
													<Typography variant="h6" color="text.secondary" gutterBottom>📊</Typography>
													<Typography variant="body2" color="text.secondary">Aucune donnée disponible pour {year}</Typography>
												</Box>
											)}
										</Box>
									</CardContent>
								</Card>

								{/* ── Monthly gain cards ────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
										gap: 2,
									}}
								>
									{monthlyData
										.filter((md) => md.monthTotal > 0)
										.map((md) => {
											const solde = md.monthTotal - monthlyCost;
											return (
												<Card key={md.month} elevation={1}>
													<CardContent>
														<Typography variant="h6" fontWeight={600} gutterBottom>
															{MONTH_NAMES[md.month - 1]}
														</Typography>
														<Typography variant="body2" color="text.secondary" component="div" sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
															Total : {fmt(md.monthTotal)} MAD
															{monthlyCost > 0 && (
																<>
																	{' · Location : '}
																	{fmt(monthlyCost)} MAD
																	{' · Solde : '}
																	<Box
																		component="strong"
																		sx={{ color: solde >= 0 ? 'success.main' : 'error.main' }}
																	>
																		{fmt(solde)} MAD
																	</Box>
																</>
															)}
														</Typography>
														{md.aptBreakdown.map((ab, idx) => {
															const pct = maxAptGain > 0 ? Math.round((ab.total / maxAptGain) * 100) : 0;
															return (
																<Stack
																	key={ab.code}
																	direction="row"
																	alignItems="center"
																	justifyContent="space-between"
																	sx={{
																		py: 0.75,
																		borderBottom: idx < md.aptBreakdown.length - 1 ? 1 : 0,
																		borderColor: 'divider',
																	}}
																>
																	<Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
																		{ab.code}
																	</Typography>
																	<Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
																		<LinearProgress
																			variant="determinate"
																			value={pct}
																			sx={{
																				flex: 1,
																				height: 4,
																				borderRadius: 2,
																				bgcolor: 'grey.200',
																				'& .MuiLinearProgress-bar': {
																					borderRadius: 2,
																					background: `linear-gradient(90deg, ${APARTMENT_COLORS[aptCodes.indexOf(ab.code) % APARTMENT_COLORS.length]}, ${APARTMENT_COLORS[aptCodes.indexOf(ab.code) % APARTMENT_COLORS.length].replace('0.8', '1')})`,
																				},
																			}}
																		/>
																		<Typography variant="body2" fontWeight={600} sx={{ minWidth: 80, textAlign: 'right' }}>
																			{fmt(ab.total)}
																		</Typography>
																	</Stack>
																</Stack>
															);
														})}
													</CardContent>
												</Card>
											);
										})}
								</Box>

								{/* ── Per-apartment detail table ────────────── */}
								{aptCodes.length > 0 && (
									<Card elevation={2}>
										<CardHeader
										title="Détail mensuel par appartement"
										subheader={`Revenus en MAD — ${year}`}
										action={
											<MuiTooltip title="Tableau détaillé des revenus mensuels par appartement avec totaux" arrow placement="top">
												<IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
											</MuiTooltip>
										}
									/>
										<CardContent sx={{ p: 0 }}>
											<TableContainer component={Paper} elevation={0}>
												<Table size="small" sx={{ minWidth: 700 }}>
													<TableHead>
														<TableRow sx={{ bgcolor: 'grey.100' }}>
															<TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'grey.100', zIndex: 1 }}>Appartement</TableCell>
															{MONTH_LABELS.map((m) => (
																<TableCell key={m} align="right" sx={{ fontWeight: 700 }}>
																	{m}
																</TableCell>
															))}
															<TableCell
																align="right"
																sx={{ fontWeight: 700, borderLeft: '2px solid', borderColor: 'divider' }}
															>
																Total
															</TableCell>
															{monthlyCost > 0 && (
																<TableCell
																	align="right"
																	sx={{ fontWeight: 700, borderLeft: '2px solid', borderColor: 'divider' }}
																>
																	Solde
																</TableCell>
															)}
														</TableRow>
													</TableHead>
													<TableBody>
														{aptCodes.map((code, i) => {
															const aptYearTotal = apartments[code].year_total;
															const aptSolde = aptYearTotal - (monthlyCost > 0 ? annualCost / aptCodes.length : 0);
															return (
																<TableRow
																	key={code}
																	sx={{ bgcolor: i % 2 === 0 ? 'background.default' : 'action.hover' }}
																>
																	<TableCell sx={{ fontWeight: 500, position: 'sticky', left: 0, bgcolor: i % 2 === 0 ? 'background.default' : 'action.hover', zIndex: 1 }}>{code}</TableCell>
																	{Array.from({ length: 12 }, (_, mi) => {
																		const val = apartments[code].monthly[mi + 1]?.total ?? 0;
																		return (
																			<TableCell
																				key={mi}
																				align="right"
																				sx={{
																					fontSize: '0.8rem',
																					color: val > 0 ? 'text.primary' : 'text.disabled',
																				}}
																			>
																				{val > 0 ? fmt(val) : '—'}
																			</TableCell>
																		);
																	})}
																	<TableCell
																		align="right"
																		sx={{
																			fontWeight: 600,
																			borderLeft: '2px solid',
																			borderColor: 'divider',
																			color: aptYearTotal > 0 ? 'primary.main' : 'text.disabled',
																		}}
																	>
																		{aptYearTotal > 0 ? fmt(aptYearTotal) : '—'}
																	</TableCell>
																	{monthlyCost > 0 && (
																		<TableCell
																			align="right"
																			sx={{
																				fontWeight: 600,
																				borderLeft: '2px solid',
																				borderColor: 'divider',
																				color: aptYearTotal > 0 ? (aptSolde >= 0 ? 'success.main' : 'error.main') : 'text.disabled',
																			}}
																		>
																			{aptYearTotal > 0 ? fmt(aptSolde) : '—'}
																		</TableCell>
																	)}
																</TableRow>
															);
														})}
														{/* Month totals row */}
														<TableRow sx={{ bgcolor: 'primary.light' }}>
															<TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'primary.light', zIndex: 1 }}>TOTAL</TableCell>
															{Array.from({ length: 12 }, (_, mi) => {
																const monthTotal = aptCodes.reduce(
																	(s, c) => s + (apartments[c].monthly[mi + 1]?.total ?? 0),
																	0,
																);
																return (
																	<TableCell key={mi} align="right" sx={{ fontWeight: 700 }}>
																		{monthTotal > 0 ? fmt(monthTotal) : '—'}
																	</TableCell>
																);
															})}
															<TableCell
																align="right"
																sx={{
																	fontWeight: 700,
																	borderLeft: '2px solid',
																	borderColor: 'divider',
																	color: 'primary.dark',
																}}
															>
																{fmt(totalYearRevenue)}
															</TableCell>
															{monthlyCost > 0 && (
																<TableCell
																	align="right"
																	sx={{
																		fontWeight: 700,
																		borderLeft: '2px solid',
																		borderColor: 'divider',
																		color: annualSolde >= 0 ? 'success.dark' : 'error.dark',
																	}}
																>
																	{fmt(annualSolde)}
																</TableCell>
															)}
														</TableRow>
													</TableBody>
												</Table>
											</TableContainer>
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

export default GainsClient;
