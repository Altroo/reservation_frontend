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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import type { SessionProps } from '@/types/_initTypes';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import {
	useGetBalanceQuery,
	useGetBuildingsQuery,
	useGetReservationYearsQuery,
	useToggleAmountReturnedMutation,
} from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { formatNumberMA as fmt } from '@/utils/helpers';

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

const BalanceClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data, isLoading } = useGetBalanceQuery(
		{ year, ...(buildingId ? { building: buildingId } : {}) },
		{ skip: !token },
	);
	const { data: yearsData } = useGetReservationYearsQuery(undefined, { skip: !token });
	const [toggleAmountReturned] = useToggleAmountReturnedMutation();
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

	const apartments = data?.apartments ?? {};
	const aptNoms = Object.keys(apartments);
	const totalReturned = data?.total_returned ?? 0;
	const totalNotReturned = data?.total_not_returned ?? 0;
	const totalBalance = totalReturned + totalNotReturned;
	const reservations = data?.reservations ?? [];

	const totalByMonth: number[] = Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		return aptNoms.reduce((sum, nom) => {
			return sum + (apartments[nom].monthly[month]?.total ?? 0);
		}, 0);
	});

	const handleToggleReturned = async (id: number, currentValue: boolean) => {
		await toggleAmountReturned({ id, amount_returned: !currentValue });
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
			<NavigationBar title={t.reservations.balance}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack
							direction="row"
							sx={{
								justifyContent: 'space-between',
								alignItems: 'center',
								py: 2,
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 600,
								}}
							>
								{t.reservations.balanceYear(year)}
							</Typography>
							<Stack direction="row" spacing={1}>
								<Box sx={{ minWidth: 180 }}>
									<CustomDropDownSelect
										id="building-filter"
										size="small"
										label={t.common.residence}
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
								{/* Balance KPIs */}
								<Box
									sx={{
										display: 'grid',
										gap: 2,
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
									}}
								>
									<KpiCard
										color="#1565c0"
										icon={<AccountBalanceWalletIcon />}
										label={t.reservations.totalBalance}
										value={`${fmt(totalBalance)} MAD`}
										tooltip={t.reservations.totalBalanceTooltip}
									/>
									<KpiCard
										color="#2e7d32"
										icon={<CheckCircleOutlinedIcon />}
										label={t.reservations.amountReturned}
										value={`${fmt(totalReturned)} MAD`}
										tooltip={t.reservations.amountReturnedTooltip}
									/>
									<KpiCard
										color="#d32f2f"
										icon={<HighlightOffIcon />}
										label={t.reservations.amountNotReturned}
										value={`${fmt(totalNotReturned)} MAD`}
										tooltip={t.reservations.amountNotReturnedTooltip}
									/>
									<KpiCard
										color="#6a1b9a"
										icon={<HomeWorkIcon />}
										label={t.reservations.apartmentCount}
										value={`${aptNoms.length}`}
										tooltip={t.reservations.apartmentCountTooltip}
									/>
								</Box>

								{/* Detail table: individual reservations with toggle */}
								<Card elevation={2}>
									<CardHeader
										title={t.reservations.reservationDetail}
										subheader={t.reservations.reservationDetailSubheader(year)}
										action={
											<MuiTooltip title={t.reservations.toggleReturnedTooltip} arrow>
												<IconButton size="small">
													<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
												</IconButton>
											</MuiTooltip>
										}
									/>
									<CardContent sx={{ p: 0 }}>
										<TableContainer component={Paper} elevation={0}>
											<Table size="small" sx={{ minWidth: 700 }}>
												<TableHead>
													<TableRow sx={{ bgcolor: 'primary.main' }}>
														<TableCell
															sx={{
																color: 'white',
																fontWeight: 700,
																position: 'sticky',
																left: 0,
																zIndex: 3,
																bgcolor: 'primary.main',
															}}
														>
															{t.reservations.apartment}
														</TableCell>
														<TableCell sx={{ color: 'white', fontWeight: 700 }}>
															{t.reservations.columnClient}
														</TableCell>
														<TableCell sx={{ color: 'white', fontWeight: 600 }}>{t.reservations.arrival}</TableCell>
														<TableCell sx={{ color: 'white', fontWeight: 600 }}>{t.reservations.departure}</TableCell>
														<TableCell align="right" sx={{ color: 'white', fontWeight: 700 }}>
															{t.reservations.amountLabel}
														</TableCell>
														<TableCell sx={{ color: 'white', fontWeight: 600 }}>
															{t.reservations.columnSource}
														</TableCell>
														<TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>
															{t.reservations.returned}
														</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{reservations.length === 0 ? (
														<TableRow>
															<TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
																{t.reservations.noDataForYear(year)}
															</TableCell>
														</TableRow>
													) : (
														reservations.map((r, idx) => (
															<TableRow
																key={r.id}
																sx={{ bgcolor: idx % 2 === 0 ? 'background.default' : 'action.hover' }}
															>
																<TableCell
																	sx={{ fontWeight: 600, position: 'sticky', left: 0, zIndex: 1, bgcolor: 'inherit' }}
																>
																	{r.apartment_nom}
																</TableCell>
																<TableCell>{r.guest_name}</TableCell>
																<TableCell>{r.check_in}</TableCell>
																<TableCell>{r.check_out}</TableCell>
																<TableCell align="right" sx={{ fontWeight: 600 }}>
																	{fmt(r.amount)} MAD
																</TableCell>
																<TableCell>{r.payment_source}</TableCell>
																<TableCell align="center">
																	<Chip
																		icon={r.amount_returned ? <CheckCircleOutlinedIcon /> : <HighlightOffIcon />}
																		label={r.amount_returned ? t.common.yes : t.common.no}
																		color={r.amount_returned ? 'success' : 'error'}
																		size="small"
																		variant="outlined"
																		onClick={() => handleToggleReturned(r.id, r.amount_returned)}
																		sx={{ cursor: 'pointer', fontWeight: 600 }}
																	/>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</TableContainer>
									</CardContent>
								</Card>

								{/* Matrix table: apartment × month */}
								<Card elevation={2}>
									<CardHeader
										title={t.reservations.revenueByApartmentMonth}
										subheader={t.reservations.revenueByApartmentMonthSub(year)}
										action={
											<MuiTooltip title={t.reservations.matrixTooltip} arrow>
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
														<TableCell
															sx={{
																color: 'white',
																fontWeight: 700,
																width: 100,
																position: 'sticky',
																left: 0,
																zIndex: 3,
																bgcolor: 'primary.main',
															}}
														>
															{t.reservations.apartment}
														</TableCell>
														{t.rawData.monthLabels.map((m) => (
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
															{t.common.total}
														</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{aptNoms.map((nom, rowIdx) => {
														const apt = apartments[nom];
														return (
															<TableRow
																key={nom}
																sx={{
																	bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover',
																}}
															>
																<TableCell
																	sx={{ fontWeight: 600, position: 'sticky', left: 0, zIndex: 1, bgcolor: 'inherit' }}
																>
																	{nom}
																</TableCell>
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
														<TableCell
															sx={{ fontWeight: 700, position: 'sticky', left: 0, zIndex: 1, bgcolor: 'primary.light' }}
														>
															{t.common.total}
														</TableCell>
														{totalByMonth.map((total, i) => (
															<TableCell
																key={i}
																align="right"
																sx={{
																	fontWeight: 600,
																	fontSize: '0.75rem',
																	color: total > 0 ? 'text.primary' : 'text.disabled',
																}}
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
															{fmt(aptNoms.reduce((s, c) => s + apartments[c].year_total, 0))}
														</TableCell>
													</TableRow>

													{aptNoms.length === 0 && (
														<TableRow>
															<TableCell colSpan={14} align="center" sx={{ py: 4, color: 'text.secondary' }}>
																{t.reservations.noDataForYear(year)}
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
