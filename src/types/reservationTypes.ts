export type PaymentSourceType = 'Booking' | 'Airbnb' | 'Cash' | 'Bank';

export interface ApartmentType {
	id: number;
	nom: string;
}

export interface ReservationListType {
	id: number;
	apartment: number;
	apartment_nom: string;
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
