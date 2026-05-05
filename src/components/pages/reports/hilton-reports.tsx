'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	Apartment as ApartmentIcon,
	CalendarMonth as CalendarMonthIcon,
	Category as CategoryIcon,
	Close as CloseIcon,
	CurrencyExchange as CurrencyExchangeIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	AttachMoney as MoneyIcon,
	Notes as NotesIcon,
	RemoveCircleOutlined as RemoveIcon,
	Save as SaveIcon,
	Savings as SavingsIcon,
	TrendingDown as TrendingDownIcon,
	TrendingUp as TrendingUpIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { addDays, format, parseISO } from 'date-fns';
import type { SessionProps } from '@/types/_initTypes';
import type { HiltonReportManualLineKind, HiltonReportManualLineType, HiltonReportType } from '@/types/reservationTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useLanguage, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, formatDate, formatNumber, formatLocalDate } from '@/utils/helpers';
import {
	useCreateHiltonReportMutation,
	useDeleteHiltonReportMutation,
	useGetHiltonReportsQuery,
	usePreviewHiltonReportQuery,
	useUpdateHiltonReportMutation,
} from '@/store/services/reservation';

type ManualLineForm = {
	line_type: HiltonReportManualLineKind;
	description: string;
	amount: string;
	sort_order?: number;
};

const emptyManualLine = (): ManualLineForm => ({
	line_type: 'cost',
	description: '',
	amount: '0',
});

const toNumber = (value: string | number | null | undefined) => {
	const parsed = typeof value === 'number' ? value : Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
};

const nextDate = (value: string) => format(addDays(parseISO(value), 1), 'yyyy-MM-dd');

const sanitizeManualLines = (lines: ManualLineForm[]): HiltonReportManualLineType[] =>
	lines
		.map((line, index) => ({
			line_type: line.line_type,
			description: line.description.trim(),
			amount: line.line_type === 'note' ? '0' : String(toNumber(line.amount)),
			sort_order: index,
		}))
		.filter((line) => line.description.length > 0);

const calculateManualTotals = (lines: Array<Pick<ManualLineForm, 'line_type' | 'amount'>>) =>
	lines.reduce(
		(acc, line) => {
			const amount = toNumber(line.amount);
			if (line.line_type === 'cost') acc.cost += amount;
			if (line.line_type === 'adjustment') acc.adjustment += amount;
			return acc;
		},
		{ cost: 0, adjustment: 0 },
	);

const StatCard = ({
	label,
	value,
	icon,
	color,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
	color: string;
}) => (
	<Card
		elevation={1}
		sx={{
			height: '100%',
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
			<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
				<Box sx={{ color, display: 'flex' }}>{icon}</Box>
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
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{value}
					</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

const HiltonReportsClient: React.FC<SessionProps> = ({ session }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();

	const today = useMemo(() => formatLocalDate(new Date()), []);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState(today);
	const [notes, setNotes] = useState('');
	const [manualLines, setManualLines] = useState<ManualLineForm[]>([]);
	const [viewReport, setViewReport] = useState<HiltonReportType | null>(null);
	const [editReport, setEditReport] = useState<HiltonReportType | null>(null);
	const [editNotes, setEditNotes] = useState('');
	const [editLines, setEditLines] = useState<ManualLineForm[]>([]);
	const [deleteReportId, setDeleteReportId] = useState<number | null>(null);

	const { data: reports, isLoading } = useGetHiltonReportsQuery(undefined, { skip: !token });
	const latestReport = reports?.[0];
	const hasReports = Boolean(latestReport);

	useEffect(() => {
		if (latestReport?.end_date) {
			setStartDate(latestReport.end_date);
			setEndDate((current) => (current > latestReport.end_date ? current : nextDate(latestReport.end_date)));
		}
	}, [latestReport?.end_date]);

	const handleStartDateChange = (date: Date | null) => {
		const value = date ? format(date, 'yyyy-MM-dd') : '';
		setStartDate(value);
		if (value && (!endDate || endDate <= value)) {
			setEndDate(nextDate(value));
		}
	};

	const handleEndDateChange = (date: Date | null) => {
		setEndDate(date ? format(date, 'yyyy-MM-dd') : '');
	};

	const periodIsValid = Boolean(startDate && endDate && endDate > startDate);
	const { currentData: preview, isFetching: isPreviewFetching } = usePreviewHiltonReportQuery(
		{
			start_date: hasReports ? undefined : startDate,
			end_date: endDate,
		},
		{ skip: !token || !periodIsValid },
	);

	const [createReport, { isLoading: isCreating }] = useCreateHiltonReportMutation();
	const [updateReport, { isLoading: isUpdating }] = useUpdateHiltonReportMutation();
	const [deleteReport, { isLoading: isDeleting }] = useDeleteHiltonReportMutation();

	const manualPayloadLines = useMemo(() => sanitizeManualLines(manualLines), [manualLines]);
	const manualTotals = useMemo(() => calculateManualTotals(manualPayloadLines), [manualPayloadLines]);
	const previewGross = toNumber(preview?.gross_revenue);
	const previewNet = previewGross + manualTotals.adjustment - manualTotals.cost;
	const previewHasRevenue = Boolean(
		preview?.apartment_revenues.some((row) => row.reservation_count > 0 || toNumber(row.total_amount) > 0),
	);
	const reportHasContent = manualPayloadLines.length > 0 || previewHasRevenue;

	const lineTypes = useMemo(
		() => [
			{ value: 'cost', label: t.hiltonReports.cost },
			{ value: 'adjustment', label: t.hiltonReports.adjustment },
			{ value: 'note', label: t.hiltonReports.note },
		],
		[t],
	);

	const updateLine = (
		lines: ManualLineForm[],
		setLines: React.Dispatch<React.SetStateAction<ManualLineForm[]>>,
		index: number,
		patch: Partial<ManualLineForm>,
	) => {
		setLines(
			lines.map((line, lineIndex) => {
				if (lineIndex !== index) return line;
				const next = { ...line, ...patch };
				if (patch.line_type === 'note') next.amount = '0';
				return next;
			}),
		);
	};

	const renderManualLineEditor = (
		lines: ManualLineForm[],
		setLines: React.Dispatch<React.SetStateAction<ManualLineForm[]>>,
	) => (
		<Stack spacing={1.5}>
			{lines.map((line, index) => (
				<Stack
					key={`${line.line_type}-${index}`}
					direction={{ xs: 'column', md: 'row' }}
					spacing={1.5}
					sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
				>
					<TextField
						select
						size="small"
						label={t.hiltonReports.lineType}
						value={line.line_type}
						onChange={(event) =>
							updateLine(lines, setLines, index, { line_type: event.target.value as HiltonReportManualLineKind })
						}
						sx={{ minWidth: { md: 150 } }}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<CategoryIcon fontSize="small" />
									</InputAdornment>
								),
							},
						}}
					>
						{lineTypes.map((item) => (
							<MenuItem key={item.value} value={item.value}>
								{item.label}
							</MenuItem>
						))}
					</TextField>
					<TextField
						size="small"
						label={t.common.description}
						value={line.description}
						onChange={(event) => updateLine(lines, setLines, index, { description: event.target.value })}
						fullWidth
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<DescriptionIcon fontSize="small" />
									</InputAdornment>
								),
							},
						}}
					/>
					<TextField
						size="small"
						type="number"
						label={t.hiltonReports.amount}
						value={line.amount}
						disabled={line.line_type === 'note'}
						onChange={(event) => updateLine(lines, setLines, index, { amount: event.target.value })}
						sx={{ minWidth: { md: 140 } }}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<CurrencyExchangeIcon fontSize="small" />
									</InputAdornment>
								),
							},
							htmlInput: { inputMode: 'decimal', min: 0 },
						}}
					/>
					<Tooltip title={t.common.delete}>
						<IconButton color="error" onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}>
							<RemoveIcon />
						</IconButton>
					</Tooltip>
				</Stack>
			))}
			<Box>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setLines([...lines, emptyManualLine()])}>
					{t.hiltonReports.addLine}
				</Button>
			</Box>
		</Stack>
	);

	const handleCreate = async () => {
		if (!periodIsValid || !reportHasContent) {
			onError(t.hiltonReports.emptyReportError);
			return;
		}
		try {
			const payload = {
				...(hasReports ? {} : { start_date: startDate }),
				end_date: endDate,
				notes,
				manual_lines: manualPayloadLines,
			};
			const created = await createReport(payload).unwrap();
			setStartDate(created.end_date);
			setEndDate(nextDate(created.end_date));
			setNotes('');
			setManualLines([]);
			onSuccess(t.hiltonReports.createSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.hiltonReports.createError));
		}
	};

	const openEdit = (report: HiltonReportType) => {
		setEditReport(report);
		setEditNotes(report.notes ?? '');
		setEditLines(
			report.manual_lines.map((line) => ({
				line_type: line.line_type,
				description: line.description,
				amount: line.amount,
				sort_order: line.sort_order,
			})),
		);
	};

	const handleUpdate = async () => {
		if (!editReport) return;
		try {
			const updated = await updateReport({
				id: editReport.id,
				data: {
					notes: editNotes,
					manual_lines: sanitizeManualLines(editLines),
				},
			}).unwrap();
			setEditReport(null);
			setViewReport(updated);
			onSuccess(t.hiltonReports.updateSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.hiltonReports.updateError));
		}
	};

	const handleDelete = async () => {
		if (!deleteReportId) return;
		try {
			await deleteReport({ id: deleteReportId }).unwrap();
			onSuccess(t.hiltonReports.deleteSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.hiltonReports.deleteError));
		} finally {
			setDeleteReportId(null);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setDeleteReportId(null),
			icon: <CloseIcon />,
			color: '#6B6B6B',
			disabled: isDeleting,
		},
		{
			text: t.common.delete,
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
			disabled: isDeleting,
		},
	];

	const renderTotals = (report?: HiltonReportType | null) => {
		const gross = report ? report.gross_revenue : preview?.gross_revenue;
		const costs = report ? report.manual_cost_total : String(manualTotals.cost);
		const adjustments = report ? report.manual_adjustment_total : String(manualTotals.adjustment);
		const net = report ? report.net_total : String(previewNet);

		return (
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.grossRevenue}
						value={`${formatNumber(gross)} MAD`}
						icon={<MoneyIcon fontSize="small" />}
						color="#1976d2"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.manualCosts}
						value={`${formatNumber(costs)} MAD`}
						icon={<TrendingDownIcon fontSize="small" />}
						color="#d32f2f"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.manualAdjustments}
						value={`${formatNumber(adjustments)} MAD`}
						icon={<TrendingUpIcon fontSize="small" />}
						color="#2e7d32"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.netTotal}
						value={`${formatNumber(net)} MAD`}
						icon={<SavingsIcon fontSize="small" />}
						color="#0D070B"
					/>
				</Grid>
			</Grid>
		);
	};

	const renderSourceTotals = (report?: HiltonReportType | null) => {
		const booking = report ? report.booking_total : preview?.booking_total;
		const airbnb = report ? report.airbnb_total : preview?.airbnb_total;
		const cash = report
			? report.cash_total
			: String(toNumber(preview?.cash_revenue_total ?? preview?.cash_total) - manualTotals.cost);
		const bank = report ? report.bank_total : preview?.bank_total;

		return (
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.bookingAmount}
						value={`${formatNumber(booking)} MAD`}
						icon={<CurrencyExchangeIcon fontSize="small" />}
						color="#1565c0"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.airbnbAmount}
						value={`${formatNumber(airbnb)} MAD`}
						icon={<TrendingUpIcon fontSize="small" />}
						color="#bf360c"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.cashAmount}
						value={`${formatNumber(cash)} MAD`}
						icon={<MoneyIcon fontSize="small" />}
						color="#1b5e20"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.bankAmount}
						value={`${formatNumber(bank)} MAD`}
						icon={<SavingsIcon fontSize="small" />}
						color="#4a148c"
					/>
				</Grid>
			</Grid>
		);
	};

	const renderApartmentTable = (report?: HiltonReportType | null) => {
		const rows = report?.apartment_revenues ?? preview?.apartment_revenues ?? [];
		return (
			<TableContainer component={Paper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>{t.reservations.apartment}</TableCell>
							<TableCell align="right">{t.hiltonReports.amount}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={`${row.apartment ?? row.apartment_nom}-${row.apartment_nom}`}>
								<TableCell>{row.apartment_nom}</TableCell>
								<TableCell align="right">{formatNumber(row.total_amount)} MAD</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		);
	};

	const renderManualLinesTable = (report: HiltonReportType) => (
		<TableContainer component={Paper} variant="outlined">
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>{t.hiltonReports.lineType}</TableCell>
						<TableCell>{t.common.description}</TableCell>
						<TableCell align="right">{t.hiltonReports.amount}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{report.manual_lines.length === 0 ? (
						<TableRow>
							<TableCell colSpan={3}>
								<Typography variant="body2" sx={{ color: 'text.secondary' }}>
									{t.hiltonReports.noManualLines}
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						report.manual_lines.map((line) => (
							<TableRow key={line.id ?? `${line.line_type}-${line.description}`}>
								<TableCell>
									<Chip
										size="small"
										label={lineTypes.find((item) => item.value === line.line_type)?.label ?? line.line_type}
										color={line.line_type === 'cost' ? 'error' : line.line_type === 'adjustment' ? 'success' : 'default'}
										variant="outlined"
									/>
								</TableCell>
								<TableCell>{line.description}</TableCell>
								<TableCell align="right">{formatNumber(line.amount)} MAD</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
				<NavigationBar title={t.hiltonReports.title}>
					<Protected permission="can_access_hilton_reports">
						<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
							<Box>
								<Typography variant="h5" sx={{ fontWeight: 700 }}>
									{t.hiltonReports.title}
								</Typography>
								<Typography variant="body2" sx={{ color: 'text.secondary' }}>
									{t.hiltonReports.subtitle}
								</Typography>
							</Box>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent>
								<Stack spacing={2.5}>
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.hiltonReports.createReport}
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12, md: 4 }}>
											<DatePicker
												label={t.hiltonReports.startDate}
												value={startDate ? parseISO(startDate) : null}
												onChange={handleStartDateChange}
												maxDate={endDate ? addDays(parseISO(endDate), -1) : undefined}
												disabled={hasReports}
												slots={{ openPickerIcon: CalendarMonthIcon }}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														slotProps: {
															input: {
																startAdornment: (
																	<InputAdornment position="start">
																		<CalendarMonthIcon fontSize="small" />
																	</InputAdornment>
																),
															},
														},
													},
												}}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 4 }}>
											<DatePicker
												label={t.hiltonReports.endDate}
												value={endDate ? parseISO(endDate) : null}
												onChange={handleEndDateChange}
												minDate={startDate ? parseISO(nextDate(startDate)) : undefined}
												slots={{ openPickerIcon: CalendarMonthIcon }}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														slotProps: {
															input: {
																startAdornment: (
																	<InputAdornment position="start">
																		<CalendarMonthIcon fontSize="small" />
																	</InputAdornment>
																),
															},
														},
													},
												}}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 4 }}>
											<TextField
												size="small"
												label={t.hiltonReports.building}
												value="Hilton residence"
												disabled
												fullWidth
												slotProps={{
													input: {
														startAdornment: (
															<InputAdornment position="start">
																<ApartmentIcon fontSize="small" />
															</InputAdornment>
														),
													},
												}}
											/>
										</Grid>
									</Grid>

									{startDate && endDate && (
										<Alert severity={periodIsValid ? 'info' : 'warning'}>
											{t.hiltonReports.period}: {formatDate(startDate)} - {formatDate(endDate)}
										</Alert>
									)}
									{periodIsValid && !isPreviewFetching && !reportHasContent && (
										<Alert severity="warning">{t.hiltonReports.emptyReportError}</Alert>
									)}

									<TextField
										label={t.common.notes}
										value={notes}
										onChange={(event) => setNotes(event.target.value)}
										multiline
										minRows={2}
										fullWidth
										slotProps={{
											input: {
												startAdornment: (
													<InputAdornment position="start">
														<NotesIcon fontSize="small" />
													</InputAdornment>
												),
											},
										}}
									/>

									<Box>
										<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
											{t.hiltonReports.manualLines}
										</Typography>
										{renderManualLineEditor(manualLines, setManualLines)}
									</Box>

									{preview && (
										<Stack spacing={2}>
											<Divider />
											<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
												{t.hiltonReports.preview}
											</Typography>
											{renderTotals()}
											<Stack spacing={1.5}>
												<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
													{t.hiltonReports.sourceBreakdown}
												</Typography>
												{renderSourceTotals()}
											</Stack>
											{renderApartmentTable()}
										</Stack>
									)}

									<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
										<Button
											variant="contained"
											startIcon={<SaveIcon />}
											onClick={handleCreate}
											disabled={!periodIsValid || !reportHasContent || isCreating}
										>
											{t.hiltonReports.createReport}
										</Button>
									</Box>
								</Stack>
							</CardContent>
						</Card>

						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent>
								<Stack spacing={2}>
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.hiltonReports.reportHistory}
									</Typography>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>{t.hiltonReports.period}</TableCell>
													<TableCell align="right">{t.hiltonReports.grossRevenue}</TableCell>
													<TableCell align="right">{t.hiltonReports.manualCosts}</TableCell>
													<TableCell align="right">{t.hiltonReports.netTotal}</TableCell>
													<TableCell>{t.common.createdBy}</TableCell>
													<TableCell align="right">{t.common.actions}</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{isLoading ? (
													<TableRow>
														<TableCell colSpan={6}>{t.common.loading}</TableCell>
													</TableRow>
												) : !reports || reports.length === 0 ? (
													<TableRow>
														<TableCell colSpan={6}>{t.hiltonReports.noReports}</TableCell>
													</TableRow>
												) : (
													reports.map((report) => {
														const isLatest = latestReport?.id === report.id;
														return (
															<TableRow key={report.id}>
																<TableCell>
																	{formatDate(report.start_date)} - {formatDate(report.end_date)}
																</TableCell>
																<TableCell align="right">{formatNumber(report.gross_revenue)} MAD</TableCell>
																<TableCell align="right">{formatNumber(report.manual_cost_total)} MAD</TableCell>
																<TableCell align="right">{formatNumber(report.net_total)} MAD</TableCell>
																<TableCell>{report.created_by_user_name ?? '-'}</TableCell>
																<TableCell align="right">
																	<Tooltip title={t.hiltonReports.viewReport}>
																		<IconButton size="small" onClick={() => setViewReport(report)}>
																			<VisibilityIcon fontSize="small" />
																		</IconButton>
																	</Tooltip>
																	<Tooltip title={t.hiltonReports.editReport}>
																		<IconButton size="small" onClick={() => openEdit(report)}>
																			<EditIcon fontSize="small" />
																		</IconButton>
																	</Tooltip>
																	<Tooltip title={isLatest ? t.hiltonReports.deleteReport : t.hiltonReports.latestOnlyDelete}>
																		<span>
																			<IconButton
																				size="small"
																				color="error"
																				disabled={!isLatest}
																				onClick={() => setDeleteReportId(report.id)}
																			>
																				<DeleteIcon fontSize="small" />
																			</IconButton>
																		</span>
																	</Tooltip>
																</TableCell>
															</TableRow>
														);
													})
												)}
											</TableBody>
										</Table>
									</TableContainer>
								</Stack>
							</CardContent>
						</Card>
						</Stack>
					</Protected>
				</NavigationBar>

			<Dialog open={Boolean(viewReport)} onClose={() => setViewReport(null)} fullWidth maxWidth="md">
				{viewReport && (
					<>
						<DialogTitle>{t.hiltonReports.reportNumber(viewReport.id)}</DialogTitle>
						<DialogContent>
							<Stack spacing={2.5} sx={{ pt: 1 }}>
								<Alert severity="info">
									{t.hiltonReports.period}: {formatDate(viewReport.start_date)} - {formatDate(viewReport.end_date)}
								</Alert>
								{renderTotals(viewReport)}
								<Stack spacing={1.5}>
									<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
										{t.hiltonReports.sourceBreakdown}
									</Typography>
									{renderSourceTotals(viewReport)}
								</Stack>
								<Box>
									<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
										{t.hiltonReports.apartmentsRevenue}
									</Typography>
									{renderApartmentTable(viewReport)}
								</Box>
								<Box>
									<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
										{t.hiltonReports.manualLines}
									</Typography>
									{renderManualLinesTable(viewReport)}
								</Box>
								{viewReport.notes && (
									<Alert severity="info">
										<Typography variant="body2">{viewReport.notes}</Typography>
									</Alert>
								)}
							</Stack>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setViewReport(null)} startIcon={<CloseIcon />}>
								{t.common.close}
							</Button>
							<Button onClick={() => openEdit(viewReport)} startIcon={<EditIcon />}>
								{t.common.edit}
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>

			<Dialog open={Boolean(editReport)} onClose={() => setEditReport(null)} fullWidth maxWidth="md">
				<DialogTitle>{t.hiltonReports.editReport}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						{editReport && (
							<Alert severity="info">
								{t.hiltonReports.period}: {formatDate(editReport.start_date)} - {formatDate(editReport.end_date)}
							</Alert>
						)}
						<TextField
							label={t.common.notes}
							value={editNotes}
							onChange={(event) => setEditNotes(event.target.value)}
							multiline
							minRows={2}
							fullWidth
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<NotesIcon fontSize="small" />
										</InputAdornment>
									),
								},
							}}
						/>
						{renderManualLineEditor(editLines, setEditLines)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditReport(null)}>{t.common.cancel}</Button>
					<Button variant="contained" startIcon={<SaveIcon />} onClick={handleUpdate} disabled={isUpdating}>
						{t.common.save}
					</Button>
				</DialogActions>
			</Dialog>

			{deleteReportId && (
				<ActionModals
					title={t.hiltonReports.deleteReport}
					body={t.hiltonReports.deleteReportConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					onClose={() => setDeleteReportId(null)}
				/>
			)}
			</Stack>
		</LocalizationProvider>
	);
};

export default HiltonReportsClient;
