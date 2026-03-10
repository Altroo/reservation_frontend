import { rootSaga } from './index';
import { AllEffect, ForkEffect } from 'redux-saga/effects';

describe('rootSaga', () => {
	it('spawns watchInit and watchAccount with retry logic', () => {
		const generator = rootSaga();
		const effect = generator.next().value as AllEffect<ForkEffect>;

		expect(effect).toMatchObject({
			'@@redux-saga/IO': true,
			combinator: true,
			type: 'ALL',
			payload: expect.arrayContaining([
				expect.objectContaining({
					type: 'FORK',
					payload: expect.objectContaining({
						detached: true,
					}),
				}),
				expect.objectContaining({
					type: 'FORK',
					payload: expect.objectContaining({
						detached: true,
					}),
				}),
			]),
		});

		// 2 sagas: watchInit, watchAccount
		expect(effect.payload).toHaveLength(2);
	});
});
