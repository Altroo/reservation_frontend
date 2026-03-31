'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	Menu,
	MenuItem,
	Select,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	CalendarMonth as CalendarMonthIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { ReservationListType } from '@/types/reservationTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { Protected } from '@/components/layouts/protected/protected';
import { useGetPlanningQuery, useGetBuildingsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { RESERVATIONS_VIEW } from '@/utils/routes';
import { weekdayIndex } from '@/utils/helpers';
import { APARTMENT_COLORS, DAY_ABBREVIATIONS, MONTH_NAMES, PAYMENT_SOURCE_BG } from '@/utils/rawData';
import ReservationDialog from '@/components/pages/reservations/reservation-dialog';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface DayEntry {
	res: ReservationListType;
	aptColor: string;
	isStart: boolean;
	isEnd: boolean;
}

function buildDayMap(
	apartments: Record<string, { id: number; nom: string; reservations: ReservationListType[] }>,
	year: number,
	month: number,
	lastDay: number,
): Map<number, DayEntry[]> {
	const aptNames = Object.keys(apartments);
	const map = new Map<number, DayEntry[]>();
	for (let d = 1; d <= lastDay; d++) map.set(d, []);

	for (const [aptName, apt] of Object.entries(apartments)) {
		const colorIdx = aptNames.indexOf(aptName) % APARTMENT_COLORS.length;
		const aptColor =
			PAYMENT_SOURCE_BG[apt.reservations[0]?.payment_source] ?? APARTMENT_COLORS[colorIdx].replace('0.8)', '1)');

		for (const res of apt.reservations) {
			const checkIn = new Date(res.check_in + 'T00:00:00');
			const checkOut = new Date(res.check_out + 'T00:00:00');

			for (let d = 1; d <= lastDay; d++) {
				const current = new Date(year, month - 1, d);
				if (current >= checkIn && current < checkOut) {
					map.get(d)!.push({
						res,
						aptColor,
						isStart: current.getTime() === checkIn.getTime(),
						isEnd: new Date(year, month - 1, d + 1).getTime() === checkOut.getTime(),
					});
				}
			}
		}
	}

	return map;
}

interface CalendarContentProps {
	token: string | undefined;
}

const CalendarContent: React.FC<CalendarContentProps> = ({ token }) => {
	const router = useRouter();
	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
	const [buildingId, setBuildingId] = useState<number | ''>('');

	// Dialog state for create/edit
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogCheckIn, setDialogCheckIn] = useState('');
	const [dialogCheckOut, setDialogCheckOut] = useState('');
	const [editReservationId, setEditReservationId] = useState<number | undefined>(undefined);

	// Context menu state for existing reservations
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuReservation, setMenuReservation] = useState<ReservationListType | null>(null);

	const { data: planning, isLoading, refetch } = useGetPlanningQuery({ year, month, ...(buildingId ? { building: buildingId } : {}) }, { skip: !token });
	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const lastDay = planning?.last_day ?? new Date(year, month, 0).getDate();
	const firstWeekday = weekdayIndex(`${year}-${String(month).padStart(2, '0')}-01`);

	const dayMap = useMemo(
		() =>
			planning?.apartments ? buildDayMap(planning.apartments, year, month, lastDay) : new Map<number, DayEntry[]>(),
		[planning, year, month, lastDay],
	);

	const today = new Date();
	const isToday = (day: number) =>
		today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;

	const handleDayClick = (day: number) => {
		const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		// Default check_out to next day
		const nextDay = new Date(year, month - 1, day + 1);
		const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
		setDialogCheckIn(dateStr);
		setDialogCheckOut(nextDayStr);
		setEditReservationId(undefined);
		setDialogOpen(true);
	};

	const handleReservationClick = (e: React.MouseEvent<HTMLElement>, res: ReservationListType) => {
		e.stopPropagation();
		setMenuReservation(res);
		setMenuAnchor(e.currentTarget);
	};

	const handleMenuClose = () => {
		setMenuAnchor(null);
		setMenuReservation(null);
	};

	const handleView = () => {
		if (menuReservation) router.push(RESERVATIONS_VIEW(menuReservation.id));
		handleMenuClose();
	};

	const handleEdit = () => {
		if (menuReservation) {
			setEditReservationId(menuReservation.id);
			setDialogCheckIn('');
			setDialogCheckOut('');
			setDialogOpen(true);
		}
		handleMenuClose();
	};

	const handleDialogSuccess = () => {
		refetch();
	};

	const prevMonth = () => {
		if (month === 1) {
			setYear((y) => y - 1);
			setMonth(12);
		} else setMonth((m) => m - 1);
	};
	const nextMonth = () => {
		if (month === 12) {
			setYear((y) => y + 1);
			setMonth(1);
		} else setMonth((m) => m + 1);
	};

	// Build calendar grid cells (null = empty padding)
	const cells: (number | null)[] = [
		...Array(firstWeekday).fill(null),
		...Array.from({ length: lastDay }, (_, i) => i + 1),
	];
	// Pad to complete last row
	while (cells.length % 7 !== 0) cells.push(null);

	const weeks: (number | null)[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

	return (
		<>
			<Stack spacing={2} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
				{/* Month navigator */}
				<Card elevation={2} sx={{ borderRadius: 2 }}>
					<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
						<Stack direction="row" alignItems="center" justifyContent="space-between">
							<IconButton onClick={prevMonth} size="small">
								<ChevronLeftIcon />
							</IconButton>
							<Stack direction="row" spacing={1} alignItems="center">
								<CalendarMonthIcon color="primary" />
								<Typography variant="h6" fontWeight={700}>
									{MONTH_NAMES[month - 1]} {year}
								</Typography>
							</Stack>
							<Stack direction="row" spacing={1} alignItems="center">
								<FormControl size="small" sx={{ minWidth: 160 }}>
									<InputLabel>Résidence</InputLabel>
									<Select
										value={buildingId}
										label="Résidence"
										onChange={(e) => setBuildingId(e.target.value as number | '')}
									>
										<MenuItem value="">Toutes</MenuItem>
										{(buildingsData ?? []).map((b) => (
											<MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
										))}
									</Select>
								</FormControl>
								<Button
									size="small"
									variant="contained"
									startIcon={<AddIcon />}
									onClick={() => {
										setDialogCheckIn('');
										setDialogCheckOut('');
										setEditReservationId(undefined);
										setDialogOpen(true);
									}}
								>
									Nouvelle réservation
								</Button>
								<IconButton onClick={nextMonth} size="small">
									<ChevronRightIcon />
								</IconButton>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				{/* Calendar grid */}
				<Box sx={{ position: 'relative' }}>
					{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
					<Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
						<Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
							<Box sx={{ minWidth: 700 }}>
								{/* Day headers */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: 'repeat(7, 1fr)',
										borderBottom: '1px solid',
										borderColor: 'divider',
									}}
								>
									{DAY_ABBREVIATIONS.map((day, idx) => (
										<Box
											key={idx}
											sx={{
												p: 1,
												textAlign: 'center',
												backgroundColor: idx >= 5 ? 'action.hover' : 'background.paper',
												borderRight: idx < 6 ? '1px solid' : 'none',
												borderColor: 'divider',
											}}
										>
											<Typography variant="caption" fontWeight={700} color="text.secondary">
												{day}
											</Typography>
										</Box>
									))}
								</Box>

								{/* Weeks */}
								{weeks.map((week, wIdx) => (
									<Box key={wIdx}>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: 'repeat(7, 1fr)',
											}}
										>
											{week.map((day, dIdx) => {
												const entries = day !== null ? (dayMap.get(day) ?? []) : [];
												return (
													<Box
														key={dIdx}
														onClick={() => day !== null && handleDayClick(day)}
														sx={{
															minHeight: 90,
															p: 0.5,
															borderRight: dIdx < 6 ? '1px solid' : 'none',
															borderBottom: '1px solid',
															borderColor: 'divider',
															backgroundColor:
																day === null
																	? 'action.disabledBackground'
																	: dIdx >= 5
																		? 'rgba(0,0,0,0.02)'
																		: 'background.paper',
															verticalAlign: 'top',
															cursor: day !== null ? 'pointer' : 'default',
															'&:hover': day !== null ? { bgcolor: 'action.hover' } : {},
														}}
													>
														{day !== null && (
															<>
																<Stack direction="row" justifyContent="space-between" alignItems="center">
																	<Typography
																		variant="caption"
																		fontWeight={isToday(day) ? 900 : 400}
																		sx={{
																			display: 'inline-flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																			width: 22,
																			height: 22,
																			borderRadius: '50%',
																			backgroundColor: isToday(day) ? 'primary.main' : 'transparent',
																			color: isToday(day) ? 'primary.contrastText' : 'text.primary',
																			mb: 0.25,
																		}}
																	>
																		{day}
																	</Typography>
																</Stack>
																<Stack spacing={0.25}>
																	{entries.map(({ res, aptColor, isStart }, eIdx) => (
																		<Tooltip
																			key={eIdx}
																			title={`${res.guest_name} — ${res.apartment_nom} (${res.check_in} → ${res.check_out})`}
																			placement="top"
																		>
																			<Box
																				onClick={(e) => handleReservationClick(e, res)}
																				sx={{
																					backgroundColor: aptColor,
																					color: '#fff',
																					borderRadius: isStart ? '4px 4px 4px 4px' : '0 4px 4px 0',
																					px: 0.5,
																					py: 0.1,
																					cursor: 'pointer',
																					overflow: 'hidden',
																					fontSize: '0.65rem',
																					lineHeight: 1.4,
																					fontWeight: 600,
																					whiteSpace: 'nowrap',
																					textOverflow: 'ellipsis',
																					'&:hover': { opacity: 0.85 },
																				}}
																			>
																				{isStart || day === 1 ? res.guest_name : '\u00a0'}
																			</Box>
																		</Tooltip>
																	))}
																</Stack>
															</>
														)}
													</Box>
												);
											})}
										</Box>
										{wIdx < weeks.length - 1 && <Divider />}
									</Box>
								))}
							</Box>
						</Box>
					</Card>
				</Box>

				{/* Legend */}
				{planning?.apartments && Object.values(planning.apartments).length > 0 && (
					<Card elevation={1} sx={{ borderRadius: 2 }}>
						<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
							<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
								<Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
									Appartements :
								</Typography>
								{Object.entries(planning.apartments).map(([nom]) => {
									const aptNames = Object.keys(planning.apartments);
									const colorIdx = aptNames.indexOf(nom) % APARTMENT_COLORS.length;
									const color = APARTMENT_COLORS[colorIdx].replace('0.8)', '1)');
									return (
										<Chip
											key={nom}
											label={nom}
											size="small"
											sx={{ backgroundColor: color, color: '#fff', fontWeight: 600 }}
										/>
									);
								})}
							</Stack>
						</CardContent>
					</Card>
				)}
			</Stack>

			{/* Reservation context menu (view / edit) */}
			<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
				<MenuItem onClick={handleView}>
					<Stack direction="row" spacing={1} alignItems="center">
						<VisibilityIcon fontSize="small" />
						<Typography variant="body2">Voir la réservation</Typography>
					</Stack>
				</MenuItem>
				<MenuItem onClick={handleEdit}>
					<Stack direction="row" spacing={1} alignItems="center">
						<EditIcon fontSize="small" />
						<Typography variant="body2">Modifier la réservation</Typography>
					</Stack>
				</MenuItem>
			</Menu>

			{/* Create / Edit dialog */}
			<ReservationDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSuccess={handleDialogSuccess}
				token={token}
				initialCheckIn={dialogCheckIn}
				initialCheckOut={dialogCheckOut}
				reservationId={editReservationId}
			/>
		</>
	);
};

const CalendarClient: React.FC<SessionProps> = ({ session }) => {
	const token = useInitAccessToken(session);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Calendrier">
				<Protected permission="can_view">
					<CalendarContent token={token} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default CalendarClient;
