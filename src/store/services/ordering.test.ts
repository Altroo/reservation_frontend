import { usersApi } from './account';
import { reservationApi } from './reservation';
import { setupApiStore } from '@/store/setupApiStore';

jest.mock('@/utils/axiosBaseQuery', () => {
	const baseQuery = jest.fn(async () => ({ data: { count: 0, results: [] } }));
	return { axiosBaseQuery: () => baseQuery, mockOrderingBaseQuery: baseQuery };
});
const { mockOrderingBaseQuery } = jest.requireMock('@/utils/axiosBaseQuery') as { mockOrderingBaseQuery: jest.Mock };

describe('getUsersList ordering', () => {
	const storeRef = setupApiStore(usersApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(usersApi.endpoints.getUsersList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getBuildings ordering', () => {
	const storeRef = setupApiStore(reservationApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(reservationApi.endpoints.getBuildings.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getCosts ordering', () => {
	const storeRef = setupApiStore(reservationApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(reservationApi.endpoints.getCosts.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getLocauxList ordering', () => {
	const storeRef = setupApiStore(reservationApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(reservationApi.endpoints.getLocauxList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getReservationsList ordering', () => {
	const storeRef = setupApiStore(reservationApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(reservationApi.endpoints.getReservationsList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});
