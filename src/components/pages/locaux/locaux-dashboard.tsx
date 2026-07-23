'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip as MuiTooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	CalendarToday as CalendarTodayIcon,
	Home as HomeIcon,
	HomeWork as HomeWorkIcon,
	InfoOutlined as InfoIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Title,
	Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import type { SessionProps } from '@/types/_initTypes';
import type { LocalDashboardLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { LOCAUX_VIEW } from '@/utils/routes';
import type { ChipColor } from '@/utils/rawData';
import { CHART_OPTS, LOCAL_TYPE_LABEL_KEYS, TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useGetBuildingsQuery, useGetLocalDashboardQuery, useGetLocalYearsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	color: string;
	tooltip?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, color, tooltip }) => (
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
		</CardContent>
	</Card>
);

const formatSignedMad = (value: number | string, sign: '+' | '-') =>
	`${sign}${Number(value).toLocaleString('fr-MA')} MAD`;

interface ChartCardProps {
	title: string;
	subheader: string;
	children: React.ReactNode;
	infoTooltip?: string;
	height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subheader, children, infoTooltip, height = 280 }) => (
	<Card elevation={2} sx={{ height: '100%', overflow: 'hidden' }}>
		<CardHeader
			title={
				<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
					{title}
				</Typography>
			}
			subheader={subheader}
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

const EmptyChart: React.FC = () => {
	const { t } = useLanguage();
	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				border: '1px dashed',
				borderColor: 'grey.300',
				borderRadius: 2,
				bgcolor: 'grey.50',
			}}
		>
			<Typography variant="body2" color="text.secondary">
				{t.analytics.noDataAvailable}
			</Typography>
		</Box>
	);
};

const LocauxDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const [buildingId, setBuildingId] = useState<number | ''>('');

	const { data: yearsData } = useGetLocalYearsQuery(undefined, { skip: !token });
	const availableYears = useMemo(() => {
		const yrs = yearsData?.years ?? [];
		if (!yrs.includes(currentYear)) return [...yrs, currentYear].sort((a, b) => b - a);
		return [...yrs].sort((a, b) => b - a);
	}, [yearsData, currentYear]);

	const { data: buildingsData } = useGetBuildingsQuery(undefined, { skip: !token });

	const buildingItems: DropDownType[] = useMemo(
		() => [
			{ code: t.locaux.allResidences, value: t.locaux.allResidences },
			...(buildingsData ?? []).map((b) => ({ code: b.nom, value: b.nom })),
		],
		[buildingsData, t],
	);

	const yearItems: DropDownType[] = useMemo(
		() => availableYears.map((y) => ({ code: String(y), value: String(y) })),
		[availableYears],
	);

	const { data: dashboardData, isLoading } = useGetLocalDashboardQuery(
		{ year, ...(buildingId ? { building: buildingId } : {}) },
		{ skip: !token },
	);
	const locaux = useMemo(() => (dashboardData?.locaux ?? []) as LocalDashboardLocalType[], [dashboardData]);
	const monthlyRents = dashboardData?.monthly_rents ?? [];

	const monthlyPaid = t.rawData.monthLabels.map(
		(_, index) => Number(monthlyRents.find((item) => item.month === index + 1)?.paid ?? 0),
	);
	const monthlyUnpaid = t.rawData.monthLabels.map(
		(_, index) => Number(monthlyRents.find((item) => item.month === index + 1)?.unpaid ?? 0),
	);
	const hasMonthlyRentData = [...monthlyPaid, ...monthlyUnpaid].some((amount) => amount > 0);

	const monthlyRentChartData = {
		labels: t.rawData.monthLabels,
		datasets: [
			{
				label: t.locaux.paidRents,
				data: monthlyPaid,
				backgroundColor: 'rgba(46, 125, 50, 0.8)',
				borderRadius: 4,
			},
			{
				label: t.locaux.unpaidRents,
				data: monthlyUnpaid,
				backgroundColor: 'rgba(211, 47, 47, 0.75)',
				borderRadius: 4,
			},
		],
	};

	const rentalStatusChartData = {
		labels: [t.locaux.inRentalCount, t.locaux.freeCount],
		datasets: [
			{
				data: [dashboardData?.total_en_location ?? 0, dashboardData?.total_libres ?? 0],
				backgroundColor: ['rgba(25, 118, 210, 0.8)', 'rgba(237, 108, 2, 0.8)'],
				borderWidth: 1,
			},
		],
	};

	const rentBalanceChartData = {
		labels: locaux.map((local) => local.nom),
		datasets: [
			{
				label: t.locaux.paidRents,
				data: locaux.map((local) => Number(local.loyers_payes)),
				backgroundColor: 'rgba(46, 125, 50, 0.8)',
				borderRadius: 4,
			},
			{
				label: t.locaux.unpaidRents,
				data: locaux.map((local) => Number(local.loyers_impayes)),
				backgroundColor: 'rgba(211, 47, 47, 0.75)',
				borderRadius: 4,
			},
		],
	};

	const profitabilityChartData = {
		labels: locaux.map((local) => local.nom),
		datasets: [
			{
				label: `${t.locaux.profitability} (%)`,
				data: locaux.map((local) => Number(local.rentabilite)),
				backgroundColor: 'rgba(156, 39, 176, 0.75)',
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
				overflowX: 'auto',
				overflowY: 'hidden',
			}}
		>
			<NavigationBar title={t.locaux.locauxDashboard}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
						<Stack
							direction="row"
							sx={{
								justifyContent: 'space-between',
								alignItems: 'center',
								flexWrap: 'wrap',
								gap: 1,
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 600,
								}}
							>
								{t.locaux.locauxDashboard}
							</Typography>
							<Stack direction="row" spacing={2}>
								<Box sx={{ minWidth: 180 }}>
									<CustomDropDownSelect
										id="building-filter"
										size="small"
										label={t.locaux.residence}
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
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (
							<>
								{/* KPI cards */}
								<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
									<KpiCard
										icon={<AttachMoneyIcon fontSize="small" />}
										label={t.locaux.profitHTYear(year)}
										value={`${Number(dashboardData?.total_benefice_ht ?? 0).toLocaleString('fr-MA')} MAD`}
										color="#2e7d32"
										tooltip={t.locaux.totalPaidMinusUnpaid}
									/>
									<KpiCard
										icon={<HomeWorkIcon fontSize="small" />}
										label={t.locaux.inRentalCount}
										value={dashboardData?.total_en_location ?? 0}
										color="#1976d2"
										tooltip={t.locaux.inRentalTooltip}
									/>
									<KpiCard
										icon={<HomeIcon fontSize="small" />}
										label={t.locaux.freeCount}
										value={dashboardData?.total_libres ?? 0}
										color="#ed6c02"
										tooltip={t.locaux.freeTooltip}
									/>
									</Box>

									{/* Dashboard charts */}
									<ChartCard
										title={t.locaux.monthlyRentCollection}
										subheader={t.locaux.monthlyRentCollectionSubheader(year)}
										infoTooltip={t.locaux.monthlyRentCollectionTooltip}
									>
										{hasMonthlyRentData ? (
											<Bar
												data={monthlyRentChartData}
												options={{
													...CHART_OPTS,
													scales: { x: { stacked: false }, y: { beginAtZero: true } },
												}}
											/>
										) : (
											<EmptyChart />
										)}
									</ChartCard>

									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.8fr) minmax(0, 1.2fr)' },
											gap: 2,
										}}
									>
										<ChartCard
											title={t.locaux.rentalStatusDistribution}
											subheader={t.locaux.rentalStatusDistributionSubheader}
										>
											{locaux.length > 0 ? (
												<Doughnut
													data={rentalStatusChartData}
													options={{
														...CHART_OPTS,
														cutout: '62%',
														plugins: { legend: { position: 'bottom' } },
													}}
												/>
											) : (
												<EmptyChart />
											)}
										</ChartCard>

										<ChartCard
											title={t.locaux.profitabilityComparison}
											subheader={t.locaux.profitabilityComparisonSubheader}
										>
											{locaux.some((local) => Number(local.rentabilite) > 0) ? (
												<Bar
													data={profitabilityChartData}
													options={{
														...CHART_OPTS,
														indexAxis: 'y',
														plugins: { legend: { display: false } },
														scales: { x: { beginAtZero: true } },
													}}
												/>
											) : (
												<EmptyChart />
											)}
										</ChartCard>
									</Box>

									<ChartCard
										title={t.locaux.rentBalanceByLocal}
										subheader={t.locaux.rentBalanceByLocalSubheader}
										height={Math.max(300, Math.min(520, locaux.length * 32))}
									>
										{locaux.some(
											(local) => Number(local.loyers_payes) > 0 || Number(local.loyers_impayes) > 0,
										) ? (
											<Bar
												data={rentBalanceChartData}
												options={{
													...CHART_OPTS,
													indexAxis: 'y',
													scales: { x: { beginAtZero: true } },
												}}
											/>
										) : (
											<EmptyChart />
										)}
									</ChartCard>

									{/* Locaux table */}
								{locaux.length === 0 ? (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ py: 6, textAlign: 'center' }}>
											<BusinessIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
											<Typography
												sx={{
													color: 'text.secondary',
												}}
											>
												{t.locaux.noLocauxRegistered}
											</Typography>
										</CardContent>
									</Card>
								) : (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: { xs: 1, md: 2 } }}>
											<Stack
												direction="row"
												spacing={2}
												sx={{
													alignItems: 'center',
													mb: 2,
													px: 1,
												}}
											>
												<TrendingUpIcon color="primary" />
												<Typography
													variant="h6"
													sx={{
														fontWeight: 700,
													}}
												>
													{t.locaux.profitabilityByLocal}
												</Typography>
											</Stack>
											{isMobile ? (
												<Stack spacing={1.5}>
													{locaux.map((local) => {
														const typeColor = (TYPE_LOCAL_CHIP_COLORS[local.type_local] ?? 'default') as ChipColor;
														return (
															<Card
																key={local.id}
																elevation={1}
																sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
																onClick={() => router.push(LOCAUX_VIEW(local.id))}
															>
																<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
																	<Stack
																		direction="row"
																		sx={{
																			justifyContent: 'space-between',
																			alignItems: 'center',
																			mb: 1,
																		}}
																	>
																		<Typography
																			variant="body2"
																			sx={{
																				fontWeight: 600,
																			}}
																		>
																			{local.nom}
																		</Typography>
																		<Stack direction="row" spacing={0.5}>
																			<Chip
																				label={t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[local.type_local]]}
																				size="small"
																				color={typeColor}
																				variant="outlined"
																			/>
																			<Chip
																				label={local.en_location ? t.locaux.inRental : t.common.free}
																				size="small"
																				color={local.en_location ? 'success' : 'default'}
																				variant="outlined"
																			/>
																		</Stack>
																	</Stack>
																	<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'text.secondary',
																			}}
																		>
																			{t.locaux.paidRents}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'success.main',
																				fontWeight: 600,
																				textAlign: 'right',
																			}}
																		>
																				{formatSignedMad(local.loyers_payes, '+')}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'text.secondary',
																			}}
																		>
																			{t.locaux.unpaidRents}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'error.main',
																				fontWeight: 600,
																				textAlign: 'right',
																			}}
																		>
																				{formatSignedMad(local.loyers_impayes, '-')}
																		</Typography>
																		<Typography
																			variant="caption"
																			sx={{
																				color: 'text.secondary',
																			}}
																		>
																			{t.locaux.profitability}
																		</Typography>
																		<Typography
																			variant="caption"
																			color="primary"
																			sx={{
																				fontWeight: 700,
																				textAlign: 'right',
																			}}
																		>
																			{local.rentabilite}%
																		</Typography>
																	</Box>
																</CardContent>
															</Card>
														);
													})}
												</Stack>
											) : (
												<TableContainer>
													<Table size="small">
														<TableHead>
															<TableRow>
																<TableCell sx={{ fontWeight: 700 }}>{t.common.name}</TableCell>
																<TableCell sx={{ fontWeight: 700 }}>{t.common.type}</TableCell>
																<TableCell sx={{ fontWeight: 700 }}>{t.common.status}</TableCell>
																<TableCell sx={{ fontWeight: 700 }} align="right">
																	{t.locaux.purchasePrice}
																</TableCell>
																<TableCell sx={{ fontWeight: 700 }} align="right">
																	{t.locaux.rentPerMonth}
																</TableCell>
																<TableCell sx={{ fontWeight: 700 }} align="right">
																	{t.locaux.paidRents}
																</TableCell>
																<TableCell sx={{ fontWeight: 700 }} align="right">
																	{t.locaux.unpaidRents}
																</TableCell>
																<TableCell sx={{ fontWeight: 700 }} align="right">
																	{t.locaux.profitability}
																</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{locaux.map((local) => {
																const typeColor = (TYPE_LOCAL_CHIP_COLORS[local.type_local] ?? 'default') as ChipColor;
																return (
																	<TableRow
																		key={local.id}
																		hover
																		sx={{ cursor: 'pointer' }}
																		onClick={() => router.push(LOCAUX_VIEW(local.id))}
																	>
																		<TableCell>
																			<Typography
																				variant="body2"
																				sx={{
																					fontWeight: 600,
																				}}
																			>
																				{local.nom}
																			</Typography>
																		</TableCell>
																		<TableCell>
																			<Chip
																				label={t.rawData.localTypes[LOCAL_TYPE_LABEL_KEYS[local.type_local]]}
																				size="small"
																				color={typeColor}
																				variant="outlined"
																			/>
																		</TableCell>
																		<TableCell>
																			<Chip
																				label={local.en_location ? t.locaux.inRental : t.common.free}
																				size="small"
																				color={local.en_location ? 'success' : 'default'}
																				variant="outlined"
																			/>
																		</TableCell>
																		<TableCell align="right">
																			{Number(local.prix_achat).toLocaleString('fr-MA')} MAD
																		</TableCell>
																		<TableCell align="right">
																			{Number(local.prix_location_mensuel).toLocaleString('fr-MA')} MAD
																		</TableCell>
																		<TableCell align="right">
																			<Typography
																				sx={{
																					color: 'success.main',
																					fontWeight: 600,
																				}}
																			>
																				{formatSignedMad(local.loyers_payes, '+')}
																			</Typography>
																		</TableCell>
																		<TableCell align="right">
																			<Typography
																				sx={{
																					color: 'error.main',
																					fontWeight: 600,
																				}}
																			>
																				{formatSignedMad(local.loyers_impayes, '-')}
																			</Typography>
																		</TableCell>
																		<TableCell align="right">
																			<Typography
																				color="primary"
																				sx={{
																					fontWeight: 700,
																				}}
																			>
																				{local.rentabilite}%
																			</Typography>
																		</TableCell>
																	</TableRow>
																);
															})}
														</TableBody>
													</Table>
												</TableContainer>
											)}
										</CardContent>
									</Card>
								)}
							</>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default LocauxDashboardClient;
