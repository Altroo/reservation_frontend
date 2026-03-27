import React from 'react';
import { Alert, Typography } from '@mui/material';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';

type Props = {
	errorDetails?: Record<string, unknown> | null;
	cssStyle?: SxProps<Theme>;
	children?: React.ReactNode;
};

function formatValue(value: unknown): string {
	if (Array.isArray(value)) return value.join(', ');
	if (value !== null && typeof value === 'object') {
		const str = JSON.stringify(value);
		return str === '{}' || str === '[]' ? '' : str;
	}
	return String(value ?? '');
}

const ApiAlert: React.FC<Props> = (props: Props) => {
	const errorDetails = props.errorDetails;

	const lines: { key: string; text: string }[] = [];

	if (errorDetails) {
		for (const [key, value] of Object.entries(errorDetails)) {
			const text = formatValue(value);
			if (text) {
				lines.push({ key, text });
			}
		}
	}

	return (
		<Alert severity="error" sx={props.cssStyle}>
			{lines.length > 0
				? lines.map(({ key, text }) => (
						<Typography key={key} variant="body2" component="div">
							<strong>{key}</strong> : {text}
						</Typography>
					))
				: 'Une erreur est survenue. Veuillez réessayer plus tard.'}
		</Alert>
	);
};

export default ApiAlert;
