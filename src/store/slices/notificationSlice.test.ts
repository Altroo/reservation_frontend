import reducer, { setUnreadCount, incrementUnreadCount, setLatestNotification } from './notificationSlice';
import type { NotificationType } from '@/types/reservationTypes';

describe('notification slice', () => {
	const sampleNotification: NotificationType = {
		id: 1,
		reservation_id: 10,
		title: 'Arrivée — John Doe',
		message: 'John Doe arrive le 2026-04-01 à l\'appartement Apt 1.',
		notification_type: 'check_in',
		is_read: false,
		date_created: '2026-03-30T10:00:00Z',
	};

	it('returns the initial state when given undefined state', () => {
		const state = reducer(undefined, { type: '@@INIT' });
		expect(state).toEqual({
			unreadCount: 0,
			latestNotification: null,
		});
	});

	it('setUnreadCount sets the unread count to the payload value', () => {
		const next = reducer(undefined, setUnreadCount(5));
		expect(next.unreadCount).toBe(5);
	});

	it('setUnreadCount can set count to zero', () => {
		const state = { unreadCount: 3, latestNotification: null };
		const next = reducer(state, setUnreadCount(0));
		expect(next.unreadCount).toBe(0);
	});

	it('incrementUnreadCount increments the count by one', () => {
		const state = { unreadCount: 2, latestNotification: null };
		const next = reducer(state, incrementUnreadCount());
		expect(next.unreadCount).toBe(3);
	});

	it('incrementUnreadCount from zero', () => {
		const next = reducer(undefined, incrementUnreadCount());
		expect(next.unreadCount).toBe(1);
	});

	it('setLatestNotification stores the notification', () => {
		const next = reducer(undefined, setLatestNotification(sampleNotification));
		expect(next.latestNotification).toEqual(sampleNotification);
	});

	it('setLatestNotification overwrites a previous notification', () => {
		const state = { unreadCount: 1, latestNotification: sampleNotification };
		const newNotif: NotificationType = {
			...sampleNotification,
			id: 2,
			title: 'Départ — Jane Smith',
			notification_type: 'check_out',
		};
		const next = reducer(state, setLatestNotification(newNotif));
		expect(next.latestNotification).toEqual(newNotif);
		expect(next.latestNotification?.id).toBe(2);
	});
});
