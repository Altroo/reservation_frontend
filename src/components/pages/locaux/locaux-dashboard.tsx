'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Card,
	CardContent,
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
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import type { SessionProps } from '@/types/_initTypes';
import type { LocalDashboardLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { LOCAUX_VIEW } from '@/utils/routes';
import { TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useGetLocalDashboardQuery, useGetLocalYearsQuery, useGetBuildingsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ChipColor } from '@/utils/rawData';
import Styles from '@/styles/dashboard/dashboard.module.sass';

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
			<Typography variant="h5" fontWeight={700}>{value}</Typography>
		</CardContent>
	</Card>
);

const LocauxDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
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
		() => [{ code: 'Toutes', value: 'Toutes' }, ...(buildingsData ?? []).map((b) => ({ code: b.nom, value: b.nom }))],
		[buildingsData],
	);

	const yearItems: DropDownType[] = useMemo(
		() => availableYears.map((y) => ({ code: String(y), value: String(y) })),
		[availableYears],
	);

	const { data: dashboardData, isLoading } = useGetLocalDashboardQuery({ year, ...(buildingId ? { building: buildingId } : {}) }, { skip: !token });
	const locaux = useMemo(() => (dashboardData?.locaux ?? []) as LocalDashboardLocalType[], [dashboardData]);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px" sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
			<NavigationBar title="Dashboard des locaux">
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
							<Typography variant="h5" fontWeight={600}>
								Dashboard des locaux
							</Typography>
							<Stack direction="row" spacing={2}>
							<Box sx={{ minWidth: 180 }}>
								<CustomDropDownSelect
									id="building-filter"
									size="small"
									label="Résidence"
									items={buildingItems}
									value={buildingId === '' ? 'Toutes' : ((buildingsData ?? []).find((b) => b.id === buildingId)?.nom ?? 'Toutes')}
									onChange={(e) => {
										const name = e.target.value;
										if (!name || name === 'Toutes') setBuildingId('');
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
									label="Année"
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
										label={`Bénéfice HT ${year}`}
										value={`${Number(dashboardData?.total_benefice_ht ?? 0).toLocaleString('fr-MA')} MAD`}
										color="#2e7d32"
										tooltip="Total des loyers payés moins les loyers impayés"
									/>
									<KpiCard
										icon={<HomeWorkIcon fontSize="small" />}
										label="En location"
										value={dashboardData?.total_en_location ?? 0}
										color="#1976d2"
										tooltip="Nombre de locaux actuellement en location"
									/>
									<KpiCard
										icon={<HomeIcon fontSize="small" />}
										label="Libres"
										value={dashboardData?.total_libres ?? 0}
										color="#ed6c02"
										tooltip="Nombre de locaux actuellement libres"
									/>
								</Box>

								{/* Locaux table */}
								{locaux.length === 0 ? (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ py: 6, textAlign: 'center' }}>
											<BusinessIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
											<Typography color="text.secondary">Aucun local enregistré.</Typography>
										</CardContent>
									</Card>
								) : (
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: { xs: 1, md: 2 } }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, px: 1 }}>
												<TrendingUpIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>Rentabilité par local</Typography>
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
																	<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
																		<Typography variant="body2" fontWeight={600}>{local.nom}</Typography>
																		<Stack direction="row" spacing={0.5}>
																			<Chip label={local.type_local} size="small" color={typeColor} variant="outlined" />
																			<Chip label={local.en_location ? 'Loué' : 'Libre'} size="small" color={local.en_location ? 'success' : 'default'} variant="outlined" />
																		</Stack>
																	</Stack>
																	<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
																		<Typography variant="caption" color="text.secondary">Loyers payés</Typography>
																		<Typography variant="caption" color="success.main" fontWeight={600} textAlign="right">
																			{Number(local.loyers_payes).toLocaleString('fr-MA')} MAD
																		</Typography>
																		<Typography variant="caption" color="text.secondary">Loyers impayés</Typography>
																		<Typography variant="caption" color="error.main" fontWeight={600} textAlign="right">
																			{Number(local.loyers_impayes).toLocaleString('fr-MA')} MAD
																		</Typography>
																		<Typography variant="caption" color="text.secondary">Rentabilité</Typography>
																		<Typography variant="caption" fontWeight={700} color="primary" textAlign="right">
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
															<TableCell sx={{ fontWeight: 700 }}>Nom</TableCell>
															<TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
															<TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
															<TableCell sx={{ fontWeight: 700 }} align="right">Prix d&apos;achat</TableCell>
															<TableCell sx={{ fontWeight: 700 }} align="right">Loyer/mois</TableCell>
															<TableCell sx={{ fontWeight: 700 }} align="right">Loyers payés</TableCell>
															<TableCell sx={{ fontWeight: 700 }} align="right">Loyers impayés</TableCell>
															<TableCell sx={{ fontWeight: 700 }} align="right">Rentabilité</TableCell>
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
																		<Typography variant="body2" fontWeight={600}>{local.nom}</Typography>
																	</TableCell>
																	<TableCell>
																		<Chip label={local.type_local} size="small" color={typeColor} variant="outlined" />
																	</TableCell>
																	<TableCell>
																		<Chip
																			label={local.en_location ? 'En location' : 'Libre'}
																			size="small"
																			color={local.en_location ? 'success' : 'default'}
																			variant="outlined"
																		/>
																	</TableCell>
																	<TableCell align="right">{Number(local.prix_achat).toLocaleString('fr-MA')} MAD</TableCell>
																	<TableCell align="right">{Number(local.prix_location_mensuel).toLocaleString('fr-MA')} MAD</TableCell>
																	<TableCell align="right">
																		<Typography color="success.main" fontWeight={600}>
																			{Number(local.loyers_payes).toLocaleString('fr-MA')} MAD
																		</Typography>
																	</TableCell>
																	<TableCell align="right">
																		<Typography color="error.main" fontWeight={600}>
																			{Number(local.loyers_impayes).toLocaleString('fr-MA')} MAD
																		</Typography>
																	</TableCell>
																	<TableCell align="right">
																		<Typography fontWeight={700} color="primary">{local.rentabilite}%</Typography>
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
