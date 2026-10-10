import { useState } from 'react';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { DeleteOutlined, EditOutlined, OpenInNew } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import TextButton from '@/components/htmlElements/buttons/textButton/textButton';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import styles from './shared/chat-ai.module.css';
import type { ChatCard, NavigationTarget } from './types';

const resources: Record<string, [string, string]> = {
	reservation: ['Réservation', 'Reservation'],
	building: ['Résidence', 'Residence'],
	apartment: ['Appartement', 'Apartment'],
	cost: ['Coût', 'Cost'],
	local: ['Local', 'Premises'],
	rent: ['Loyer enregistré', 'Recorded rent'],
	hilton_report: ['Rapport Hilton', 'Hilton report'],
	user: ['Utilisateur', 'User'],
};
const fields: Record<string, [string, string]> = {
	guest_name: ['Nom du client', 'Guest name'],
	notes: ['Notes', 'Notes'],
	nom: ['Nom', 'Name'],
	description: ['Description', 'Description'],
	adresse: ['Adresse', 'Address'],
	locataire_nom: ['Nom du locataire', 'Tenant name'],
};
const editable: Record<string, string[]> = {
	reservation: ['guest_name', 'notes'],
	building: ['nom'],
	apartment: ['nom'],
	cost: ['description'],
	local: ['nom', 'adresse', 'locataire_nom', 'notes'],
	rent: ['notes'],
};
export const validConfirmation = (card: ChatCard) => {
	if (
		card.type !== 'confirmation' ||
		!card.action_id ||
		!Number.isSafeInteger(card.record_id) ||
		card.record_id! < 1 ||
		!Object.hasOwn(editable, card.resource ?? '')
	)
		return false;
	const changes = card.changes ?? {};
	if (typeof changes !== 'object' || Array.isArray(changes)) return false;
	const keys = Object.keys(changes);
	if (card.operation === 'delete') return keys.length === 0;
	return (
		card.operation === 'update' &&
		keys.length > 0 &&
		keys.every(
			(key) => editable[card.resource!].includes(key) && (typeof changes[key] === 'string' || changes[key] === null),
		)
	);
};
type Props = {
	cards: ChatCard[];
	navigate: (target: NavigationTarget) => void;
	confirm?: (card: ChatCard) => Promise<void>;
	select?: (resource: string, identifier: number, operation: 'edit' | 'delete') => void;
	permissions?: { can_update: boolean; can_delete: boolean; can_print: boolean };
};
export const ChatAIResults = ({ cards, navigate, confirm, select, permissions }: Props) => {
	const { language } = useLanguage();
	const en = language === 'en';
	const index = en ? 1 : 0;
	const [pending, setPending] = useState<ChatCard | null>(null);
	const [sending, setSending] = useState(false);
	const [done, setDone] = useState<Set<string>>(new Set());
	const action = async () => {
		if (!pending || !confirm || sending || !validConfirmation(pending)) return;
		setSending(true);
		try {
			await confirm(pending);
			setDone((old) => new Set(old).add(pending.action_id!));
			setPending(null);
		} finally {
			setSending(false);
		}
	};
	const label = (resource?: string) => resources[resource ?? '']?.[index] ?? (en ? 'Record' : 'Document');
	const amount = (value?: string) =>
		value === undefined
			? ''
			: new Intl.NumberFormat(en ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 2 }).format(Number(value));
	if (!cards.length) return null;
	return (
		<Stack spacing={1.5}>
			{cards.map((card, i) => (
				<Box key={i}>
					{card.items && (
						<>
							<Typography variant="caption" color="text.secondary">
								{card.items.length
									? `${card.items.length} ${en ? 'result(s)' : 'résultat(s)'}`
									: en
										? 'No matching result. Refine your search.'
										: 'Aucun résultat trouvé. Précisez votre recherche.'}
							</Typography>
							{card.items.map((record) => (
								<Paper key={record.id} variant="outlined" className={styles.result}>
									<Typography variant="caption" color="text.secondary">
										{label(card.resource)}
									</Typography>
									<Stack direction="row" sx={{ gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
										<Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
											{record.name}
										</Typography>
										{record.status && (
											<Chip
												size="small"
												variant="outlined"
												label={
													record.status === 'paid'
														? en
															? 'Paid'
															: 'Payé'
														: record.status === 'unpaid'
															? en
																? 'Unpaid'
																: 'Impayé'
															: en
																? 'Status unavailable'
																: 'Statut indisponible'
												}
											/>
										)}
									</Stack>
									{record.project && (
										<Typography variant="body2">
											{en ? 'Project' : 'Projet'} : {record.project}
										</Typography>
									)}
									{record.client && (
										<Typography variant="body2">
											{en ? 'Customer' : 'Client'} : {record.client}
										</Typography>
									)}
									{record.supplier && (
										<Typography variant="body2">
											{en ? 'Supplier' : 'Fournisseur'} : {record.supplier}
										</Typography>
									)}
									{record.description && (
										<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
											{record.description}
										</Typography>
									)}
									{record.quantity !== undefined && (
										<Typography variant="body2">
											{en ? 'Quantity' : 'Quantité'} : {record.quantity}
										</Typography>
									)}
									{record.reference && (
										<Typography variant="body2">
											{en ? 'Reference' : 'Référence'} : {record.reference}
										</Typography>
									)}
									{record.date && (
										<Typography variant="caption" color="text.secondary">
											{record.date}
										</Typography>
									)}
									{record.amount !== undefined && (
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											{amount(record.amount)} {record.currency}
										</Typography>
									)}
									{record.details?.map((detail) => (
										<Typography key={detail.label} variant="body2">
											{en ? detail.label_en : detail.label} : {detail.value}
										</Typography>
									))}
									<Divider sx={{ my: 1 }} />
									<Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
										{record.navigation && (
											<TextButton
												cssClass={styles.resultAction}
												buttonText={record.open_label || (en ? 'Open' : 'Voir')}
												startIcon={<OpenInNew fontSize="small" />}
												onClick={() => navigate(record.navigation!)}
											/>
										)}
										{permissions?.can_update &&
											record.can_update === true &&
											select &&
											Object.hasOwn(editable, card.resource ?? '') && (
												<TextButton
													cssClass={styles.resultAction}
													buttonText={en ? 'Edit' : 'Modifier'}
													startIcon={<EditOutlined fontSize="small" />}
													onClick={() => select(card.resource!, record.id, 'edit')}
												/>
											)}
										{permissions?.can_delete &&
											record.can_delete === true &&
											select &&
											Object.hasOwn(editable, card.resource ?? '') && (
												<TextButton
													cssClass={styles.resultAction}
													buttonText={en ? 'Delete' : 'Supprimer'}
													startIcon={<DeleteOutlined fontSize="small" />}
													onClick={() => select(card.resource!, record.id, 'delete')}
												/>
											)}
									</Stack>
								</Paper>
							))}
							{card.has_more && (
								<Typography variant="caption">
									{en
										? 'More results exist. Refine your search.'
										: 'D’autres résultats existent. Précisez votre recherche.'}
								</Typography>
							)}
						</>
					)}
					{card.type === 'financial_summary' && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{en ? card.label_en : card.label}
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{amount(card.value)} {card.currency}
							</Typography>
							<Typography variant="caption">
								{card.period?.date_from} — {card.period?.date_to}
							</Typography>
							<Typography variant="body2">{en ? card.definition_en : card.definition}</Typography>
						</Paper>
					)}
					{card.type === 'confirmation_status' && <Typography variant="body2">{card.message}</Typography>}
					{card.type === 'confirmation' && (
						<Paper variant="outlined" className={styles.result}>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								{card.operation === 'delete' ? (en ? 'Delete' : 'Supprimer') : en ? 'Edit' : 'Modifier'}{' '}
								{label(card.resource)} : {card.label}
							</Typography>
							{validConfirmation(card) &&
								Object.keys(card.changes ?? {}).map((key) => (
									<Typography key={key} variant="body2">
										{fields[key]?.[index]} : {card.before?.[key] ?? '—'} → {card.changes?.[key] ?? '—'}
									</Typography>
								))}
							<TextButton
								cssClass={styles.resultAction}
								buttonText={
									done.has(card.action_id!)
										? en
											? 'Action completed'
											: 'Action effectuée'
										: en
											? 'Review this action'
											: 'Vérifier cette action'
								}
								disabled={!validConfirmation(card) || !confirm || done.has(card.action_id!)}
								onClick={() => setPending(card)}
							/>
						</Paper>
					)}

					{card.target && (
						<TextButton
							cssClass={styles.resultAction}
							buttonText={en ? 'Open page' : 'Ouvrir la page'}
							onClick={() => navigate(card.target!)}
						/>
					)}
					{card.documents?.map((doc) => (
						<Typography key={doc.document_id} variant="caption" color="text.secondary">
							Source : {doc.title}
						</Typography>
					))}
				</Box>
			))}
			{pending && (
				<ActionModals
					title={`${pending.operation === 'delete' ? (en ? 'Delete' : 'Supprimer') : en ? 'Edit' : 'Modifier'} ${pending.label}`}
					body={pending.warning}
					onClose={() => {
						if (!sending) setPending(null);
					}}
					actions={[
						{ text: en ? 'Cancel' : 'Annuler', active: false, disabled: sending, onClick: () => setPending(null) },
						{
							text: sending ? (en ? 'Sending…' : 'En cours…') : en ? 'Confirm this action' : 'Confirmer cette action',
							active: true,
							disabled: sending || !validConfirmation(pending),
							color: pending.operation === 'delete' ? '#C62828' : '#0274D7',
							onClick: () => {
								void action().catch(() => {});
							},
						},
					]}
				>
					{Object.keys(pending.changes ?? {})
						.filter((key) => Object.hasOwn(fields, key))
						.map((key) => (
							<Typography key={key} variant="body2">
								{fields[key][index]} : {pending.before?.[key] ?? '—'} → {pending.changes?.[key] ?? '—'}
							</Typography>
						))}
				</ActionModals>
			)}
		</Stack>
	);
};
