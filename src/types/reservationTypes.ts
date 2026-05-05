export type PaymentSourceType = 'Booking' | 'Airbnb' | 'Cash' | 'Bank';

export interface ApartmentType {
	id: number;
	nom: string;
	building: number | null;
	building_nom: string | null;
}

export interface ReservationListType {
	id: number;
	apartment: number;
	apartment_nom: string;
	apartment_building: number | null;
	apartment_building_nom: string | null;
	guest_name: string;
	check_in: string;
	check_out: string;
	nights: number;
	amount: string;
	payment_source: PaymentSourceType | string;
	payment_source_display: string;
	amount_returned: boolean;
	notes: string | null;
	created_by_user: number | null;
	created_by_user_name: string;
	date_created: string;
	date_updated: string;
}

export interface ReservationFormType {
	apartment: number | '';
	guest_name: string;
	check_in: string;
	check_out: string;
	amount: string;
	payment_source: PaymentSourceType | string;
	notes: string;
}

// Dashboard / Stats
export interface MonthlyRevenueType {
	month: number;
	total: number;
	count: number;
}

export interface SourceRevenueType {
	source: PaymentSourceType | string;
	total: number;
	count: number;
}

export interface ApartmentRevenueType {
	nom: string;
	total: number;
	count: number;
}

export interface OccupancyApartmentType {
	nom: string;
	occupied_days: number;
	reservation_count: number;
	revenue: number;
}

export interface DailyRevenueType {
	date: string;
	total: number;
}

export interface DashboardStatsType {
	year: number;
	total_revenue: number;
	annual_costs: number;
	net_profit: number;
	by_source: SourceRevenueType[];
	monthly_revenue: MonthlyRevenueType[];
	by_apartment: ApartmentRevenueType[];
	occupancy_by_apartment: Record<string, OccupancyApartmentType>;
	daily_revenue: DailyRevenueType[];
}

// Planning
export interface PlanningApartmentType {
	id: number;
	nom: string;
	reservations: ReservationListType[];
}

export interface PlanningMonthType {
	year: number;
	month: number;
	last_day: number;
	apartments: Record<string, PlanningApartmentType>;
}

// Balance
export interface BalanceMonthlyType {
	total: number;
	count: number;
}

export interface BalanceApartmentType {
	nom: string;
	monthly: Record<number, BalanceMonthlyType>;
	year_total: number;
}

export interface BalanceReservationType {
	id: number;
	apartment_nom: string;
	guest_name: string;
	check_in: string;
	check_out: string;
	amount: number;
	payment_source: string;
	amount_returned: boolean;
}

export interface BalanceType {
	year: number;
	apartments: Record<string, BalanceApartmentType>;
	total_returned: number;
	total_not_returned: number;
	reservations: BalanceReservationType[];
}
// Costs
export type CostCategoryType = 'Entretien' | 'Charges' | 'Assurance' | 'Taxes' | 'Autre';

export interface CostType {
	id: number;
	description: string;
	amount: string;
	date: string;
	category: CostCategoryType | string;
	building: number | null;
	building_nom: string | null;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface CostFormType {
	description: string;
	amount: string;
	date: string;
	category: CostCategoryType | string;
	building: number | '' | null;
}

// Hilton reports
export type HiltonReportManualLineKind = 'cost' | 'adjustment' | 'note';

export interface HiltonReportManualLineType {
	id?: number;
	line_type: HiltonReportManualLineKind;
	description: string;
	amount: string;
	sort_order?: number;
}

export interface HiltonReportApartmentRevenueType {
	id?: number;
	apartment: number | null;
	apartment_nom: string;
	reservation_count: number;
	total_amount: string;
}

export interface HiltonReportType {
	id: number;
	building_name: string;
	start_date: string;
	end_date: string;
	notes: string;
	gross_revenue: string;
	manual_cost_total: string;
	manual_adjustment_total: string;
	booking_total: string;
	airbnb_total: string;
	cash_revenue_total: string;
	cash_total: string;
	bank_total: string;
	net_total: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
	apartment_revenues: HiltonReportApartmentRevenueType[];
	manual_lines: HiltonReportManualLineType[];
}

export interface HiltonReportFormType {
	start_date?: string;
	end_date?: string;
	notes?: string;
	manual_lines?: HiltonReportManualLineType[];
}

export interface HiltonReportPreviewType {
	building_name: string;
	start_date: string;
	end_date: string;
	gross_revenue: string;
	manual_cost_total: string;
	manual_adjustment_total: string;
	booking_total: string;
	airbnb_total: string;
	cash_revenue_total: string;
	cash_total: string;
	bank_total: string;
	net_total: string;
	apartment_revenues: HiltonReportApartmentRevenueType[];
}

// Formik form state (includes globalError for form-level error display)
export interface ReservationFormValues {
	apartment: number | '';
	guest_name: string;
	check_in: string;
	check_out: string;
	amount: string;
	payment_source: string;
	notes: string;
	globalError: string;
}

export interface CostFormValues {
	description: string;
	amount: string;
	date: string;
	category: string;
	building: number | '';
	globalError: string;
}

// Notifications
export type NotificationTypeValue = 'check_in' | 'check_out';

export interface NotificationType {
	id: number;
	reservation_id: number | null;
	title: string;
	message: string;
	notification_type: NotificationTypeValue;
	is_read: boolean;
	date_created: string;
}

export type ReminderMinutesValue = 0 | 15 | 30 | 60 | 120 | 1440 | 2880;

export interface NotificationPreferenceType {
	id: number;
	notify_check_in: boolean;
	notify_check_out: boolean;
	notify_unpaid_rents: boolean;
	reminder_minutes: ReminderMinutesValue;
	date_created: string;
	date_updated: string;
}

export interface NotificationPreferenceFormValues {
	notify_check_in: boolean;
	notify_check_out: boolean;
	notify_unpaid_rents: boolean;
	reminder_minutes: ReminderMinutesValue;
	globalError: string;
}
