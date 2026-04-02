import * as types from './index';
import { WSMaintenanceAction, WSNotificationAction, WSReconnectedAction, WSUserAvatarAction } from './wsActions';
import type { NotificationType } from '@/types/reservationTypes';

describe('WSUserAvatarAction', () => {
	it('should create WS_USER_AVATAR action with pk and avatar', () => {
		const pk = 123;
		const avatar = 'avatar.png';

		const action = WSUserAvatarAction(pk, avatar);

		expect(action).toEqual({
			type: types.WS_USER_AVATAR,
			pk,
			avatar,
		});
	});
});

describe('WSMaintenanceAction', () => {
	it('should create WS_MAINTENANCE action with maintenance boolean', () => {
		const maintenance = true;

		const action = WSMaintenanceAction(maintenance);

		expect(action).toEqual({
			type: types.WS_MAINTENANCE,
			maintenance,
		});
	});
});

describe('WSReconnectedAction', () => {
	it('should create WS_RECONNECTED action', () => {
		const action = WSReconnectedAction();
		expect(action).toEqual({ type: types.WS_RECONNECTED });
	});
});

describe('WSNotificationAction', () => {
	it('should create WS_NOTIFICATION action with notification payload', () => {
		const notification: NotificationType = {
			id: 1,
			reservation_id: 99,
			title: 'Check-in tomorrow',
			message: 'Guest arriving at 14:00',
			notification_type: 'check_in',
			is_read: false,
			date_created: '2026-04-02T10:00:00Z',
		};

		const action = WSNotificationAction(notification);

		expect(action).toEqual({
			type: types.WS_NOTIFICATION,
			notification,
		});
	});
});
