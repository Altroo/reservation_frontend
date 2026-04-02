'use client';

import React, { useMemo, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	IconButton,
	LinearProgress,
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
} from '@mui/material';
import {
	Apartment as ApartmentIcon,
	CalendarMonth as CalendarIcon,
	CalendarToday as CalendarTodayIcon,
	EmojiEvents as TrophyIcon,
	InfoOutlined as InfoOutlinedIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { SessionProps } from '@/types/_initTypes';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetBalanceQuery, useGetReservationYearsQuery, useGetBuildingsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { APARTMENT_COLORS, CHART_OPTS } from '@/utils/rawData';
import { formatNumberMA as fmt } from '@/utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data, isLoading } = useGetBalanceQuery({ year, ...(buildingId ? { building: buildingId } : {}) }, { skip: !token });
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const buildingItems: DropDownType[] = useMemo(
		() => [{ code: t.locaux.allResidences, value: t.locaux.allResidences }, ...(buildingsData ?? []).map((b) => ({ code: b.nom, value: b.nom }))],
		[buildingsData, t],
	);

	const yearItems: DropDownType[] = useMemo(
		() => (yearsData?.years ?? [currentYear]).map((y) => ({ code: String(y), value: String(y) })),
		[yearsData?.years, currentYear],
	);

	const apartments = useMemo(() => data?.apartments ?? {}, [data?.apartments]);
	const aptNoms = useMemo(() => Object.keys(apartments), [apartments]);

	const totalYearRevenue = aptNoms.reduce((s, c) => s + apartments[c].year_total, 0);

	// Derived KPI data
	const { bestApt, bestMonth } = useMemo(() => {
		let bestAptNom = '';
		let bestAptTotal = 0;
		for (const nom of aptNoms) {
			if (apartments[nom].year_total > bestAptTotal) {
				bestAptTotal = apartments[nom].year_total;
				bestAptNom = nom;
			}
		}

		let bestMonthIdx = 0;
		let bestMonthTotal = 0;
		for (let m = 1; m <= 12; m++) {
			const mTotal = aptNoms.reduce((s, c) => s + (apartments[c].monthly[m]?.total ?? 0), 0);
			if (mTotal > bestMonthTotal) {
				bestMonthTotal = mTotal;
				bestMonthIdx = m - 1;
			}
		}

		return {
			bestApt: bestAptNom ? { nom: bestAptNom, total: bestAptTotal } : null,
			bestMonth: bestMonthTotal > 0 ? { name: t.rawData.monthNames[bestMonthIdx], total: bestMonthTotal } : null,
		};
	}, [apartments, aptNoms, t.rawData.monthNames]);

	// Monthly totals for cards
	const monthlyData = useMemo(() => {
		return Array.from({ length: 12 }, (_, i) => {
			const month = i + 1;
			const aptBreakdown: { nom: string; total: number }[] = [];
			let monthTotal = 0;
			for (const nom of aptNoms) {
				const val = apartments[nom].monthly[month]?.total ?? 0;
				if (val > 0) aptBreakdown.push({ nom, total: val });
				monthTotal += val;
			}
			aptBreakdown.sort((a, b) => b.total - a.total);
			return { month, monthTotal, aptBreakdown };
		});
	}, [apartments, aptNoms]);

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
		labels: t.rawData.monthLabels,
		datasets: aptNoms.map((nom, i) => ({
			label: nom,
			data: Array.from({ length: 12 }, (_, monthIdx) => apartments[nom].monthly[monthIdx + 1]?.total ?? 0),
			backgroundColor: APARTMENT_COLORS[i % APARTMENT_COLORS.length],
			borderRadius: 2,
		})),
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title={t.reservations.gainsRevenues}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
							<Typography variant="h5" fontWeight={600}>
								{t.reservations.gainsRevenuesYear(year)}
							</Typography>
							<Stack direction="row" spacing={1}>
							<Box sx={{ minWidth: 180 }}>
								<CustomDropDownSelect
									id="building-filter"
									size="small"
									label={t.common.residence}
									items={buildingItems}
									value={buildingId === '' ? t.locaux.allResidences : ((buildingsData ?? []).find((b) => b.id === buildingId)?.nom ?? t.locaux.allResidences)}
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
										label={t.reservations.totalGain}
										value={`${fmt(totalYearRevenue)} MAD`}
										color="#1976d2"
									/>
									<KpiCard
										icon={<TrophyIcon fontSize="small" />}
										label={t.reservations.bestApartment}
										value={bestApt?.nom ?? '—'}
										sub={bestApt ? `${fmt(bestApt.total)} MAD` : undefined}
										color="#d4af6e"
									/>
									<KpiCard
										icon={<CalendarIcon fontSize="small" />}
										label={t.reservations.bestMonth}
										value={bestMonth?.name ?? '—'}
										sub={bestMonth ? `${fmt(bestMonth.total)} MAD` : undefined}
										color="#66bb6a"
									/>
								</Box>

								{/* ── Stacked bar chart ─────────────────────── */}
								<Card elevation={2}>
									<CardHeader
										title={t.reservations.gainsByApartment}
										subheader={t.reservations.gainsByApartmentSub}
										action={
											<MuiTooltip
												title={t.reservations.gainsByApartmentTooltip}
												arrow
												placement="top"
											>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										<Box height={360}>
											{aptNoms.some((c) => apartments[c].year_total > 0) ? (
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
												<Box
													display="flex"
													flexDirection="column"
													alignItems="center"
													justifyContent="center"
													height="100%"
													sx={{ bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}
												>
													<Typography variant="h6" color="text.secondary" gutterBottom>
														📊
													</Typography>
													<Typography variant="body2" color="text.secondary">
														{t.reservations.noDataForYear(year)}
													</Typography>
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
											return (
												<Card key={md.month} elevation={1}>
													<CardContent>
														<Typography variant="h6" fontWeight={600} gutterBottom>
															{t.rawData.monthNames[md.month - 1]}
														</Typography>
														<Typography
															variant="body2"
															color="text.secondary"
															component="div"
															sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider', mb: 1.5 }}
														>
															{t.common.total} : {fmt(md.monthTotal)} MAD
														</Typography>
														{md.aptBreakdown.map((ab, idx) => {
															const pct = maxAptGain > 0 ? Math.round((ab.total / maxAptGain) * 100) : 0;
															return (
																<Stack
																	key={ab.nom}
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
																		{ab.nom}
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
																					background: `linear-gradient(90deg, ${APARTMENT_COLORS[aptNoms.indexOf(ab.nom) % APARTMENT_COLORS.length]}, ${APARTMENT_COLORS[aptNoms.indexOf(ab.nom) % APARTMENT_COLORS.length].replace('0.8', '1')})`,
																				},
																			}}
																		/>
																		<Typography
																			variant="body2"
																			fontWeight={600}
																			sx={{ minWidth: 80, textAlign: 'right' }}
																		>
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
								{aptNoms.length > 0 && (
									<Card elevation={2}>
										<CardHeader
											title={t.reservations.monthlyDetailByApartment}
											subheader={t.reservations.monthlyDetailByApartmentSub(year)}
											action={
												<MuiTooltip
													title={t.reservations.monthlyDetailTooltip}
													arrow
													placement="top"
												>
													<IconButton size="small">
														<InfoOutlinedIcon fontSize="small" />
													</IconButton>
												</MuiTooltip>
											}
										/>
										<CardContent sx={{ p: 0 }}>
											<TableContainer component={Paper} elevation={0}>
												<Table size="small" sx={{ minWidth: 700 }}>
													<TableHead>
														<TableRow sx={{ bgcolor: 'grey.100' }}>
															<TableCell
																sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'grey.100', zIndex: 1 }}
															>
																{t.reservations.apartment}
															</TableCell>
															{t.rawData.monthLabels.map((m) => (
																<TableCell key={m} align="right" sx={{ fontWeight: 700 }}>
																	{m}
																</TableCell>
															))}
															<TableCell
																align="right"
																sx={{ fontWeight: 700, borderLeft: '2px solid', borderColor: 'divider' }}
															>
																{t.common.total}
															</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{aptNoms.map((nom, i) => {
															const aptYearTotal = apartments[nom].year_total;
															return (
																<TableRow
																	key={nom}
																	sx={{ bgcolor: i % 2 === 0 ? 'background.default' : 'action.hover' }}
																>
																	<TableCell
																		sx={{
																			fontWeight: 500,
																			position: 'sticky',
																			left: 0,
																			bgcolor: i % 2 === 0 ? 'background.default' : 'action.hover',
																			zIndex: 1,
																		}}
																	>
																		{nom}
																	</TableCell>
																	{Array.from({ length: 12 }, (_, mi) => {
																		const val = apartments[nom].monthly[mi + 1]?.total ?? 0;
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
																</TableRow>
															);
														})}
														{/* Month totals row */}
														<TableRow sx={{ bgcolor: 'primary.light' }}>
															<TableCell
																sx={{
																	fontWeight: 700,
																	position: 'sticky',
																	left: 0,
																	bgcolor: 'primary.light',
																	zIndex: 1,
																}}
															>
																{t.common.total}
															</TableCell>
															{Array.from({ length: 12 }, (_, mi) => {
																const monthTotal = aptNoms.reduce(
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
