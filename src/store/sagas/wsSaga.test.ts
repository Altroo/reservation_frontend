import { runSaga } from 'redux-saga';
import { watchWS } from './wsSaga';
import { initWebsocket } from '@/store/services/ws';
import { getAccessToken } from '@/store/selectors';
import type { Action } from 'redux';
import { eventChannel } from 'redux-saga';
import * as Types from '@/store/actions';
import { setWSMaintenance } from '@/store/slices/wsSlice';
import { incrementUnreadCount, setLatestNotification } from '@/store/slices/notificationSlice';
import type { NotificationType } from '@/types/reservationTypes';

jest.mock('@/store/services/ws', () => ({
	initWebsocket: jest.fn(),
}));

jest.mock('@/store/selectors', () => ({
	getAccessToken: jest.fn(),
}));

jest.mock('@/store/sagas/_initSaga', () => ({
	initMaintenanceSaga: jest.fn(function* () {}),
}));

import { initMaintenanceSaga } from '@/store/sagas/_initSaga';

jest.mock('@/store/services/reservation', () => ({
	reservationApi: {
		util: {
			invalidateTags: jest.fn((tags: string[]) => ({ type: 'reservationApi/invalidateTags', payload: tags })),
		},
	},
}));

describe('watchWS saga', () => {
	it('should initialize websocket and dispatch actions from the channel', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction: Action = { type: 'MOCK_ACTION' };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10); // emit after saga starts
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		// Cancel after short delay to break infinite loop
		setTimeout(() => task.cancel(), 100);

		await task.toPromise();

		expect(initWebsocket).toHaveBeenCalledWith(mockToken);
		expect(dispatched).toContainEqual(mockAction);
	}, 10000); // Optional: increase timeout to 10s

	it('should call initMaintenanceSaga on WS_RECONNECTED', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction = { type: Types.WS_RECONNECTED };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10);
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		setTimeout(() => task.cancel(), 100);
		await task.toPromise();

		expect(initMaintenanceSaga).toHaveBeenCalled();
	});

	it('should map WS_MAINTENANCE to setWSMaintenance', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockAction = { type: Types.WS_MAINTENANCE, maintenance: true };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10);
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		setTimeout(() => task.cancel(), 100);
		await task.toPromise();

		expect(initWebsocket).toHaveBeenCalledWith(mockToken);
		expect(dispatched).toContainEqual(setWSMaintenance(true));
	});

	it('should handle WS_NOTIFICATION by dispatching notification actions', async () => {
		const dispatched: Action[] = [];
		const mockToken = 'mock-token';
		const mockNotification: NotificationType = {
			id: 1,
			reservation_id: 10,
			title: 'Arrivée — Test Guest',
			message: 'Test Guest arrive le 2026-04-01.',
			notification_type: 'check_in',
			is_read: false,
			date_created: '2026-03-30T10:00:00Z',
		};
		const mockAction = { type: Types.WS_NOTIFICATION, notification: mockNotification };

		(getAccessToken as jest.Mock).mockReturnValue(mockToken);

		const mockChannel = eventChannel((emit) => {
			const timer = setTimeout(() => emit(mockAction), 10);
			return () => clearTimeout(timer);
		});

		(initWebsocket as jest.Mock).mockReturnValue(mockChannel);

		const task = runSaga(
			{
				dispatch: (action: Action) => dispatched.push(action),
				getState: () => ({ auth: { token: mockToken } }),
			},
			watchWS,
		);

		setTimeout(() => task.cancel(), 100);
		await task.toPromise();

		expect(initWebsocket).toHaveBeenCalledWith(mockToken);
		expect(dispatched).toContainEqual(incrementUnreadCount());
		expect(dispatched).toContainEqual(setLatestNotification(mockNotification));
	});
});
