'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
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
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	CalendarMonth as CalendarMonthIcon,
	CheckCircleOutline as CheckCircleOutlineIcon,
	HighlightOff as HighlightOffIcon,
	InfoOutlined as InfoOutlinedIcon,
	RemoveCircleOutline as EmptyIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { PlanningLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { LOCAUX_VIEW } from '@/utils/routes';
import { useGetLocalPlanningQuery, useGetLocalYearsQuery, useToggleLoyerPaidMutation, useGetBuildingsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const MONTH_HEADERS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

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
							<Typography variant="h6" fontWeight={700}>{value}</Typography>
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

const LocauxPlanningClient: React.FC<SessionProps> = ({ session }) => {
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
	const { data: planningData, isLoading } = useGetLocalPlanningQuery({ year, ...(buildingId ? { building: buildingId } : {}) }, { skip: !token });
	const locaux = useMemo(() => (planningData?.locaux ?? []) as PlanningLocalType[], [planningData]);
	const [toggleLoyerPaid] = useToggleLoyerPaidMutation();

	const handleTogglePaid = async (id: number, currentPaye: boolean) => {
		await toggleLoyerPaid({ id, paye: !currentPaye });
	};

	// Compute KPI stats
	const stats = useMemo(() => {
		let totalPaid = 0;
		let totalUnpaid = 0;
		let paidCount = 0;
		let unpaidCount = 0;
		locaux.forEach((local) => {
			for (let m = 1; m <= 12; m++) {
				const data = local.months[m];
				if (!data) continue;
				if (data.paye) {
					totalPaid += Number(data.montant);
					paidCount++;
				} else {
					totalUnpaid += Number(data.montant);
					unpaidCount++;
				}
			}
		});
		return { totalPaid, totalUnpaid, paidCount, unpaidCount };
	}, [locaux]);

	const renderMonthChip = (local: PlanningLocalType, month: number) => {
		const data = local.months[month];
		if (!data) {
			return (
				<MuiTooltip title="Pas de loyer enregistré" arrow>
					<EmptyIcon fontSize="small" sx={{ color: 'grey.400' }} />
				</MuiTooltip>
			);
		}
		return (
			<MuiTooltip
				title={`${Number(data.montant).toLocaleString('fr-MA')} MAD — Cliquez pour ${data.paye ? 'marquer impayé' : 'marquer payé'}`}
				arrow
			>
				<Chip
					icon={data.paye ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
					label={data.paye ? 'Payé' : 'Impayé'}
					color={data.paye ? 'success' : 'error'}
					size="small"
					variant="outlined"
					onClick={() => handleTogglePaid(data.id, data.paye)}
					sx={{ cursor: 'pointer', fontWeight: 600, minWidth: 42 }}
				/>
			</MuiTooltip>
		);
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title="Planning des Locaux">
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" py={2} flexWrap="wrap" gap={1}>
							<Typography variant="h5" fontWeight={600}>
								Planning des Locaux {year}
							</Typography>
							<Stack direction="row" spacing={2}>
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
								<FormControl size="small" sx={{ minWidth: 120 }}>
									<InputLabel>Année</InputLabel>
									<Select value={year} label="Année" onChange={(e) => setYear(Number(e.target.value))}>
										{availableYears.map((y) => (
											<MenuItem key={y} value={y}>
												{y}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Stack>
						</Stack>

						{isLoading ? (
							<Box display="flex" justifyContent="center" py={8}>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								{/* KPI cards */}
								<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
									<KpiCard
										color="#1565c0"
										icon={<CalendarMonthIcon />}
										label="Locaux"
										value={`${locaux.length}`}
										tooltip="Nombre total de locaux"
									/>
									<KpiCard
										color="#2e7d32"
										icon={<CheckCircleOutlineIcon />}
										label="Loyers payés"
										value={`${stats.totalPaid.toLocaleString('fr-MA')} MAD`}
										tooltip={`${stats.paidCount} loyer(s) payé(s) en ${year}`}
									/>
									<KpiCard
										color="#d32f2f"
										icon={<HighlightOffIcon />}
										label="Loyers impayés"
										value={`${stats.totalUnpaid.toLocaleString('fr-MA')} MAD`}
										tooltip={`${stats.unpaidCount} loyer(s) impayé(s) en ${year}`}
									/>
									<KpiCard
										color="#6a1b9a"
										icon={<CalendarMonthIcon />}
										label="Taux de paiement"
										value={stats.paidCount + stats.unpaidCount > 0 ? `${Math.round((stats.paidCount / (stats.paidCount + stats.unpaidCount)) * 100)}%` : '—'}
										tooltip="Pourcentage de loyers payés sur le total"
									/>
								</Box>

								{locaux.length === 0 ? (
									<Card elevation={2}>
										<CardContent sx={{ py: 6, textAlign: 'center' }}>
											<CalendarMonthIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
											<Typography color="text.secondary">Aucun local enregistré.</Typography>
										</CardContent>
									</Card>
								) : (
									<Card elevation={2}>
										<CardHeader
											title="Détail des loyers par local"
											subheader={`Statut de paiement mensuel pour ${year} — Cliquez sur un statut pour le modifier`}
											action={
												<MuiTooltip title="Cliquez sur Payé/Impayé pour changer le statut de paiement" arrow>
													<IconButton size="small">
														<InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
													</IconButton>
												</MuiTooltip>
											}
										/>
										<CardContent sx={{ p: 0 }}>
											{isMobile ? (
												<Stack spacing={1.5} sx={{ p: 2 }}>
													{locaux.map((local) => (
														<Card key={local.id} elevation={1} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
															<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
																<Stack
																	direction="row"
																	justifyContent="space-between"
																	alignItems="center"
																	mb={1}
																	sx={{ cursor: 'pointer' }}
																	onClick={() => router.push(LOCAUX_VIEW(local.id))}
																>
																	<Box>
																		<Typography variant="body2" fontWeight={600}>{local.nom}</Typography>
																		<Typography variant="caption" color="text.secondary">
																			{local.type_local} — {local.en_location ? local.locataire_nom || 'En location' : 'Libre'}
																		</Typography>
																	</Box>
																</Stack>
																<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
																	{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
																		<Stack key={month} alignItems="center" spacing={0.25}>
																			<Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
																				{MONTH_HEADERS[month - 1]}
																			</Typography>
																			{renderMonthChip(local, month)}
																		</Stack>
																	))}
																</Box>
															</CardContent>
														</Card>
													))}
												</Stack>
											) : (
												<TableContainer component={Paper} elevation={0}>
													<Table size="small" sx={{ minWidth: 900 }}>
														<TableHead>
															<TableRow sx={{ bgcolor: 'primary.main' }}>
																<TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 180, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'primary.main' }}>
																	Local
																</TableCell>
																{MONTH_HEADERS.map((m, i) => (
																	<TableCell key={i} align="center" sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>
																		{m}
																	</TableCell>
																))}
															</TableRow>
														</TableHead>
														<TableBody>
															{locaux.map((local, rowIdx) => (
																<TableRow key={local.id} sx={{ bgcolor: rowIdx % 2 === 0 ? 'background.default' : 'action.hover' }}>
																	<TableCell
																		sx={{
																			fontWeight: 600,
																			position: 'sticky',
																			left: 0,
																			zIndex: 1,
																			bgcolor: 'inherit',
																			cursor: 'pointer',
																			'&:hover': { color: 'primary.main' },
																		}}
																		onClick={() => router.push(LOCAUX_VIEW(local.id))}
																	>
																		<Stack>
																			<Typography variant="body2" fontWeight={600} noWrap>{local.nom}</Typography>
																			<Typography variant="caption" color="text.secondary" noWrap>
																				{local.type_local} — {local.en_location ? local.locataire_nom || 'En location' : 'Libre'}
																			</Typography>
																		</Stack>
																	</TableCell>
																	{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
																		<TableCell key={month} align="center" sx={{ px: 0.5 }}>
																			{renderMonthChip(local, month)}
																		</TableCell>
																	))}
																</TableRow>
															))}
														</TableBody>
													</Table>
												</TableContainer>
											)}
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

export default LocauxPlanningClient;
