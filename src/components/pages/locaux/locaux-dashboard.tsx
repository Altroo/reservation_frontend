'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
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
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Business as BusinessIcon,
	Home as HomeIcon,
	HomeWork as HomeWorkIcon,
	TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { LocalDashboardLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { LOCAUX_LIST, LOCAUX_VIEW } from '@/utils/routes';
import { TYPE_LOCAL_CHIP_COLORS } from '@/utils/rawData';
import { useGetLocalDashboardQuery, useGetLocalYearsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import type { ChipColor } from '@/utils/rawData';
import Styles from '@/styles/dashboard/dashboard.module.sass';

interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, color }) => (
	<Card elevation={2} sx={{ borderRadius: 2, flex: 1, minWidth: 200 }}>
		<CardContent sx={{ p: 2 }}>
			<Stack direction="row" spacing={2} alignItems="center">
				<Box sx={{ color: color ?? 'primary.main', display: 'flex' }}>{icon}</Box>
				<Stack>
					<Typography variant="caption" color="text.secondary">{label}</Typography>
					<Typography variant="h6" fontWeight={700}>{value}</Typography>
				</Stack>
			</Stack>
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

	const { data: yearsData } = useGetLocalYearsQuery(undefined, { skip: !token });
	const availableYears = useMemo(() => {
		const yrs = yearsData?.years ?? [];
		if (!yrs.includes(currentYear)) return [...yrs, currentYear].sort((a, b) => b - a);
		return [...yrs].sort((a, b) => b - a);
	}, [yearsData, currentYear]);

	const { data: dashboardData, isLoading } = useGetLocalDashboardQuery({ year }, { skip: !token });
	const locaux = useMemo(() => (dashboardData?.locaux ?? []) as LocalDashboardLocalType[], [dashboardData]);

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px" sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
			<NavigationBar title="Dashboard des Locaux">
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							justifyContent="space-between"
							alignItems={isMobile ? 'stretch' : 'center'}
							spacing={2}
						>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(LOCAUX_LIST)} sx={{ width: isMobile ? '100%' : 'auto' }}>
								Liste des locaux
							</Button>
							<Stack direction="row" spacing={1} alignItems="center">
								<IconButton size="small" onClick={() => setYear((y) => y - 1)}>
									<ArrowBackIcon fontSize="small" />
								</IconButton>
								<Typography fontWeight={700} variant="h6">{year}</Typography>
								<IconButton size="small" onClick={() => setYear((y) => y + 1)} sx={{ transform: 'rotate(180deg)' }}>
									<ArrowBackIcon fontSize="small" />
								</IconButton>
							</Stack>
						</Stack>

						{availableYears.length > 1 && (
							<Stack direction="row" spacing={1} flexWrap="wrap">
								{availableYears.map((y) => (
									<Chip
										key={y}
										label={y}
										size="small"
										color={y === year ? 'primary' : 'default'}
										variant={y === year ? 'filled' : 'outlined'}
										onClick={() => setYear(y)}
									/>
								))}
							</Stack>
						)}

						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (
							<>
								{/* KPI cards */}
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
									<KpiCard
										icon={<AttachMoneyIcon fontSize="large" />}
										label={`Bénéfice HT ${year}`}
										value={`${Number(dashboardData?.total_benefice_ht ?? 0).toLocaleString('fr-MA')} MAD`}
										color="success.main"
									/>
									<KpiCard
										icon={<HomeWorkIcon fontSize="large" />}
										label="En location"
										value={dashboardData?.total_en_location ?? 0}
										color="primary.main"
									/>
									<KpiCard
										icon={<HomeIcon fontSize="large" />}
										label="Libres"
										value={dashboardData?.total_libres ?? 0}
										color="warning.main"
									/>
								</Stack>

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
