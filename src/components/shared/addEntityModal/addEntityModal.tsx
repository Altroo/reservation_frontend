import React, { useState } from 'react';
import { Modal, Box, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import type { Theme } from '@mui/material/styles';

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

const AddEntityModal: React.FC<AddEntityModalProps> = ({ open, setOpen, label, icon, inputTheme, mutationFn, onSuccess, buildings }) => {
	const [newName, setNewName] = useState('');
	const [selectedBuilding, setSelectedBuilding] = useState<number | ''>('');
	const [error, setError] = useState<string | null>(null);
	const [prevOpen, setPrevOpen] = useState(false);

	if (prevOpen !== open) {
		setPrevOpen(open);
		if (!open) {
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
				<Typography variant="h6" mb={2}>
					Ajouter un(e) {label}
				</Typography>

				<CustomTextInput
					id={`new_${label}`}
					type="text"
					label={`Nom du ${label}`}
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
					<FormControl fullWidth size="small" sx={{ mt: 2 }}>
						<InputLabel id={`building-select-label-${label}`}>Résidence</InputLabel>
						<Select
							labelId={`building-select-label-${label}`}
							value={selectedBuilding}
							label="Résidence"
							onChange={(e) => setSelectedBuilding(e.target.value as number | '')}
						>
							<MenuItem value="">
								<em>Aucune</em>
							</MenuItem>
							{buildings.map((b) => (
								<MenuItem key={b.id} value={b.id}>{b.nom}</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
					<Button onClick={() => setOpen(false)}>Annuler</Button>
					<Button
						variant="contained"
						onClick={async () => {
							if (!newName.trim()) {
								setError(`Le nom du ${label} est requis.`);
								return;
							}
							
							try {
								const buildingValue = selectedBuilding === '' ? null : selectedBuilding;
								const result = await mutationFn({ data: { nom: newName.trim(), ...(buildings ? { building: buildingValue } : {}) } });
								
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
											setError(`Erreur lors de l'ajout du ${label}.`);
										}
									} else {
										setError(`Erreur lors de l'ajout du ${label}.`);
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
										setError(`Erreur lors de l'ajout du ${label}.`);
									}
								} else {
									setError(`Erreur lors de l'ajout du ${label}.`);
								}
							}
						}}
					>
						Ajouter
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default AddEntityModal;
