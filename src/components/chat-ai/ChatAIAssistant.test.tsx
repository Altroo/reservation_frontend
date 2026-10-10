import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatAIAssistant, ChatAIFloatingButton } from './ChatAIAssistant';
import { ChatAIResults, validConfirmation } from './ChatAIResults';
import { chatRequest, consumeChatStream } from './api';
import { getAccessToken } from '@/store/selectors';
import type { ChatCapabilities, ChatCard } from './types';
let mockToken = 'fixture-token',
	mockProfile = { id: 1, can_view: true, is_staff: false, can_access_hilton_reports: false },
	mockPath = '/dashboard',
	mockLanguage: 'en' | 'fr' = 'fr';
const mockPush = jest.fn(),
	mockDispatch = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockPath, useRouter: () => ({ push: mockPush }) }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: (selector: unknown) => (selector === getAccessToken ? mockToken : mockProfile),
	useAppDispatch: () => mockDispatch,
	useLanguage: () => ({ language: mockLanguage, t: jest.requireActual('@/translations').translations[mockLanguage] }),
}));
jest.mock('@/store/selectors', () => ({ getAccessToken: jest.fn(), getProfilState: jest.fn() }));
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('@/store/services/reservation', () => ({
	reservationApi: {
		util: { invalidateTags: (tags: string[]) => ({ type: 'reservation/invalidateTags', payload: tags }) },
	},
}));
jest.mock('./api', () => ({ ...jest.requireActual('./api'), chatRequest: jest.fn(), consumeChatStream: jest.fn() }));
const theme = createTheme({ palette: { primary: { main: '#0274D7' } } });
const themed = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>;
const capabilities: ChatCapabilities = {
	application: 'reservation',
	languages: ['fr', 'en'],
	resources: ['reservation', 'cost'],
	can_create: true,
	can_update: true,
	can_delete: true,
	can_print: false,
	suggestions: ['Affiche les derniers coûts.'],
	shortcuts: [
		{
			command: '/voir',
			title: 'Rechercher',
			help: 'Décrivez la réservation ou le client.',
			example: '/voir réservation du client Démo',
		},
	],
};
const response = (data: unknown) => ({ json: async () => data }) as Response;
const reply = (text: string, cards: ChatCard[] = []) => ({ id: 'reply-' + text, role: 'assistant', text, cards });
const deferred = <T,>() => {
	let resolve!: (v: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
let handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>;
beforeEach(() => {
	jest.clearAllMocks();
	mockToken = 'fixture-token';
	mockProfile = { id: 1, can_view: true, is_staff: false, can_access_hilton_reports: false };
	mockPath = '/dashboard';
	mockLanguage = 'fr';
	handlers = {};
	jest.mocked(chatRequest).mockImplementation(async (path, _token, init) => {
		if (handlers[path]) return handlers[path](init);
		if (path.startsWith('capabilities/')) return response(capabilities);
		if (path === 'conversations/') return response(init?.method === 'POST' ? { id: 'conversation-1' } : []);
		throw new Error('Unexpected request ' + path);
	});
	jest
		.mocked(consumeChatStream)
		.mockImplementation(async (res, receive) => receive('message.completed', await res.json()));
});
const open = async () => {
	const view = render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	await screen.findByRole('textbox', { name: 'Votre message' });
	return view;
};
const send = (text: string) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Votre message' }), { target: { value: text } });
	fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
};
it.each(['anonymous', 'no-read', 'public'])('hides the assistant for %s', (mode) => {
	if (mode === 'anonymous') mockToken = '';
	if (mode === 'no-read') mockProfile.can_view = false;
	if (mode === 'public') mockPath = '/login';
	render(themed(<ChatAIAssistant />));
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
});
it('uses the shared fixed robot launcher', () => {
	render(themed(<ChatAIFloatingButton open={false} toggle={jest.fn()} />));
	expect(screen.getByRole('button', { name: 'Ask AI Assistant' })).toHaveStyle({
		position: 'fixed',
		width: '56px',
		height: '56px',
	});
});
it('opens directly without a company control and creates an owner-scoped conversation', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Bonjour !'));
	await open();
	expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
	send('bonjour');
	await screen.findByText('Bonjour !');
	const create = jest
		.mocked(chatRequest)
		.mock.calls.find((call) => call[0] === 'conversations/' && call[2]?.method === 'POST');
	expect(JSON.parse(create![2]!.body as string)).toEqual({});
});
it('allows the independent Hilton-only permission', async () => {
	mockProfile.can_view = false;
	mockProfile.can_access_hilton_reports = true;
	handlers['capabilities/?language=fr'] = () =>
		response({
			...capabilities,
			resources: ['hilton_report'],
			can_update: false,
			can_delete: false,
			suggestions: ['Affiche les rapports Hilton.'],
			shortcuts: [],
		});
	await open();
	expect(screen.getByRole('button', { name: 'Affiche les rapports Hilton.' })).toBeVisible();
});
it('submits meaningful suggestions exactly once', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Coûts autorisés'));
	await open();
	fireEvent.click(screen.getByRole('button', { name: 'Affiche les derniers coûts.' }));
	await screen.findByText('Coûts autorisés');
	expect(jest.mocked(chatRequest).mock.calls.filter(([path]) => path.endsWith('/messages/'))).toHaveLength(1);
});
it('sends bare slash commands for usage help', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Décrivez votre réservation.'));
	await open();
	send('/voir');
	await screen.findByText('Décrivez votre réservation.');
});
it('new conversation clears prior content without adding a company picker', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private previous result'));
	await open();
	send('bonjour');
	await screen.findByText('Private previous result');
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	expect(screen.queryByText('Private previous result')).not.toBeInTheDocument();
	expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('preserves chat across routes and sends the fresh native page hint', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('First answer'));
	const view = await open();
	send('bonjour');
	await screen.findByText('First answer');
	mockPath = '/dashboard/reservations/17';
	view.rerender(themed(<ChatAIAssistant />));
	expect(screen.getByText('First answer')).toBeVisible();
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Context answer'));
	send('Explique cette réservation');
	await screen.findByText('Context answer');
	const calls = jest.mocked(chatRequest).mock.calls.filter(([path]) => path.endsWith('/messages/'));
	expect(JSON.parse(calls.at(-1)![2]!.body as string).context).toEqual({
		interface_language: 'fr',
		resource: 'reservation',
		identifier: 17,
	});
});
it('clears private chat on session expiration', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private result'));
	await open();
	send('bonjour');
	await screen.findByText('Private result');
	act(() => window.dispatchEvent(new Event('session-expired')));
	expect(screen.queryByText('Private result')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
});
it('cancellation ignores a late completion', async () => {
	const pending = deferred<Response>();
	handlers['conversations/conversation-1/messages/'] = () => pending.promise;
	await open();
	send('bonjour');
	fireEvent.click(await screen.findByRole('button', { name: 'Annuler la réponse' }));
	await act(async () => pending.resolve(response(reply('Late sensitive answer'))));
	expect(screen.queryByText('Late sensitive answer')).not.toBeInTheDocument();
});
it('loads history without a fabricated scope query', async () => {
	handlers['conversations/'] = () => response([{ id: 'old', title: 'Previous conversation' }]);
	handlers['conversations/old/'] = () => response({ id: 'old', messages: [reply('Stored reply')] });
	await open();
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	fireEvent.click(await screen.findByText('Previous conversation'));
	await screen.findByText('Stored reply');
	expect(jest.mocked(chatRequest).mock.calls.every(([path]) => !path.includes('company_id'))).toBe(true);
});
it('does not render untrusted record text as HTML or display forbidden actions', () => {
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'record_list',
						resource: 'reservation',
						items: [
							{
								id: 1,
								name: 'Demo',
								description: '<script>untrusted()</script>',
								can_update: false,
								can_delete: false,
							},
						],
					},
				]}
				navigate={jest.fn()}
				select={jest.fn()}
				permissions={{ can_update: false, can_delete: false, can_print: false }}
			/>,
		),
	);
	expect(screen.getByText('<script>untrusted()</script>')).toBeVisible();
	expect(document.querySelector('script')).toBeNull();
	expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
});
it('validates only supported exact confirmation fields', () => {
	const card: ChatCard = {
		type: 'confirmation',
		action_id: 'synthetic-id',
		record_id: 7,
		resource: 'reservation',
		operation: 'update',
		changes: { notes: 'Reviewed' },
	};
	expect(validConfirmation(card)).toBe(true);
	expect(validConfirmation({ ...card, changes: { amount: '1' } })).toBe(false);
	expect(validConfirmation({ ...card, resource: 'hilton_report' })).toBe(false);
	expect(validConfirmation({ ...card, operation: 'delete', changes: {} })).toBe(true);
});
it('shows form labels rather than database field names', () => {
	render(
		themed(
			<ChatAIResults
				cards={[
					{
						type: 'confirmation',
						action_id: 'synthetic-id',
						record_id: 7,
						resource: 'reservation',
						operation: 'update',
						changes: { guest_name: 'Demo Guest' },
						before: { guest_name: 'Demo Before' },
					},
				]}
				navigate={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText(/Nom du client.*Demo Before.*Demo Guest/)).toBeVisible();
	expect(screen.queryByText(/guest_name/)).not.toBeInTheDocument();
});
it('honours native record-level action restrictions', () => {
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'cost', items: [{ id: 1, name: 'Demo', can_delete: false }] }]}
				navigate={jest.fn()}
				select={jest.fn()}
				permissions={{ can_update: true, can_delete: true, can_print: false }}
			/>,
		),
	);
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
});
it('does not inject raw status codes', () => {
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'rent', items: [{ id: 1, name: 'Demo rent', status: 'unpaid' }] }]}
				navigate={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText('Impayé')).toBeVisible();
	expect(screen.queryByText('unpaid')).not.toBeInTheDocument();
});
