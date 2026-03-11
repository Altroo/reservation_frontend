'use client';

import React, { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip as MuiTooltip,
	Typography,
	Paper,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
import { useGetBalanceQuery } from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import { MONTH_LABELS } from '@/utils/rawData';

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

const BalanceClient: React.FC<SessionProps> = ({ session }) => {
	const token = getAccessTokenFromSession(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	const { data, isLoading } = useGetBalanceQuery({ year }, { skip: !token });

	const yearOptions = [currentYear];

	const apartments = data?.apartments ?? {};
	const airbnbMonthly = data?.airbnb_monthly ?? {};
	const nonAirbnbMonthly = data?.non_airbnb_monthly ?? {};
	const aptCodes = Object.keys(apartments);

	const totalByMonth: number[] = Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		return aptCodes.reduce((sum, code) => {
			return sum + (apartments[code].monthly[month]?.total ?? 0);
		}, 0);
	});

	const airbnbVsNonAirbnbData = {
		labels: MONTH_LABELS,
		datasets: [
			{
				label: 'Airbnb',
				data: Array.from({ length: 12 }, (_, i) => airbnbMonthly[i + 1] ?? 0),
				backgroundColor: 'rgba(255, 90, 31, 0.75)',
				borderRadius: 3,
			},
			{
				label: 'Hors Airbnb',
				data: Array.from({ length: 12 }, (_, i) => nonAirbnbMonthly[i + 1] ?? 0),
				backgroundColor: 'rgba(25, 118, 210, 0.75)',
				borderRadius: 3,
			},
		],
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Balance & Airbnb">
				<Protected>
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
							<Typography variant="h5" fontWeight={600}>
								Balance {year}
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
								{/* Balance KPIs */}
								{(() => {
									const totalAirbnb = Object.values(airbnbMonthly).reduce((s, v) => s + v, 0);
									const totalNonAirbnb = Object.values(nonAirbnbMonthly).reduce((s, v) => s + v, 0);
									const totalGlobal = totalAirbnb + totalNonAirbnb;
									return (
										<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
											<KpiCard
												color="#1565c0"
												icon={<AccountBalanceWalletIcon />}
												label="Revenu global"
												value={`${fmt(totalGlobal)} MAD`}
												tooltip="Somme de tous les revenus (Airbnb + Hors-Airbnb)"
											/>
											<KpiCard
												color="#e65100"
												icon={<HomeWorkIcon />}
												label="Total Airbnb"
												value={`${fmt(totalAirbnb)} MAD`}
												tooltip="Revenus provenant de la source Airbnb"
											/>
											<KpiCard
												color="#2e7d32"
												icon={<AccountBalanceWalletIcon />}
												label="Total Hors-Airbnb"
												value={`${fmt(totalNonAirbnb)} MAD`}
												tooltip="Revenus provenant de sources autres qu'Airbnb"
											/>
											<KpiCard
												color="#6a1b9a"
												icon={<HomeWorkIcon />}
												label="Appartements"
												value={`${aptCodes.length}`}
												tooltip="Nombre d'appartements avec des données"
											/>
										</Box>
									);
								})()}
								{/* Matrix table: apartment × month */}
								<Card elevation={2}>
									<CardHeader
										title="Revenus par appartement et par mois"
										subheader={`Détail mensuel pour ${year} (MAD)`}
										action={
											<MuiTooltip title="Matrice des revenus mensuels par appartement avec totaux annuels" arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent sx={{ p: 0 }}>
										<TableContainer component={Paper} elevation={0}>
											<Table size="small" sx={{ minWidth: 900 }}>
												<TableHead>
													<TableRow sx={{ bgcolor: 'primary.main' }}>
														<TableCell sx={{ color: 'white', fontWeight: 700, width: 100 }}>
															Appartement
														</TableCell>
														{MONTH_LABELS.map((m) => (
															<TableCell
																key={m}
																align="right"
																sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}
															>
																{m}
															</TableCell>
														))}
														<TableCell
															align="right"
															sx={{ color: 'white', fontWeight: 700, borderLeft: '2px solid rgba(255,255,255,0.3)' }}
														>
															Total
														</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{aptCodes.map((code, rowIdx) => {
														const apt = apartments[code];
														return (
															<TableRow
																key={code}
																sx={{
																	bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover',
																}}
															>
																<TableCell sx={{ fontWeight: 600 }}>{code}</TableCell>
																{Array.from({ length: 12 }, (_, i) => {
																	const monthData = apt.monthly[i + 1];
																	const total = monthData?.total ?? 0;
																	return (
																		<TableCell
																			key={i}
																			align="right"
																			sx={{
																				fontSize: '0.75rem',
																				color: total > 0 ? 'text.primary' : 'text.disabled',
																			}}
																		>
																			{total > 0 ? fmt(total) : '—'}
																		</TableCell>
																	);
																})}
																<TableCell
																	align="right"
																	sx={{
																		fontWeight: 700,
																		color: 'primary.main',
																		borderLeft: '2px solid',
																		borderColor: 'divider',
																	}}
																>
																	{fmt(apt.year_total)}
																</TableCell>
															</TableRow>
														);
													})}

													{/* Total row */}
													<TableRow sx={{ bgcolor: 'primary.light' }}>
														<TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
														{totalByMonth.map((total, i) => (
															<TableCell
																key={i}
																align="right"
																sx={{ fontWeight: 600, fontSize: '0.75rem', color: total > 0 ? 'text.primary' : 'text.disabled' }}
															>
																{total > 0 ? fmt(total) : '—'}
															</TableCell>
														))}
														<TableCell
															align="right"
															sx={{
																fontWeight: 700,
																color: 'primary.dark',
																borderLeft: '2px solid',
																borderColor: 'divider',
															}}
														>
															{fmt(aptCodes.reduce((s, c) => s + apartments[c].year_total, 0))}
														</TableCell>
													</TableRow>

													{aptCodes.length === 0 && (
														<TableRow>
															<TableCell colSpan={14} align="center" sx={{ py: 4, color: 'text.secondary' }}>
																Aucune donnée disponible pour {year}
															</TableCell>
														</TableRow>
													)}
												</TableBody>
											</Table>
										</TableContainer>
									</CardContent>
								</Card>

								{/* Airbnb vs non-Airbnb chart */}
								<Card elevation={2}>
									<CardHeader
										title="Airbnb vs Hors-Airbnb"
										subheader="Comparaison mensuelle des revenus par source"
										action={
											<MuiTooltip title="Ventilation mensuelle des revenus entre Airbnb et Hors-Airbnb" arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent>
										<Box height={300}>
											<Bar
												data={airbnbVsNonAirbnbData}
												options={{
													...CHART_OPTS,
													scales: {
														y: {
															beginAtZero: true,
															title: { display: true, text: 'MAD' },
														},
													},
												}}
											/>
										</Box>
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

export default BalanceClient;
