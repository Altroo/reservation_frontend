import React, { useMemo, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { customDropdownTheme } from '@/utils/themes';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import type { Theme } from '@mui/material/styles';
import { useLanguage } from '@/utils/hooks';

type AddEntityModalProps = {
	open: boolean;
	setOpen: (val: boolean) => void;
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	mutationFn: (args: { data: { nom: string; building?: number | null } }) => Promise<unknown>;
	onSuccess?: (newEntityId: number) => void;
	buildings?: { id: number; nom: string }[];
};

const AddEntityModal: React.FC<AddEntityModalProps> = ({
	open,
	setOpen,
	label,
	icon,
	inputTheme,
	mutationFn,
	onSuccess,
	buildings,
}) => {
	const { t } = useLanguage();
	const [newName, setNewName] = useState('');
	const [selectedBuilding, setSelectedBuilding] = useState<number | ''>('');
	const [error, setError] = useState<string | null>(null);
	const [prevOpen, setPrevOpen] = useState(false);

	const buildingItems: DropDownType[] = useMemo(
		() => [
			{ code: 'none', value: t.common.none },
			...(buildings ?? []).map((b) => ({ code: String(b.id), value: b.nom })),
		],
		[buildings, t.common.none],
	);

	if (prevOpen !== open) {
		setPrevOpen(open);
		if (open && buildings?.length === 1) {
			setSelectedBuilding(buildings[0].id);
			setError(null);
		} else if (!open) {
			setNewName('');
			setSelectedBuilding('');
			setError(null);
		}
	}

	return (
		<Modal
			open={open}
			onClose={() => setOpen(false)}
			disableScrollLock={false}
			disableRestoreFocus={true}
			keepMounted={false}
		>
			<Box
				sx={{
					p: 3,
					bgcolor: 'background.paper',
					borderRadius: 2,
					maxWidth: 420,
					width: '90%',
					mx: 'auto',
					mt: '15vh',
					boxShadow: 24,
				}}
			>
				<Typography
					variant="h6"
					sx={{
						mb: 2,
					}}
				>
					{t.addEntityModal.addEntity(label)}
				</Typography>

				<CustomTextInput
					id={`new_${label}`}
					type="text"
					label={t.addEntityModal.entityName(label)}
					value={newName}
					onChange={(e) => {
						setNewName(e.target.value);
						if (error) setError(null);
					}}
					error={Boolean(error)}
					helperText={error ?? ''}
					fullWidth={true}
					size="small"
					theme={inputTheme}
					startIcon={icon}
				/>

				{buildings && buildings.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<CustomDropDownSelect
							id={`building-select-${label}`}
							size="small"
							label={t.common.residence}
							items={buildingItems}
							value={
								selectedBuilding === ''
									? t.common.none
									: (buildings.find((b) => b.id === selectedBuilding)?.nom ?? t.common.none)
							}
							onChange={(e) => {
								const val = e.target.value;
								if (!val || val === t.common.none) setSelectedBuilding('');
								else {
									const b = buildings.find((x) => x.nom === val);
									setSelectedBuilding(b ? b.id : '');
								}
							}}
							theme={customDropdownTheme()}
							startIcon={<ApartmentIcon />}
						/>
					</Box>
				)}

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
					<Button onClick={() => setOpen(false)}>{t.common.cancel}</Button>
					<Button
						variant="contained"
						onClick={async () => {
							if (!newName.trim()) {
								setError(t.addEntityModal.entityNameRequired(label));
								return;
							}

							try {
								const buildingValue = selectedBuilding === '' ? null : selectedBuilding;
								const result = await mutationFn({
									data: { nom: newName.trim(), ...(buildings ? { building: buildingValue } : {}) },
								});

								// Check if result contains an error (RTK Query pattern)
								if (result && typeof result === 'object' && 'error' in result) {
									// Handle RTK Query error response
									// RTK Query wraps the error in { error: { status: ..., data: { ... } } }
									const errorWrapper = result.error as { status?: number; data?: ApiErrorResponseType };
									const payload = errorWrapper?.data || (errorWrapper as ApiErrorResponseType);

									// Extract error message from any field in details object
									if (payload?.details && typeof payload.details === 'object') {
										const detailsValues = Object.values(payload.details);
										if (detailsValues.length > 0) {
											const firstError = detailsValues[0];
											const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
											setError(errorMsg as string);
										} else {
											setError(t.addEntityModal.entityAddError(label));
										}
									} else {
										setError(t.addEntityModal.entityAddError(label));
									}
									// Don't close modal on error
									return;
								}

								// Success - close modal and update field
								setOpen(false);
								setNewName('');
								setSelectedBuilding('');
								setError(null);

								// Extract the ID from the result and call onSuccess if provided
								if (onSuccess && result && typeof result === 'object' && 'data' in result) {
									const responseData = result.data as { id?: number };
									const newId = responseData?.id;
									if (newId) {
										// Use setTimeout to ensure state update happens after modal closes
										setTimeout(() => {
											onSuccess(newId);
										}, 0);
									}
								}
							} catch (e) {
								// Handle thrown exceptions (fallback)
								const payload =
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
									(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
									(e as ApiErrorResponseType);

								// Extract error message from any field in details object
								if (payload?.details && typeof payload.details === 'object') {
									const detailsValues = Object.values(payload.details);
									if (detailsValues.length > 0) {
										const firstError = detailsValues[0];
										const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
										setError(errorMsg as string);
									} else {
										setError(t.addEntityModal.entityAddError(label));
									}
								} else {
									setError(t.addEntityModal.entityAddError(label));
								}
							}
						}}
					>
						{t.common.add}
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default AddEntityModal;
