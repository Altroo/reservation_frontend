'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarMonthIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	RemoveCircleOutline as EmptyIcon,
} from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import type { PlanningLocalType } from '@/types/localTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { LOCAUX_LIST, LOCAUX_VIEW } from '@/utils/routes';
import { useGetLocalPlanningQuery, useGetLocalYearsQuery } from '@/store/services/reservation';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const MONTH_HEADERS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const LocauxPlanningClient: React.FC<SessionProps> = ({ session }) => {
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

	const { data: planningData, isLoading } = useGetLocalPlanningQuery({ year }, { skip: !token });
	const locaux = useMemo(() => (planningData?.locaux ?? []) as PlanningLocalType[], [planningData]);

	const renderMonthCell = (local: PlanningLocalType, month: number) => {
		const data = local.months[month];
		if (!data) {
			return (
				<Tooltip title="Pas de loyer enregistré">
					<EmptyIcon fontSize="small" sx={{ color: 'grey.400' }} />
				</Tooltip>
			);
		}
		if (data.paye) {
			return (
				<Tooltip title={`Payé — ${Number(data.montant).toLocaleString('fr-MA')} MAD`}>
					<CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
				</Tooltip>
			);
		}
		return (
			<Tooltip title={`Impayé — ${Number(data.montant).toLocaleString('fr-MA')} MAD`}>
				<CancelIcon fontSize="small" sx={{ color: 'error.main' }} />
			</Tooltip>
		);
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px" sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
			<NavigationBar title="Planning des Locaux">
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
						) : locaux.length === 0 ? (
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ py: 6, textAlign: 'center' }}>
									<CalendarMonthIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
									<Typography color="text.secondary">Aucun local enregistré.</Typography>
								</CardContent>
							</Card>
						) : (
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: { xs: 1, md: 2 } }}>
									<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, px: 1 }}>
										<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
											<Stack direction="row" spacing={0.5} alignItems="center">
												<CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
												<Typography variant="caption">Payé</Typography>
											</Stack>
											<Stack direction="row" spacing={0.5} alignItems="center">
												<CancelIcon fontSize="small" sx={{ color: 'error.main' }} />
												<Typography variant="caption">Impayé</Typography>
											</Stack>
											<Stack direction="row" spacing={0.5} alignItems="center">
												<EmptyIcon fontSize="small" sx={{ color: 'grey.400' }} />
												<Typography variant="caption">Pas de loyer</Typography>
											</Stack>
										</Stack>
									</Stack>
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontWeight: 700, minWidth: 150, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
														Local
													</TableCell>
													{MONTH_HEADERS.map((m, i) => (
														<TableCell key={i} align="center" sx={{ fontWeight: 600, minWidth: 50 }}>
															{m}
														</TableCell>
													))}
												</TableRow>
											</TableHead>
											<TableBody>
												{locaux.map((local) => (
													<TableRow key={local.id} hover>
														<TableCell
															sx={{
																position: 'sticky',
																left: 0,
																bgcolor: 'background.paper',
																zIndex: 1,
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
																{renderMonthCell(local, month)}
															</TableCell>
														))}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							</Card>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default LocauxPlanningClient;
