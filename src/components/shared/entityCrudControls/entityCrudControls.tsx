"use client";

import React, { useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import type { ApiErrorResponseType } from '@/types/_initTypes';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import AddEntityModal from '@/components/shared/addEntityModal/addEntityModal';
import { useLanguage } from '@/utils/hooks';

type EntityCrudControlsProps = {
	label: string;
	icon: React.ReactNode;
	inputTheme: Theme;
	selectedItem: DropDownType | null;
	addEntity: (args: { data: { nom: string } }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	editEntity: (args: { id: number; data: { nom: string } }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	deleteEntity: (args: { id: number }) => Promise<unknown> & { unwrap?: () => Promise<unknown> };
	onAddSuccess: (id: number) => void;
	onDeleteSuccess?: () => void;
	disabled?: boolean;
};

const getMutationErrorMessage = (error: unknown, fallback: string): string => {
	const payload =
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
		(error as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
		(error as ApiErrorResponseType);

	if (payload?.details && typeof payload.details === 'object') {
		const detailsValues = Object.values(payload.details);
		if (detailsValues.length > 0) {
			const firstError = detailsValues[0];
			return String(Array.isArray(firstError) ? firstError[0] : firstError);
		}
	}

	return fallback;
};

const EntityCrudControls: React.FC<EntityCrudControlsProps> = ({
	label,
	icon,
	inputTheme,
	selectedItem,
	addEntity,
	editEntity,
	deleteEntity,
	onAddSuccess,
	onDeleteSuccess,
	disabled = false,
}) => {
	const { t } = useLanguage();
	const [openAddModal, setOpenAddModal] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [editName, setEditName] = useState('');
	const [editError, setEditError] = useState<string | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);

	const selectedId = useMemo(() => {
		if (!selectedItem?.value) return null;
		const parsed = Number(selectedItem.value);
		return Number.isFinite(parsed) ? parsed : null;
	}, [selectedItem]);

	const handleEditOpen = () => {
		if (!selectedItem?.code) return;
		setEditName(selectedItem.code);
		setEditError(null);
		setEditOpen(true);
	};

	const handleEditSubmit = async () => {
		if (!selectedId || !editName.trim()) return;
		setActionLoading(true);
		try {
			const request = editEntity({ id: selectedId, data: { nom: editName.trim() } });
			if (typeof request.unwrap === 'function') {
				await request.unwrap();
			} else {
				await request;
			}
			setEditOpen(false);
		} catch (error) {
			setEditError(getMutationErrorMessage(error, t.addEntityModal.entityAddError(label)));
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedId) return;
		setActionLoading(true);
		try {
			const request = deleteEntity({ id: selectedId });
			if (typeof request.unwrap === 'function') {
				await request.unwrap();
			} else {
				await request;
			}
			setDeleteOpen(false);
			onDeleteSuccess?.();
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<>
			<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', ml: 1 }}>
				{selectedItem && (
					<>
						<IconButton size="small" onClick={handleEditOpen} title={t.common.update} disabled={disabled}>
							<EditIcon fontSize="small" />
						</IconButton>
						<IconButton
							size="small"
							onClick={() => setDeleteOpen(true)}
							title={t.common.delete}
							color="error"
							disabled={disabled}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</>
				)}
				<Button size="small" variant="outlined" onClick={() => setOpenAddModal(true)} disabled={disabled}>
					{t.common.add}
				</Button>
			</Stack>

			<AddEntityModal
				open={openAddModal}
				setOpen={setOpenAddModal}
				label={label}
				icon={icon}
				inputTheme={inputTheme}
				mutationFn={addEntity}
				onSuccess={onAddSuccess}
			/>

			<Dialog open={editOpen} onClose={() => setEditOpen(false)}>
				<DialogTitle>{`${t.common.update} ${label}`}</DialogTitle>
				<DialogContent>
					<Stack sx={{ mt: 1 }}>
						<CustomTextInput
							autoFocus
							id={`edit_${label}`}
							type="text"
							label={label}
							fullWidth
							size="small"
							value={editName}
							onChange={(event) => {
								setEditName(event.target.value);
								if (editError) setEditError(null);
							}}
							error={Boolean(editError)}
							helperText={editError ?? ''}
							theme={inputTheme}
							startIcon={icon}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditOpen(false)}>{t.common.cancel}</Button>
					<Button onClick={handleEditSubmit} variant="contained" disabled={actionLoading || !editName.trim()}>
						{t.common.update}
					</Button>
				</DialogActions>
			</Dialog>

			{deleteOpen && selectedItem && (
				<ActionModals
					title={`${t.common.delete} ${label}`}
					body={`${t.common.delete} ${selectedItem.code} ?`}
					actions={[
						{
							text: t.common.cancel,
							active: false,
							onClick: () => setDeleteOpen(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							text: t.common.delete,
							active: true,
							onClick: handleDeleteConfirm,
							icon: <DeleteIcon />,
							color: '#D32F2F',
							disabled: actionLoading,
						},
					]}
					onClose={() => setDeleteOpen(false)}
				/>
			)}
		</>
	);
};

export default EntityCrudControls;
