import { createApi } from '@reduxjs/toolkit/query/react';
import { retry } from '@reduxjs/toolkit/query';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { ApartmentClass, ReservationClass } from '@/models/classes';
import type { ApiErrorResponseType, PaginationResponseType } from '@/types/_initTypes';
import type {
	ReservationFormType,
	DashboardStatsType,
	PlanningMonthType,
	BalanceType,
	CostType,
	CostFormType,
	NotificationType,
	NotificationPreferenceType,
} from '@/types/reservationTypes';

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
	tagTypes: ['Reservation', 'Apartment', 'Dashboard', 'Planning', 'Balance', 'Cost', 'Notification', 'NotificationPreference'],
	baseQuery: baseQueryWithRetry,
	endpoints: (builder) => ({
		// ── Apartments ──────────────────────────────────────────────────────
		getApartments: builder.query<ApartmentClass[], void>({
			query: () => ({ url: process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS, method: 'GET' }),
			providesTags: ['Apartment'],
		}),

		addApartment: builder.mutation<ApartmentClass, { data: { nom: string } }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Apartment'],
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
		getDashboardStats: builder.query<DashboardStatsType, { year?: number }>({
			query: ({ year }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_DASHBOARD,
				method: 'GET',
				params: { year },
			}),
			providesTags: ['Dashboard'],
		}),

		// ── Planning ─────────────────────────────────────────────────────────
		getPlanning: builder.query<PlanningMonthType, { year: number; month: number }>({
			query: ({ year, month }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_PLANNING,
				method: 'GET',
				params: { year, month },
			}),
			providesTags: ['Planning'],
		}),

		// ── Balance ──────────────────────────────────────────────────────────
		getBalance: builder.query<BalanceType, { year?: number }>({
			query: ({ year }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_BALANCE,
				method: 'GET',
				params: { year },
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
		getCosts: builder.query<CostType[], { year?: number; month?: number }>({
			query: ({ year, month }) => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_COSTS,
				method: 'GET',
				params: { year, month },
			}),
			providesTags: ['Cost'],
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

		// ── Apartments detail ─────────────────────────────────────────────
		updateApartment: builder.mutation<ApartmentClass, { id: number; data: { nom: string } }>({
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
		getNotifications: builder.query<NotificationType[], void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATIONS,
				method: 'GET',
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
			{ notify_check_in: boolean; notify_check_out: boolean; reminder_minutes: number }
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
	}),
});

export const {
	useGetApartmentsQuery,
	useAddApartmentMutation,
	useUpdateApartmentMutation,
	useDeleteApartmentMutation,
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
	useCreateCostMutation,
	useUpdateCostMutation,
	useDeleteCostMutation,
	useGetNotificationsQuery,
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
	useMarkNotificationsReadMutation,
	useGetUnreadNotificationCountQuery,
} = reservationApi;
