import { createApi } from '@reduxjs/toolkit/query/react';
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
} from '@/types/reservationTypes';

export const reservationApi = createApi({
	reducerPath: 'reservationApi',
	tagTypes: ['Reservation', 'Apartment', 'Dashboard', 'Planning', 'Balance'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
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
	}),
});

export const {
	useGetApartmentsQuery,
	useAddApartmentMutation,
	useGetReservationsListQuery,
	useGetReservationQuery,
	useCreateReservationMutation,
	useUpdateReservationMutation,
	useDeleteReservationMutation,
	useBulkDeleteReservationsMutation,
	useGetDashboardStatsQuery,
	useGetPlanningQuery,
	useGetBalanceQuery,
} = reservationApi;
