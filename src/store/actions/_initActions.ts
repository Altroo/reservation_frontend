import * as types from './index';
import { Session } from 'next-auth';

export const initAppAction = () => {
	return {
		type: types.INIT_APP,
	};
};

export const initAppSessionTokensAction = (session: Session) => {
	return {
		type: types.INIT_APP_SESSION_TOKENS,
		session,
	};
};

export const refreshAppTokenStatesAction = (session: Session) => {
	return {
		type: types.REFRESH_APP_TOKEN_STATES,
		session,
	};
};
