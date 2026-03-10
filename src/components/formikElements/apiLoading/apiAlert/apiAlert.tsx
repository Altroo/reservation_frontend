import React from 'react';
import { Alert } from '@mui/material';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';

type Props = {
	errorDetails?: Record<string, string[]> | { error: string[] } | null;
	cssStyle?: SxProps<Theme>;
	children?: React.ReactNode;
};

const ApiAlert: React.FC<Props> = (props: Props) => {
	const errorDetails = props.errorDetails;
	const errorMessage: Array<Record<string, Array<string>>> = [];

	if (errorDetails) {
		if ('error' in errorDetails) {
			errorMessage.push({ error: errorDetails.error });
		} else if (typeof errorDetails === 'object') {
			const errorResult: Record<string, Array<string>> = {};
			for (const [key, value] of Object.entries(errorDetails)) {
				if (!errorResult[key]) {
					errorResult[key] = [];
				}
				if (Array.isArray(value)) {
					value.map((singleError) => {
						errorResult[key].push(singleError);
					});
				} else {
					errorResult[key].push(String(value));
				}
				errorMessage.push(errorResult);
			}
		}
	}

	return (
		<Alert severity="error" sx={props.cssStyle}>
			{errorMessage.length > 0
				? errorMessage.map((error) => {
						return Object.keys(error).map((k) => {
							return `${k} : ${error[k]}`;
						});
					})
				: 'Une erreur est survenue. Veuillez réessayer plus tard.'}
		</Alert>
	);
};

export default ApiAlert;
