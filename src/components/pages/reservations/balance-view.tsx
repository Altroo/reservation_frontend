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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { SessionProps } from '@/types/_initTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetBalanceQuery, useGetReservationYearsQuery } from '@/store/services/reservation';
import { getAccessTokenFromSession } from '@/store/session';
import { MONTH_LABELS } from '@/utils/rawData';

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
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });

	const yearOptions = yearsData?.years ?? [currentYear];

	const apartments = data?.apartments ?? {};
	const aptCodes = Object.keys(apartments);
	const totalReturned = data?.total_returned ?? 0;
	const totalNotReturned = data?.total_not_returned ?? 0;
	const totalBalance = totalReturned + totalNotReturned;

	const totalByMonth: number[] = Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		return aptCodes.reduce((sum, code) => {
			return sum + (apartments[code].monthly[month]?.total ?? 0);
		}, 0);
	});

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Balance">
				<Protected permission="can_view">
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
								<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
									<KpiCard
										color="#1565c0"
										icon={<AccountBalanceWalletIcon />}
										label="Balance totale"
										value={`${fmt(totalBalance)} MAD`}
										tooltip="Somme des revenus Airbnb & Virement bancaire"
									/>
									<KpiCard
										color="#2e7d32"
										icon={<CheckCircleOutlineIcon />}
										label="Montant retourné"
										value={`${fmt(totalReturned)} MAD`}
										tooltip="Total des réservations dont le montant a été retourné"
									/>
									<KpiCard
										color="#d32f2f"
										icon={<HighlightOffIcon />}
										label="Montant non retourné"
										value={`${fmt(totalNotReturned)} MAD`}
										tooltip="Total des réservations dont le montant n'a pas encore été retourné"
									/>
									<KpiCard
										color="#6a1b9a"
										icon={<HomeWorkIcon />}
										label="Appartements"
										value={`${aptCodes.length}`}
										tooltip="Nombre d'appartements actifs"
									/>
								</Box>
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

							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default BalanceClient;
