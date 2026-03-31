'use client';

import React, { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	AttachMoney as MoneyIcon,
	Hotel as HotelIcon,
	PieChart as PieIcon,
	CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { ReservationListType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetPlanningQuery, useGetBuildingsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { formatDate, weekdayIndex } from '@/utils/helpers';
import { PAYMENT_SOURCE_BG, MONTH_NAMES, DAY_ABBREVIATIONS } from '@/utils/rawData';

interface CellReservation {
	reservation: ReservationListType;
	isStart: boolean;
	isEnd: boolean;
	spanStart: number; // 0-based in the grid row
}

interface ApartmentPlanningRow {
	nom: string;
	cells: (CellReservation | null)[]; // index 0 = day 1, …, lastDay-1
}

function buildRows(
	apartments: Record<string, { id: number; nom: string; reservations: ReservationListType[] }>,
	year: number,
	month: number,
	lastDay: number,
): ApartmentPlanningRow[] {
	return Object.entries(apartments).map(([nom, apt]) => {
		const cells: (CellReservation | null)[] = Array(lastDay).fill(null);

		for (const res of apt.reservations) {
			const checkIn = new Date(res.check_in + 'T00:00:00');
			const checkOut = new Date(res.check_out + 'T00:00:00');

			for (let day = 1; day <= lastDay; day++) {
				const current = new Date(year, month - 1, day);
				if (current >= checkIn && current < checkOut) {
					cells[day - 1] = {
						reservation: res,
						isStart: current.getTime() === checkIn.getTime(),
						isEnd: new Date(year, month - 1, day + 1).getTime() === checkOut.getTime(),
						spanStart: day - 1,
					};
				}
			}
		}

		return { nom, cells };
	});
}

const PlanningMonthClient: React.FC<SessionProps> = ({ session }) => {
	const token = useInitAccessToken(session);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const prevMonth = () => {
		if (month === 1) {
			setMonth(12);
			setYear((y) => y - 1);
		} else {
			setMonth((m) => m - 1);
		}
	};

	const nextMonth = () => {
		if (month === 12) {
			setMonth(1);
			setYear((y) => y + 1);
		} else {
			setMonth((m) => m + 1);
		}
	};

	const { data, isLoading } = useGetPlanningQuery({ year, month, ...(buildingId ? { building: buildingId } : {}) }, { skip: !token });

	const lastDay = data?.last_day ?? new Date(year, month, 0).getDate();
	const dayNumbers = Array.from({ length: lastDay }, (_, i) => i + 1);

	const rows = data ? buildRows(data.apartments, year, month, lastDay) : [];

	const monthRevenue = data
		? Object.values(data.apartments).reduce(
				(sum, apt) => sum + apt.reservations.reduce((s, r) => s + Number(r.amount), 0),
				0,
			)
		: 0;
	const nightCount = data
		? Object.values(data.apartments).reduce(
				(sum, apt) => sum + apt.reservations.reduce((s, r) => s + (r.nights ?? 0), 0),
				0,
			)
		: 0;
	const totalSlots = rows.length * lastDay;
	const occupiedSlots = rows.reduce((s, r) => s + r.cells.filter(Boolean).length, 0);
	const occupationPct = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : '0.0';
	const fmt = (val: number) => val.toLocaleString('fr-MA');

	const COL_WIDTH = isMobile ? 28 : 36;
	const LABEL_WIDTH = isMobile ? 90 : 140;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Planning mensuel">
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						{/* Month navigation */}
						<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} py={2} flexWrap="wrap" gap={1}>
							<FormControl size="small" sx={{ minWidth: 160 }}>
								<InputLabel>Résidence</InputLabel>
								<Select
									value={buildingId}
									label="Résidence"
									onChange={(e) => {
										const val = String(e.target.value);
										setBuildingId(val === '' ? '' : Number(val));
									}}
								>
									<MenuItem value="">Toutes</MenuItem>
									{(buildingsData ?? []).map((b) => (
										<MenuItem key={b.id} value={b.id}>
											{b.nom}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<IconButton onClick={prevMonth} size="small">
								<ChevronLeftIcon />
							</IconButton>
							<Typography variant="h5" fontWeight={600} minWidth={200} textAlign="center">
								{MONTH_NAMES[month - 1]} {year}
							</Typography>
							<IconButton onClick={nextMonth} size="small">
								<ChevronRightIcon />
							</IconButton>
						</Stack>

						{/* Legend */}
						<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" mb={2}>
							{Object.entries(PAYMENT_SOURCE_BG).map(([source, color]) => (
								<Chip
									key={source}
									label={source}
									size="small"
									sx={{ bgcolor: color, color: 'white', fontWeight: 500 }}
								/>
							))}
						</Stack>

						{isLoading ? (
							<Box display="flex" justifyContent="center" py={8}>
								<CircularProgress />
							</Box>
						) : (
							<>
								{/* Planning KPIs */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
										gap: 2,
										mb: 2,
									}}
								>
									{[
										{
											label: 'Revenus du mois',
											value: `${fmt(monthRevenue)} MAD`,
											icon: <MoneyIcon fontSize="small" />,
											color: '#1976d2',
										},
										{
											label: 'Nuitées',
											value: nightCount.toString(),
											icon: <HotelIcon fontSize="small" />,
											color: '#ed6c02',
										},
										{
											label: 'Occupation',
											value: `${occupationPct}%`,
											icon: <PieIcon fontSize="small" />,
											color: '#2e7d32',
										},
										{
											label: 'Jours du mois',
											value: lastDay.toString(),
											icon: <CalendarIcon fontSize="small" />,
											color: '#9c27b0',
										},
									].map(({ label, value, icon, color }) => (
										<Card
											key={label}
											elevation={2}
											sx={{
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
											<CardContent sx={{ py: 1.5, pl: 2.5, '&:last-child': { pb: 1.5 } }}>
												<Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
													<Box sx={{ color, display: 'flex' }}>{icon}</Box>
													<Typography
														variant="caption"
														color="text.secondary"
														textTransform="uppercase"
														letterSpacing={0.8}
													>
														{label}
													</Typography>
												</Stack>
												<Typography variant="h6" fontWeight={700}>
													{value}
												</Typography>
											</CardContent>
										</Card>
									))}
								</Box>
								<Card elevation={2} sx={{ overflowX: 'auto' }}>
									<CardContent sx={{ p: { xs: 1, sm: 2 } }}>
										<Box sx={{ minWidth: LABEL_WIDTH + COL_WIDTH * lastDay }}>
											{/* Header row — day numbers */}
											<Box display="flex" sx={{ borderBottom: '2px solid', borderColor: 'divider', mb: 0.5 }}>
												<Box
													sx={{
														width: LABEL_WIDTH,
														minWidth: LABEL_WIDTH,
														fontWeight: 700,
														fontSize: '0.75rem',
														color: 'text.secondary',
														display: 'flex',
														alignItems: 'center',
														pl: 1,
													}}
												>
													Appart.
												</Box>
												{dayNumbers.map((day) => {
													const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
													const dow = weekdayIndex(dateStr);
													const isWeekend = dow >= 5;
													return (
														<Box
															key={day}
															sx={{
																width: COL_WIDTH,
																minWidth: COL_WIDTH,
																textAlign: 'center',
																fontSize: '0.7rem',
																fontWeight: 600,
																color: isWeekend ? 'error.main' : 'text.primary',
																borderLeft: '1px solid',
																borderColor: 'divider',
																py: 0.5,
															}}
														>
															<Box>{day}</Box>
															<Box sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{DAY_ABBREVIATIONS[dow]}</Box>
														</Box>
													);
												})}
											</Box>

											{/* Apartment rows */}
											{rows.map((aptRow, rowIdx) => (
												<Box
													key={aptRow.nom}
													display="flex"
													sx={{
														borderBottom: '1px solid',
														borderColor: 'divider',
														bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover',
														minHeight: 40,
														alignItems: 'stretch',
													}}
												>
													{/* Apartment label */}
													<Tooltip title={aptRow.nom} placement="right" arrow>
														<Box
															sx={{
																width: LABEL_WIDTH,
																minWidth: LABEL_WIDTH,
																display: 'flex',
																alignItems: 'center',
																pl: 1,
																borderRight: '2px solid',
																borderColor: 'divider',
																position: 'sticky',
																left: 0,
																zIndex: 1,
																bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover',
															}}
														>
															<Typography variant="caption" fontWeight={700} noWrap>
																{aptRow.nom}
															</Typography>
														</Box>
													</Tooltip>

													{/* Day cells */}
													{aptRow.cells.map((cell, dayIdx) => {
														const day = dayIdx + 1;
														const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
													const dow = weekdayIndex(dateStr);
																											const isWeekend = dow >= 5;
														return (
															<Box
																key={dayIdx}
																sx={{
																	width: COL_WIDTH,
																	minWidth: COL_WIDTH,
																	borderLeft: '1px solid',
																	borderColor: 'divider',
																	bgcolor: isWeekend && !cell ? 'action.hover' : 'transparent',
																	position: 'relative',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																}}
															>
																{cell && (
																	<Tooltip
																		title={
																			<Box>
																				<Typography variant="caption" display="block" fontWeight={600}>
																					{cell.reservation.guest_name}
																				</Typography>
																				<Typography variant="caption" display="block">
																					{formatDate(cell.reservation.check_in)} →{' '}
																					{formatDate(cell.reservation.check_out)}
																				</Typography>
																				<Typography variant="caption" display="block">
																					{Number(cell.reservation.amount).toLocaleString('fr-MA')} MAD
																				</Typography>
																				<Typography variant="caption" display="block">
																					{cell.reservation.nights} nuit(s)
																				</Typography>
																			</Box>
																		}
																		arrow
																		placement="top"
																	>
																		<Box
																			sx={{
																				position: 'absolute',
																				inset: 1,
																				bgcolor: PAYMENT_SOURCE_BG[cell.reservation.payment_source] ?? '#555',
																				borderRadius: `${cell.isStart ? '4px' : '0'} ${cell.isEnd ? '4px' : '0'} ${cell.isEnd ? '4px' : '0'} ${cell.isStart ? '4px' : '0'}`,
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'flex-start',
																				overflow: 'hidden',
																				cursor: 'pointer',
																				px: cell.isStart ? 0.5 : 0,
																			}}
																		>
																			{cell.isStart && (
																				<Typography
																					noWrap
																					sx={{
																						fontSize: '0.6rem',
																						color: 'white',
																						fontWeight: 600,
																						lineHeight: 1.2,
																					}}
																				>
																					{cell.reservation.guest_name.split(' ')[0]}
																				</Typography>
																			)}
																		</Box>
																	</Tooltip>
																)}
															</Box>
														);
													})}
												</Box>
											))}

											{rows.length === 0 && !isLoading && (
												<Box py={4} textAlign="center">
													<Typography color="text.secondary">
														Aucune réservation pour {MONTH_NAMES[month - 1]} {year}
													</Typography>
												</Box>
											)}
										</Box>
									</CardContent>
								</Card>
							</>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default PlanningMonthClient;



