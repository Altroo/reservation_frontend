'use client';
import { type ChangeEvent } from 'react';
import { Box } from '@mui/material';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import AiAssistantControl from '@/components/shared/aiAssistantControl/aiAssistantControl';
import { isAiTextField } from '@/utils/aiTextFields';

type Props = TextFieldProps & { aiInline?: boolean };

const AiTextField = ({ aiInline = false, ...props }: Props) => {
	const fieldName = props.name || props.id || (typeof props.label === 'string' ? props.label : '');
	const input = props.slotProps?.input;
	const htmlInput = props.slotProps?.htmlInput;
	const readOnly =
		(typeof input === 'object' && input.readOnly) ||
		(typeof htmlInput === 'object' && 'readOnly' in htmlInput && htmlInput.readOnly);
	const maxLength =
		typeof htmlInput === 'object' && 'maxLength' in htmlInput ? Number(htmlInput.maxLength) || undefined : undefined;
	const show =
		!props.select &&
		!props.disabled &&
		!readOnly &&
		typeof props.value === 'string' &&
		!!props.onChange &&
		!!fieldName &&
		isAiTextField(fieldName, props.type || 'text');
	if (!show) return <TextField {...props} />;
	return (
		<Box
			sx={{
				width: props.fullWidth ? '100%' : undefined,
				flex: props.fullWidth ? 1 : undefined,
				minWidth: 0,
				...(aiInline ? { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 } : {}),
			}}
		>
			<Box sx={aiInline ? { flex: '1 1 420px', minWidth: 0 } : undefined}>
				<TextField {...props} />
			</Box>
			<Box sx={aiInline ? { flex: '0 0 auto', alignSelf: 'center', maxWidth: '100%' } : undefined}>
				<AiAssistantControl
					inline={aiInline}
					value={props.value as string}
					context="form"
					maxLength={maxLength}
					onApply={(value) =>
						props.onChange?.({
							target: { name: props.name || props.id || '', id: props.id || '', value },
							currentTarget: { name: props.name || props.id || '', id: props.id || '', value },
						} as ChangeEvent<HTMLInputElement>)
					}
				/>
			</Box>
		</Box>
	);
};
export default AiTextField;
