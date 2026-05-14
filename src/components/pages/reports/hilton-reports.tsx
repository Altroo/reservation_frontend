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
	Print as PrintIcon,
	RemoveCircleOutlined as RemoveIcon,
	Save as SaveIcon,
	Savings as SavingsIcon,
	TrendingDown as TrendingDownIcon,
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
	operations_count: string;
	sort_order?: number;
};

const emptyManualLine = (): ManualLineForm => ({
	line_type: 'cost',
	description: '',
	amount: '0',
	operations_count: '1',
});

const toNumber = (value: string | number | null | undefined) => {
	const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
	const parsed = typeof normalized === 'number' ? normalized : Number(normalized ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
};

const escapeHtml = (value: string | number | null | undefined) =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

const nextDate = (value: string) => format(addDays(parseISO(value), 1), 'yyyy-MM-dd');

const sanitizeManualLines = (lines: ManualLineForm[]): HiltonReportManualLineType[] =>
	lines
		.map((line, index) => ({
			line_type: line.line_type,
			description: line.description.trim(),
			amount: line.line_type === 'note' ? '0' : String(toNumber(line.amount)),
			operations_count:
				line.line_type === 'cost' && toNumber(line.operations_count) > 0
					? Math.trunc(toNumber(line.operations_count))
					: null,
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
	const [cashRegisterTotal, setCashRegisterTotal] = useState('0');
	const [costPeriodLabel, setCostPeriodLabel] = useState('');
	const [manualLines, setManualLines] = useState<ManualLineForm[]>([]);
	const [viewReport, setViewReport] = useState<HiltonReportType | null>(null);
	const [editReport, setEditReport] = useState<HiltonReportType | null>(null);
	const [editNotes, setEditNotes] = useState('');
	const [editCashRegisterTotal, setEditCashRegisterTotal] = useState('0');
	const [editCostPeriodLabel, setEditCostPeriodLabel] = useState('');
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
			start_date: startDate,
			end_date: endDate,
		},
		{ skip: !token || !periodIsValid },
	);

	const [createReport, { isLoading: isCreating }] = useCreateHiltonReportMutation();
	const [updateReport, { isLoading: isUpdating }] = useUpdateHiltonReportMutation();
	const [deleteReport, { isLoading: isDeleting }] = useDeleteHiltonReportMutation();

	const manualPayloadLines = useMemo(() => sanitizeManualLines(manualLines), [manualLines]);
	const manualTotals = useMemo(() => calculateManualTotals(manualPayloadLines), [manualPayloadLines]);
	const previewOpeningBalance = toNumber(preview?.opening_balance);
	const previewGross = toNumber(preview?.gross_revenue);
	const previewNet = previewOpeningBalance + previewGross - manualTotals.adjustment - manualTotals.cost;
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
				if (patch.line_type === 'note') {
					next.amount = '0';
					next.operations_count = '';
				}
				if (patch.line_type === 'cost' && !next.operations_count) next.operations_count = '1';
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
						label={t.hiltonReports.operationsCount}
						value={line.operations_count}
						disabled={line.line_type !== 'cost'}
						onChange={(event) => updateLine(lines, setLines, index, { operations_count: event.target.value })}
						sx={{ minWidth: { md: 120 } }}
						slotProps={{
							htmlInput: { inputMode: 'numeric', min: 1, step: 1 },
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
				cash_register_total: String(toNumber(cashRegisterTotal)),
				cost_period_label: costPeriodLabel.trim(),
				manual_lines: manualPayloadLines,
			};
			const created = await createReport(payload).unwrap();
			setStartDate(created.end_date);
			setEndDate(nextDate(created.end_date));
			setNotes('');
			setCashRegisterTotal('0');
			setCostPeriodLabel('');
			setManualLines([]);
			setViewReport(created);
			onSuccess(t.hiltonReports.createSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.hiltonReports.createError));
		}
	};

	const openEdit = (report: HiltonReportType) => {
		setEditReport(report);
		setEditNotes(report.notes ?? '');
		setEditCashRegisterTotal(report.cash_register_total ?? '0');
		setEditCostPeriodLabel(report.cost_period_label ?? '');
		setEditLines(
			report.manual_lines.map((line) => ({
				line_type: line.line_type,
				description: line.description,
				amount: line.amount,
				operations_count: line.operations_count ? String(line.operations_count) : '',
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
					cash_register_total: String(toNumber(editCashRegisterTotal)),
					cost_period_label: editCostPeriodLabel.trim(),
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
		const opening = report ? report.opening_balance : preview?.opening_balance;
		const gross = report ? report.gross_revenue : preview?.gross_revenue;
		const costs = report ? report.manual_cost_total : String(manualTotals.cost);
		const deductions = report ? report.manual_adjustment_total : String(manualTotals.adjustment);
		const net = report ? report.net_total : String(previewNet);
		const expenseTotal = toNumber(costs) + toNumber(deductions);

		return (
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.balanceToCarryForward}
						value={`${formatNumber(opening)} MAD`}
						icon={<SavingsIcon fontSize="small" />}
						color="#1976d2"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.cashAmount}
						value={`${formatNumber(gross)} MAD`}
						icon={<MoneyIcon fontSize="small" />}
						color="#1b5e20"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={t.hiltonReports.costs}
						value={`${formatNumber(expenseTotal)} MAD`}
						icon={<TrendingDownIcon fontSize="small" />}
						color="#d32f2f"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						label={
							report?.end_date || endDate
								? t.hiltonReports.balanceUntil(formatDate(report?.end_date ?? endDate))
								: t.hiltonReports.netTotal
						}
						value={`${formatNumber(net)} MAD`}
						icon={<SavingsIcon fontSize="small" />}
						color="#0D070B"
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
						<TableCell align="right">{t.hiltonReports.operationsCount}</TableCell>
						<TableCell align="right">{t.hiltonReports.amount}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{report.manual_lines.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4}>
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
								<TableCell align="right">{line.operations_count ?? '-'}</TableCell>
								<TableCell align="right">{formatNumber(line.amount)} MAD</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);

	const printReport = (report: HiltonReportType) => {
		if (typeof window === 'undefined') return;

		const revenueRows = report.apartment_revenues.filter((row) => toNumber(row.total_amount) > 0);
		const deductions = report.manual_lines.filter((line) => line.line_type === 'adjustment');
		const costs = report.manual_lines.filter((line) => line.line_type === 'cost');
		const notes = report.manual_lines.filter((line) => line.line_type === 'note');
		const rowCount = Math.max(revenueRows.length, deductions.length, 1);
		const summaryRows = Array.from({ length: rowCount }, (_, index) => {
			const revenue = revenueRows[index];
			const deduction = deductions[index];
			return `
				<tr>
					<td>${escapeHtml(revenue?.apartment_nom ?? '')}</td>
					<td class="amount">${revenue ? `${formatNumber(revenue.total_amount)} DH` : ''}</td>
					<td>${escapeHtml(deduction?.description ?? '')}</td>
					<td class="amount">${deduction ? `${formatNumber(deduction.amount)} DH` : ''}</td>
				</tr>
			`;
		}).join('');
		const costRows = costs.length
			? costs
					.map(
						(line, index) => `
							<tr>
								${index === 0 ? `<td class="vertical" rowspan="${costs.length}">${escapeHtml(report.cost_period_label || `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`)}</td>` : ''}
								<td>${escapeHtml(line.description)}</td>
								<td class="center">${line.operations_count ?? '-'}</td>
								<td class="amount">${formatNumber(line.amount)} MAD</td>
							</tr>
						`,
					)
					.join('')
			: `<tr><td class="vertical"></td><td colspan="3">${escapeHtml(t.hiltonReports.noManualLines)}</td></tr>`;
		const noteRows = notes
			.map((line) => `<li>${escapeHtml(line.description)}</li>`)
			.join('');
		const title = `${t.hiltonReports.reportNumber(report.id)} - ${formatDate(report.end_date)}`;
		const win = window.open('', '_blank', 'width=980,height=1200');
		if (!win) return;

		win.document.write(`
			<!doctype html>
			<html>
				<head>
					<title>${escapeHtml(title)}</title>
					<style>
						@page { size: A4; margin: 12mm; }
						* { box-sizing: border-box; }
						body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
						.report { width: 190mm; margin: 0 auto; padding: 4mm 2mm 10mm; }
						.header { display: grid; grid-template-columns: 1fr 1fr; align-items: start; margin-bottom: 22mm; }
						.company { text-align: center; font-size: 10px; line-height: 1.35; font-weight: 700; }
						.logo { text-align: center; font-family: Georgia, serif; color: #555; }
						.logo-mark { font-size: 54px; line-height: .8; color: #050505; }
						.logo-name { font-size: 19px; margin-top: 3px; }
						h1 { text-align: center; color: #7046a3; text-decoration: underline; font-size: 18px; margin: 0 0 18mm; }
						.meta { display: grid; grid-template-columns: 1fr 80px 1fr; gap: 18px; align-items: end; width: 70%; margin: 0 auto 12mm; font-weight: 700; }
						.meta .number { border-bottom: 2px solid #333; text-align: center; font-size: 16px; }
						.dates { display: flex; justify-content: center; gap: 42mm; margin-bottom: 12mm; font-size: 15px; font-weight: 700; }
						.dates .from { color: #f44336; text-decoration: underline; }
						.dates .to { color: #24375f; }
						.balance-line { display: grid; grid-template-columns: 1fr 95mm; gap: 12px; align-items: end; margin: 0 0 10mm 5mm; font-size: 15px; font-weight: 700; }
						.balance-line .value { border-bottom: 1px solid #24375f; color: #24375f; text-align: right; padding-right: 2mm; font-style: italic; }
						table { border-collapse: collapse; width: 100%; }
						th, td { border: 1.5px solid #111; padding: 2px 5px; font-size: 12px; }
						th { font-weight: 800; text-align: center; }
						.summary { margin-bottom: 8mm; }
						.summary th:nth-child(2) { color: #1976d2; }
						.summary th:nth-child(4) { color: #f44336; }
						.summary td:first-child { text-align: center; font-weight: 700; }
						.amount { text-align: right; white-space: nowrap; font-weight: 700; }
						.center { text-align: center; }
						.total-row td { font-weight: 800; }
						.cash-register { width: 62%; margin: 0 0 8mm 8mm; }
						.cash-register td:first-child { font-weight: 700; text-align: center; }
						.final-balance { display: grid; grid-template-columns: 1.2fr 1fr 1fr; border: 2px solid #111; margin: 0 0 11mm 8mm; width: 88%; align-items: center; }
						.final-balance div { padding: 5px 10px; font-size: 18px; font-weight: 800; color: #c89d2b; }
						.final-balance div + div { border-left: 2px solid #111; }
						.final-balance .value { color: #24375f; text-align: right; font-style: italic; text-decoration: underline; }
						.cost-title { text-align: center; color: #f44336; text-decoration: underline; font-size: 22px; font-weight: 900; margin: 0 0 7mm; }
						.costs { width: 88%; margin: 0 auto 10mm; }
						.costs td { font-family: Georgia, serif; font-size: 15px; }
						.costs th { font-size: 13px; }
						.vertical { writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-family: Arial, sans-serif !important; font-weight: 800; width: 30mm; }
						.additional { width: 88%; margin: 0 auto; color: #8b4a22; font-weight: 800; text-decoration: underline; font-size: 18px; }
						.additional-list { width: 88%; margin: 3mm auto 0; font-size: 13px; }
						@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
					</style>
				</head>
				<body>
					<main class="report">
						<section class="header">
							<div class="company">
								<div>Sté IMMOBILIERE NECTAR S.A.R.L</div>
								<div>Capital : 2.000.000,00 DH - Siège à TANGER ,</div>
								<div>148 , Av. Med V imm Nectar -</div>
								<div>Tél : +212 773 86 35 85 Fixe : +212 531 06 84 87</div>
								<div>E-mail : Nectarimmobiliere@gmail.com</div>
								<div>R.C : 23851 TANGER -ICE 000534755000065</div>
							</div>
							<div class="logo">
								<div class="logo-mark">N</div>
								<div class="logo-name">Nectar Immobiliere</div>
							</div>
						</section>
						<h1>CAISSE - GESTION DES APPARTEMENTS RH - C.CENTER</h1>
						<section class="meta">
							<div>The Number report :</div>
							<div class="number">${report.id}</div>
							<div></div>
						</section>
						<section class="dates">
							<div>From <span class="from">${formatDate(report.start_date)}</span></div>
							<div>To <span class="to">${formatDate(report.end_date)}</span></div>
						</section>
						<section class="balance-line">
							<div>Balance to carry forward :</div>
							<div class="value">${formatNumber(report.opening_balance)} MAD</div>
						</section>
						<table class="summary">
							<thead>
								<tr>
									<th>N° APPARTEMENT</th>
									<th>+</th>
									<th>${escapeHtml(t.hiltonReports.deductions)}</th>
									<th>-</th>
								</tr>
							</thead>
							<tbody>
								${summaryRows}
								<tr class="total-row">
									<td>TOTAL</td>
									<td class="amount">${formatNumber(report.cash_revenue_total)} DH</td>
									<td></td>
									<td class="amount">${formatNumber(report.manual_adjustment_total)} DH</td>
								</tr>
							</tbody>
						</table>
						<table class="cash-register">
							<tr>
								<td>The cash register of Hilton :</td>
								<td class="amount">${formatNumber(report.cash_register_total)} MAD</td>
							</tr>
						</table>
						<section class="final-balance">
							<div>Balance until</div>
							<div>${formatDate(report.end_date)}</div>
							<div class="value">${formatNumber(report.net_total)} MAD</div>
						</section>
						<div class="cost-title">COSTS</div>
						<table class="costs">
							<thead>
								<tr>
									<th>Date</th>
									<th>Operation</th>
									<th>nombre_ops</th>
									<th>total_depenses</th>
								</tr>
							</thead>
							<tbody>
								${costRows}
								<tr class="total-row">
									<td colspan="3" class="center">Total</td>
									<td class="amount">${formatNumber(report.manual_cost_total)} MAD</td>
								</tr>
							</tbody>
						</table>
						<div class="additional">Additional charges :</div>
						${noteRows ? `<ul class="additional-list">${noteRows}</ul>` : ''}
					</main>
				</body>
			</html>
		`);
		win.document.close();
		win.focus();
		window.setTimeout(() => win.print(), 250);
	};

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

									<Grid container spacing={2}>
										<Grid size={{ xs: 12, md: 6 }}>
											<TextField
												size="small"
												type="number"
												label={t.hiltonReports.cashRegister}
												value={cashRegisterTotal}
												onChange={(event) => setCashRegisterTotal(event.target.value)}
												fullWidth
												slotProps={{
													input: {
														startAdornment: (
															<InputAdornment position="start">
																<SavingsIcon fontSize="small" />
															</InputAdornment>
														),
														endAdornment: <InputAdornment position="end">MAD</InputAdornment>,
													},
													htmlInput: { inputMode: 'decimal', min: 0, step: '0.01' },
												}}
											/>
										</Grid>
										<Grid size={{ xs: 12, md: 6 }}>
											<TextField
												size="small"
												label={t.hiltonReports.costPeriod}
												value={costPeriodLabel}
												onChange={(event) => setCostPeriodLabel(event.target.value)}
												fullWidth
												slotProps={{
													input: {
														startAdornment: (
															<InputAdornment position="start">
																<CalendarMonthIcon fontSize="small" />
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
													<TableCell align="right">{t.hiltonReports.cashAmount}</TableCell>
													<TableCell align="right">{t.hiltonReports.costs}</TableCell>
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
																<TableCell align="right">
																	{formatNumber(toNumber(report.manual_cost_total) + toNumber(report.manual_adjustment_total))} MAD
																</TableCell>
																<TableCell align="right">{formatNumber(report.net_total)} MAD</TableCell>
																<TableCell>{report.created_by_user_name ?? '-'}</TableCell>
																<TableCell align="right">
																	<Tooltip title={t.hiltonReports.printPdf}>
																		<IconButton size="small" onClick={() => printReport(report)}>
																			<PrintIcon fontSize="small" />
																		</IconButton>
																	</Tooltip>
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
								<Grid container spacing={2}>
									<Grid size={{ xs: 12, md: 6 }}>
										<StatCard
											label={t.hiltonReports.cashRegister}
											value={`${formatNumber(viewReport.cash_register_total)} MAD`}
											icon={<SavingsIcon fontSize="small" />}
											color="#6d4c41"
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<StatCard
											label={t.hiltonReports.deductions}
											value={`${formatNumber(viewReport.manual_adjustment_total)} MAD`}
											icon={<TrendingDownIcon fontSize="small" />}
											color="#ad1457"
										/>
									</Grid>
								</Grid>
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
							<Button onClick={() => printReport(viewReport)} startIcon={<PrintIcon />}>
								{t.hiltonReports.printPdf}
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
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									size="small"
									type="number"
									label={t.hiltonReports.cashRegister}
									value={editCashRegisterTotal}
									onChange={(event) => setEditCashRegisterTotal(event.target.value)}
									fullWidth
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<SavingsIcon fontSize="small" />
												</InputAdornment>
											),
											endAdornment: <InputAdornment position="end">MAD</InputAdornment>,
										},
										htmlInput: { inputMode: 'decimal', min: 0, step: '0.01' },
									}}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									size="small"
									label={t.hiltonReports.costPeriod}
									value={editCostPeriodLabel}
									onChange={(event) => setEditCostPeriodLabel(event.target.value)}
									fullWidth
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<CalendarMonthIcon fontSize="small" />
												</InputAdornment>
											),
										},
									}}
								/>
							</Grid>
						</Grid>
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
