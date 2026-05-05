import { createApi } from '@reduxjs/toolkit/query/react';
import { retry } from '@reduxjs/toolkit/query';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { ApartmentClass, BuildingClass, ReservationClass, LocalClass, LoyerClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType } from '@/types/_initTypes';
import type {
	ReservationFormType,
	DashboardStatsType,
	PlanningMonthType,
	BalanceType,
	CostType,
	CostFormType,
	HiltonReportFormType,
	HiltonReportPreviewType,
	HiltonReportType,
	NotificationType,
	NotificationPreferenceType,
} from '@/types/reservationTypes';
import type {
	LocalFormType,
	LocalPlanningResponse,
	LocalDashboardResponse,
	LocalYearsResponse,
	LoyerFormType,
} from '@/types/localTypes';
import type { BuildingFormType } from '@/types/buildingTypes';

const rawBaseQuery = axiosBaseQuery((api) =>
	isAuthenticatedInstance(
		() => getInitStateToken(api.getState() as RootState),
		() => api.dispatch(initToken()),
	),
);

// Retry up to 2 times on 503 (server overloaded/restarting) or status 0 (network failure).
// All other errors abort immediately.
const baseQueryWithRetry = retry(
	async (args, api, extraOptions) => {
		const result = await rawBaseQuery(args, api, extraOptions);
		if (result.error && result.error.status !== 503 && result.error.status !== 0) {
			retry.fail(result.error);
		}
		return result;
	},
	{ maxRetries: 2 },
);

export const reservationApi = createApi({
	reducerPath: 'reservationApi',
	tagTypes: ['Reservation', 'Apartment', 'PaymentSource', 'Dashboard', 'Planning', 'Balance', 'Cost', 'CostCategory', 'HiltonReport', 'Notification', 'NotificationPreference', 'Local', 'LocalType', 'Loyer', 'LocalDashboard', 'LocalPlanning', 'Building'],
	baseQuery: baseQueryWithRetry,
	endpoints: (builder) => ({
		// ── Apartments ──────────────────────────────────────────────────────
		getApartments: builder.query<ApartmentClass[], void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS, method: 'GET' }),
			providesTags: ['Apartment'],
		}),

		addApartment: builder.mutation<ApartmentClass, { data: { nom: string; building?: number | null } }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Apartment'],
		}),

		getPaymentSources: builder.query<Array<{ id: number; nom: string }>, void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_RESERVATION_PAYMENT_SOURCES, method: 'GET' }),
			providesTags: ['PaymentSource'],
		}),

		addPaymentSource: builder.mutation<{ id: number; nom: string }, { data: { nom: string } }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_PAYMENT_SOURCES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['PaymentSource', 'Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		updatePaymentSource: builder.mutation<{ id: number; nom: string }, { id: number; data: { nom: string } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_PAYMENT_SOURCES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['PaymentSource', 'Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		deletePaymentSource: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_PAYMENT_SOURCES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['PaymentSource'],
		}),

		// ── Reservations ────────────────────────────────────────────────────
		getReservationsList: builder.query<
			Array<Partial<ReservationClass>> | PaginationResponseType<ReservationClass>,
			{
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				payment_source?: string;
				apartment?: number;
				year?: number;
				month?: number;
				check_in_after?: string;
				check_in_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ with_pagination, page, pageSize, search, payment_source, apartment, year, month, check_in_after, check_in_before, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_LIST,
				method: 'GET',
				params: {
					pagination: with_pagination || undefined,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					payment_source,
					apartment,
					year,
					month,
					check_in_after,
					check_in_before,
					...rest,
				},
			}),
			providesTags: ['Reservation'],
		}),

		getReservation: builder.query<ReservationClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Reservation'],
		}),

		createReservation: builder.mutation<ReservationClass | ApiErrorResponseType, ReservationFormType>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_LIST,
				method: 'POST',
				data: payload,
			}),
			invalidatesTags: ['Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		updateReservation: builder.mutation<
			ReservationClass | ApiErrorResponseType,
			{ id: number; data: ReservationFormType }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		deleteReservation: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		bulkDeleteReservations: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_LIST}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Reservation', 'Dashboard', 'Planning', 'Balance'],
		}),

		// ── Dashboard ────────────────────────────────────────────────────────
		getDashboardStats: builder.query<DashboardStatsType, { year?: number; building?: number }>({
			query: ({ year, building }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_DASHBOARD,
				method: 'GET',
				params: { year, building },
			}),
			providesTags: ['Dashboard'],
		}),

		// ── Planning ─────────────────────────────────────────────────────────
		getPlanning: builder.query<PlanningMonthType, { year: number; month: number; building?: number }>({
			query: ({ year, month, building }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_PLANNING,
				method: 'GET',
				params: { year, month, building },
			}),
			providesTags: ['Planning'],
		}),

		// ── Balance ──────────────────────────────────────────────────────────
		getBalance: builder.query<BalanceType, { year?: number; building?: number }>({
			query: ({ year, building }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_BALANCE,
				method: 'GET',
				params: { year, building },
			}),
			providesTags: ['Balance'],
		}),

		toggleAmountReturned: builder.mutation<
			{ id: number; amount_returned: boolean },
			{ id: number; amount_returned: boolean }
		>({
			query: ({ id, amount_returned }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_LIST}${id}/toggle-returned/`,
				method: 'PATCH',
				data: { amount_returned },
			}),
			invalidatesTags: ['Balance'],
		}),

		// ── Years ─────────────────────────────────────────────────────────────
		getReservationYears: builder.query<{ years: number[] }, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_YEARS,
				method: 'GET',
			}),
			providesTags: ['Dashboard'],
		}),

		// ── Occupied dates ──────────────────────────────────────────────────
		getOccupiedDates: builder.query<
			{ check_in: string; check_out: string }[],
			{ apartment: number | string; exclude?: number | string }
		>({
			query: ({ apartment, exclude }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_OCCUPIED_DATES,
				method: 'GET',
				params: { apartment, ...(exclude ? { exclude } : {}) },
			}),
			providesTags: ['Reservation'],
		}),

		// ── Costs ────────────────────
		getCostYears: builder.query<{ years: number[] }, void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_RESERVATION_COST_YEARS, method: 'GET' }),
			providesTags: ['Cost'],
		}),
		getCosts: builder.query<CostType[], { year?: number; month?: number; building?: number }>({
			query: ({ year, month, building }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_COSTS,
				method: 'GET',
				params: { year, month, building },
			}),
			providesTags: ['Cost'],
		}),

		getCostCategories: builder.query<Array<{ id: number; nom: string }>, void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_RESERVATION_COST_CATEGORIES, method: 'GET' }),
			providesTags: ['CostCategory'],
		}),

		addCostCategory: builder.mutation<{ id: number; nom: string }, { data: { nom: string } }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_COST_CATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['CostCategory', 'Cost', 'Dashboard'],
		}),

		updateCostCategory: builder.mutation<{ id: number; nom: string }, { id: number; data: { nom: string } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_COST_CATEGORIES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['CostCategory', 'Cost', 'Dashboard'],
		}),

		deleteCostCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_COST_CATEGORIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['CostCategory'],
		}),

		createCost: builder.mutation<CostType, { data: CostFormType }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_COSTS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Cost', 'Dashboard'],
		}),

		updateCost: builder.mutation<CostType, { id: number; data: CostFormType }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_COSTS}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Cost', 'Dashboard'],
		}),

		deleteCost: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_COSTS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Cost', 'Dashboard'],
		}),

		bulkDeleteCosts: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_COSTS}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Cost', 'Dashboard'],
		}),

		// ── Hilton reports ───────────────────────────────────────────────
		getHiltonReports: builder.query<HiltonReportType[], void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS,
				method: 'GET',
			}),
			providesTags: ['HiltonReport'],
		}),

		getHiltonReport: builder.query<HiltonReportType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS}${id}/`,
				method: 'GET',
			}),
			providesTags: ['HiltonReport'],
		}),

		previewHiltonReport: builder.query<
			HiltonReportPreviewType,
			{ start_date?: string; end_date?: string }
		>({
			query: ({ start_date, end_date }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS}preview/`,
				method: 'GET',
				params: { start_date, end_date },
			}),
			providesTags: ['HiltonReport'],
		}),

		createHiltonReport: builder.mutation<HiltonReportType, HiltonReportFormType>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['HiltonReport'],
		}),

		updateHiltonReport: builder.mutation<
			HiltonReportType,
			{ id: number; data: HiltonReportFormType }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['HiltonReport'],
		}),

		deleteHiltonReport: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_HILTON_REPORTS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['HiltonReport'],
		}),

		// ── Apartments detail ─────────────────────────────────────────────
		updateApartment: builder.mutation<ApartmentClass, { id: number; data: { nom: string; building?: number | null } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Apartment', 'Reservation', 'Planning', 'Balance'],
		}),

		deleteApartment: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Apartment'],
		}),

		// ── Notifications ────────────────────────────────────────────────
		getNotifications: builder.query<PaginationResponseType<NotificationType>, { page?: number }>({
			query: ({ page } = {}) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATIONS,
				method: 'GET',
				params: { page: page || 1 },
			}),
			providesTags: ['Notification'],
		}),

		getNotificationPreferences: builder.query<NotificationPreferenceType, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_PREFERENCES,
				method: 'GET',
			}),
			providesTags: ['NotificationPreference'],
		}),

		updateNotificationPreferences: builder.mutation<
			NotificationPreferenceType,
			{
				notify_check_in: boolean;
				notify_check_out: boolean;
				notify_unpaid_rents: boolean;
				reminder_minutes: number;
			}
		>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_PREFERENCES,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['NotificationPreference'],
		}),

		markNotificationsRead: builder.mutation<void, { ids?: number[] }>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_MARK_READ,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Notification'],
		}),

		getUnreadNotificationCount: builder.query<{ count: number }, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_UNREAD_COUNT,
				method: 'GET',
			}),
			providesTags: ['Notification'],
		}),

		// ── Locaux ────────────────────────────────────────────────────────
		getLocauxList: builder.query<
			Array<Partial<LocalClass>> | PaginationResponseType<LocalClass>,
			{
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				type_local?: string;
				en_location?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ with_pagination, page, pageSize, search, type_local, en_location, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_LOCAL_LIST,
				method: 'GET',
				params: {
					pagination: with_pagination || undefined,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					type_local,
					en_location,
					...rest,
				},
			}),
			providesTags: ['Local'],
		}),

		getLocal: builder.query<LocalClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Local'],
		}),

		getLocalTypes: builder.query<Array<{ id: number; nom: string }>, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_LOCAL_TYPES,
				method: 'GET',
			}),
			providesTags: ['LocalType'],
		}),

		addLocalType: builder.mutation<{ id: number; nom: string }, { data: { nom: string } }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_LOCAL_TYPES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['LocalType', 'Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		updateLocalType: builder.mutation<{ id: number; nom: string }, { id: number; data: { nom: string } }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_TYPES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['LocalType', 'Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		deleteLocalType: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_TYPES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['LocalType'],
		}),

		createLocal: builder.mutation<LocalClass | ApiErrorResponseType, LocalFormType>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_LOCAL_LIST,
				method: 'POST',
				data: payload,
			}),
			invalidatesTags: ['Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		updateLocal: builder.mutation<LocalClass | ApiErrorResponseType, { id: number; data: LocalFormType }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		deleteLocal: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		bulkDeleteLocaux: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_LOCAL_LIST}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Local', 'LocalDashboard', 'LocalPlanning'],
		}),

		// ── Loyers ────────────────────────────────────────────────────────
		getLoyersList: builder.query<
			LoyerClass[],
			{ local?: number; annee?: number; mois?: number; paye?: string }
		>({
			query: ({ local, annee, mois, paye }) => ({
				url: process.env.NEXT_PUBLIC_LOYER_LIST,
				method: 'GET',
				params: { local, annee, mois, paye },
			}),
			providesTags: ['Loyer'],
		}),

		getLoyer: builder.query<LoyerClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_LOYER_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Loyer'],
		}),

		createLoyer: builder.mutation<LoyerClass | ApiErrorResponseType, LoyerFormType>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_LOYER_LIST,
				method: 'POST',
				data: payload,
			}),
			invalidatesTags: ['Loyer', 'LocalDashboard', 'LocalPlanning'],
		}),

		updateLoyer: builder.mutation<LoyerClass | ApiErrorResponseType, { id: number; data: LoyerFormType }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_LOYER_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Loyer', 'LocalDashboard', 'LocalPlanning'],
		}),

		deleteLoyer: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_LOYER_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Loyer', 'LocalDashboard', 'LocalPlanning'],
		}),

		toggleLoyerPaid: builder.mutation<{ id: number; paye: boolean }, { id: number; paye: boolean }>({
			query: ({ id, paye }) => ({
				url: `${process.env.NEXT_PUBLIC_LOYER_LIST}${id}/toggle-paid/`,
				method: 'PATCH',
				data: { paye },
			}),
			invalidatesTags: ['Loyer', 'LocalDashboard', 'LocalPlanning'],
		}),

		// ── Local Planning ────────────────────────────────────────────────
		getLocalPlanning: builder.query<LocalPlanningResponse, { year: number; building?: number }>({
			query: ({ year, building }) => ({
				url: process.env.NEXT_PUBLIC_LOCAL_PLANNING,
				method: 'GET',
				params: { year, building },
			}),
			providesTags: ['LocalPlanning'],
		}),

		// ── Local Dashboard ───────────────────────────────────────────────
		getLocalDashboard: builder.query<LocalDashboardResponse, { year: number; building?: number }>({
			query: ({ year, building }) => ({
				url: process.env.NEXT_PUBLIC_LOCAL_DASHBOARD,
				method: 'GET',
				params: { year, building },
			}),
			providesTags: ['LocalDashboard'],
		}),

		// ── Local Years ──────────────────────────────────────────────────
		getLocalYears: builder.query<LocalYearsResponse, void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_LOCAL_YEARS,
				method: 'GET',
			}),
			providesTags: ['LocalDashboard'],
		}),

		// ── Buildings ────────────────────────────────────────────────────
		getBuildings: builder.query<BuildingClass[], void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_BUILDING_LIST, method: 'GET' }),
			providesTags: ['Building'],
		}),

		getBuilding: builder.query<BuildingClass, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_BUILDING_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Building'],
		}),

		createBuilding: builder.mutation<BuildingClass | ApiErrorResponseType, BuildingFormType>({
			query: (payload) => ({
				url: process.env.NEXT_PUBLIC_BUILDING_LIST,
				method: 'POST',
				data: payload,
			}),
			invalidatesTags: ['Building'],
		}),

		updateBuilding: builder.mutation<BuildingClass | ApiErrorResponseType, { id: number; data: BuildingFormType }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_BUILDING_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Building'],
		}),

		deleteBuilding: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_BUILDING_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Building'],
		}),

		bulkDeleteBuildings: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_BUILDING_LIST}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Building'],
		}),
	}),
});

export const {
	useGetApartmentsQuery,
	useAddApartmentMutation,
	useUpdateApartmentMutation,
	useDeleteApartmentMutation,
	useGetPaymentSourcesQuery,
	useAddPaymentSourceMutation,
	useUpdatePaymentSourceMutation,
	useDeletePaymentSourceMutation,
	useGetReservationsListQuery,
	useGetReservationQuery,
	useCreateReservationMutation,
	useUpdateReservationMutation,
	useDeleteReservationMutation,
	useBulkDeleteReservationsMutation,
	useGetDashboardStatsQuery,
	useGetPlanningQuery,
	useGetBalanceQuery,
	useToggleAmountReturnedMutation,
	useGetReservationYearsQuery,
	useGetOccupiedDatesQuery,
	useGetCostYearsQuery,
	useGetCostsQuery,
	useGetCostCategoriesQuery,
	useAddCostCategoryMutation,
	useUpdateCostCategoryMutation,
	useDeleteCostCategoryMutation,
	useCreateCostMutation,
	useUpdateCostMutation,
	useDeleteCostMutation,
	useBulkDeleteCostsMutation,
	useGetHiltonReportsQuery,
	useGetHiltonReportQuery,
	usePreviewHiltonReportQuery,
	useCreateHiltonReportMutation,
	useUpdateHiltonReportMutation,
	useDeleteHiltonReportMutation,
	useGetNotificationsQuery,
	useLazyGetNotificationsQuery,
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
	useMarkNotificationsReadMutation,
	useGetUnreadNotificationCountQuery,
	useGetLocauxListQuery,
	useGetLocalQuery,
	useGetLocalTypesQuery,
	useAddLocalTypeMutation,
	useUpdateLocalTypeMutation,
	useDeleteLocalTypeMutation,
	useCreateLocalMutation,
	useUpdateLocalMutation,
	useDeleteLocalMutation,
	useBulkDeleteLocauxMutation,
	useGetLoyersListQuery,
	useGetLoyerQuery,
	useCreateLoyerMutation,
	useUpdateLoyerMutation,
	useDeleteLoyerMutation,
	useToggleLoyerPaidMutation,
	useGetLocalPlanningQuery,
	useGetLocalDashboardQuery,
	useGetLocalYearsQuery,
	useGetBuildingsQuery,
	useGetBuildingQuery,
	useCreateBuildingMutation,
	useUpdateBuildingMutation,
	useDeleteBuildingMutation,
	useBulkDeleteBuildingsMutation,
} = reservationApi;
