import { reservationApi } from '@/store/services/reservation';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_RESERVATION_APARTMENTS ||= 'https://example.com/api/apartments/';
	process.env.NEXT_PUBLIC_RESERVATION_LIST ||= 'https://example.com/api/reservations/';
	process.env.NEXT_PUBLIC_RESERVATION_DASHBOARD ||= 'https://example.com/api/dashboard/';
	process.env.NEXT_PUBLIC_RESERVATION_PLANNING ||= 'https://example.com/api/planning/';
	process.env.NEXT_PUBLIC_RESERVATION_BALANCE ||= 'https://example.com/api/balance/';
	process.env.NEXT_PUBLIC_RESERVATION_COSTS ||= 'https://example.com/api/costs/';
	process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATIONS ||= 'https://example.com/api/notifications/';
	process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_PREFERENCES ||= 'https://example.com/api/notifications/preferences/';
	process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_MARK_READ ||= 'https://example.com/api/notifications/mark-read/';
	process.env.NEXT_PUBLIC_RESERVATION_NOTIFICATION_UNREAD_COUNT ||= 'https://example.com/api/notifications/unread-count/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('reservationApi', () => {
	const storeRef = setupApiStore(reservationApi);

	describe('Apartment endpoints', () => {
		it('getApartments query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getApartments.initiate(),
			);
			expect('error' in result).toBe(false);
		});

		it('addApartment mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.addApartment.initiate({ data: { nom: 'Apt Test' } }),
			);
			expect('error' in result).toBe(false);
		});

		it('updateApartment mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.updateApartment.initiate({ id: 1, data: { nom: 'Apt Updated' } }),
			);
			expect('error' in result).toBe(false);
		});

		it('deleteApartment mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.deleteApartment.initiate({ id: 1 }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Reservation endpoints', () => {
		it('getReservationsList query with pagination should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getReservationsList.initiate({
					with_pagination: true,
					page: 1,
					pageSize: 10,
					search: '',
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('getReservation query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getReservation.initiate({ id: 1 }),
			);
			expect('error' in result).toBe(false);
		});

		it('createReservation mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.createReservation.initiate({
					apartment: 1,
					guest_name: 'Test Guest',
					check_in: '2024-01-01',
					check_out: '2024-01-05',
					amount: '1000',
					payment_source: 'Airbnb',
					notes: '',
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('updateReservation mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.updateReservation.initiate({
					id: 1,
					data: {
						apartment: 1,
						guest_name: 'Updated Guest',
						check_in: '2024-01-01',
						check_out: '2024-01-05',
						amount: '1500',
						payment_source: 'Booking',
						notes: 'Updated',
					},
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('deleteReservation mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.deleteReservation.initiate({ id: 1 }),
			);
			expect('error' in result).toBe(false);
		});

		it('bulkDeleteReservations mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.bulkDeleteReservations.initiate({ ids: [1, 2, 3] }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Dashboard endpoints', () => {
		it('getDashboardStats query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getDashboardStats.initiate({ year: 2024 }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Planning endpoints', () => {
		it('getPlanning query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getPlanning.initiate({ year: 2024, month: 6 }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Balance endpoints', () => {
		it('getBalance query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getBalance.initiate({ year: 2024 }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Cost endpoints', () => {
		it('getCosts query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getCosts.initiate({ year: 2024 }),
			);
			expect('error' in result).toBe(false);
		});

		it('createCost mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.createCost.initiate({
					data: {
						description: 'Test Cost',
						amount: '500',
						date: '2024-01-15',
						category: 'Maintenance',
					},
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('updateCost mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.updateCost.initiate({
					id: 1,
					data: {
						description: 'Updated Cost',
						amount: '750',
						date: '2024-02-01',
						category: 'Utilities',
					},
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('deleteCost mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.deleteCost.initiate({ id: 1 }),
			);
			expect('error' in result).toBe(false);
		});
	});

	describe('Notification endpoints', () => {
		it('getNotifications query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getNotifications.initiate(),
			);
			expect('error' in result).toBe(false);
		});

		it('getNotificationPreferences query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getNotificationPreferences.initiate(),
			);
			expect('error' in result).toBe(false);
		});

		it('updateNotificationPreferences mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.updateNotificationPreferences.initiate({
					notify_check_in: true,
					notify_check_out: false,
					reminder_minutes: 60,
				}),
			);
			expect('error' in result).toBe(false);
		});

		it('markNotificationsRead mutation should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.markNotificationsRead.initiate({ ids: [1, 2] }),
			);
			expect('error' in result).toBe(false);
		});

		it('getUnreadNotificationCount query should complete without error', async () => {
			const result = await storeRef.store.dispatch(
				reservationApi.endpoints.getUnreadNotificationCount.initiate(),
			);
			expect('error' in result).toBe(false);
		});
	});
});
