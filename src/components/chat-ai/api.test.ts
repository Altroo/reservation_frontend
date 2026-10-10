import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';
import { consumeChatStream, safeNavigation } from './api';
import type { NavigationTarget } from './types';
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('next-auth/react', () => ({ getSession: jest.fn() }));
Object.assign(globalThis, { TextDecoder });
const target: NavigationTarget = {
	application: 'reservation',
	resource: 'reservation',
	identifier: 12,
	path: '/dashboard/reservations/12',
};
it.each([
	'javascript:alert(1)',
	'//example.invalid',
	'https://example.invalid',
	'/dashboard/reservations/13',
	'/dashboard/reservations/12?company_id=1',
])('rejects substituted path %s', (path) => expect(safeNavigation({ ...target, path })).toBeNull());
it('accepts only the actual application and exact native route', () => {
	expect(safeNavigation(target)).toBe(target.path);
	expect(safeNavigation({ ...target, application: 'contrat' } as unknown as NavigationTarget)).toBeNull();
	expect(safeNavigation({ ...target, resource: 'apartment', path: '/dashboard/apartments/12' })).toBeNull();
	expect(
		safeNavigation({ ...target, resource: 'reservation_new', identifier: null, path: '/dashboard/reservations/new' }),
	).toBe('/dashboard/reservations/new');
	expect(
		safeNavigation({ ...target, resource: 'hilton_reports', identifier: null, path: '/dashboard/hilton-reports' }),
	).toBe('/dashboard/hilton-reports');
});
const stream = (...parts: string[]) =>
	({
		body: new ReadableStream({
			start(controller) {
				for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
				controller.close();
			},
		}),
	}) as unknown as Response;
it('reads split events and rejects truncated streams', async () => {
	const receive = jest.fn();
	await consumeChatStream(
		stream('event: message.delta\ndata: {"text":"Bonjour"}', '\n\nevent: message.completed\ndata: {"id":"done"}\n\n'),
		receive,
	);
	expect(receive).toHaveBeenCalledWith('message.delta', { text: 'Bonjour' });
	await expect(
		consumeChatStream(stream('event: message.delta\ndata: {"text":"partial"}\n\n'), receive),
	).rejects.toMatchObject({ code: 'INCOMPLETE_RESPONSE' });
});
it('keeps permission errors during streaming', async () => {
	await expect(
		consumeChatStream(stream('event: error\ndata: {"code":"PERMISSION_DENIED"}\n\n'), jest.fn()),
	).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
});
