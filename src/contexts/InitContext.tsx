'use client';

import React, { createContext, PropsWithChildren } from 'react';
import { useAppSelector } from '@/utils/hooks';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';
import { emptyInitStateToken } from '@/store/slices/_initSlice';
import { getInitStateToken } from '@/store/selectors';

const InitContext = createContext<InitStateInterface<InitStateToken>>({
	initStateToken: emptyInitStateToken,
});

export const InitContextProvider: React.FC<PropsWithChildren<Record<string, unknown>>> = (props) => {
	const initState = useAppSelector(getInitStateToken);
	const contextValue: InitStateInterface<InitStateToken> = {
		initStateToken: initState || emptyInitStateToken,
	};
	return <InitContext.Provider value={contextValue}>{props.children}</InitContext.Provider>;
};

export default InitContext;
