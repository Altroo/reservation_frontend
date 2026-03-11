import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddEntityModal from './addEntityModal';
import { textInputTheme } from '@/utils/themes';

const inputTheme = textInputTheme();

type MockTextInputProps = {
	id?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	helperText?: string;
};

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => {
	return {
		__esModule: true,
		default: (props: MockTextInputProps) => {
			const id = props.id ?? 'mock-input';
			return React.createElement(
				'div',
				null,
				React.createElement('input', {
					'data-testid': id,
					value: props.value ?? '',
					onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange?.(e),
					role: 'textbox',
				}),
				React.createElement('span', { 'data-testid': `${id}-helper` }, props.helperText ?? ''),
			);
		},
	};
});

describe('AddEntityModal', () => {
	const label = 'Categorie';
	const inputId = `new_${label}`;
	let setOpen = jest.fn();

	beforeEach(() => {
		setOpen = jest.fn();
		jest.clearAllMocks();
	});

	it('renders title, buttons and input', () => {
		const mutationFn = jest.fn().mockResolvedValue(undefined);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		expect(screen.getByText(`Ajouter un(e) ${label}`)).toBeInTheDocument();
		expect(screen.getByText('Annuler')).toBeInTheDocument();
		expect(screen.getByText('Ajouter')).toBeInTheDocument();
		expect(screen.getByTestId(inputId)).toBeInTheDocument();
	});

	it('shows validation error when trying to add with empty name', async () => {
		const mutationFn = jest.fn().mockResolvedValue(undefined);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`).textContent).toContain(`Le nom du ${label} est requis.`);
		});

		expect(mutationFn).not.toHaveBeenCalled();
	});

	it('calls mutationFn and closes modal on successful add', async () => {
		const mutationFn = jest.fn().mockResolvedValue(undefined);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		const input = screen.getByTestId(inputId);
		await act(async () => {
			fireEvent.change(input, { target: { value: 'NewName' } });
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(mutationFn).toHaveBeenCalledWith({ data: { nom: 'NewName' } });
		});

		expect(setOpen).toHaveBeenCalledWith(false);
	});

	it('calls onSuccess callback with new entity ID when provided', async () => {
		const newEntityId = 123;
		const mutationFn = jest.fn().mockResolvedValue({ data: { id: newEntityId } });
		const onSuccess = jest.fn();

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
				onSuccess={onSuccess}
			/>,
		);

		const input = screen.getByTestId(inputId);
		await act(async () => {
			fireEvent.change(input, { target: { value: 'NewName' } });
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(mutationFn).toHaveBeenCalledWith({ data: { nom: 'NewName' } });
		});

		expect(onSuccess).toHaveBeenCalledWith(newEntityId);
		expect(setOpen).toHaveBeenCalledWith(false);
	});

	it('displays server field error from payload.details[label] when mutation rejects with structured error', async () => {
		const payload = { error: { details: { [label]: ['Already exists'] } } };
		const mutationFn = jest.fn().mockRejectedValue(payload);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		const input = screen.getByTestId(inputId);
		await act(async () => {
			fireEvent.change(input, { target: { value: 'NewName' } });
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`).textContent).toContain('Already exists');
		});

		expect(setOpen).not.toHaveBeenCalledWith(false);
	});

	it('displays server field error from payload.details.nom when mutation rejects (backend standard)', async () => {
		const payload = { error: { details: { nom: ['Un objet Catégorie avec ce champ Nom de la catégorie existe déjà.'] } } };
		const mutationFn = jest.fn().mockRejectedValue(payload);

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		const input = screen.getByTestId(inputId);
		await act(async () => {
			fireEvent.change(input, { target: { value: 'NewName' } });
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`).textContent).toContain('Un objet Catégorie avec ce champ Nom de la catégorie existe déjà.');
		});

		expect(setOpen).not.toHaveBeenCalledWith(false);
	});

	it('displays generic error message when mutation rejects with unknown shape', async () => {
		const mutationFn = jest.fn().mockRejectedValue(new Error('boom'));

		render(
			<AddEntityModal
				open={true}
				setOpen={setOpen}
				label={label}
				icon={null}
				inputTheme={inputTheme}
				mutationFn={mutationFn}
			/>,
		);

		const input = screen.getByTestId(inputId);
		await act(async () => {
			fireEvent.change(input, { target: { value: 'NewName' } });
		});

		await act(async () => {
			fireEvent.click(screen.getByText('Ajouter'));
		});

		await waitFor(() => {
			expect(screen.getByTestId(`${inputId}-helper`).textContent).toMatch(/Erreur lors de l.ajout du/);
		});

		expect(setOpen).not.toHaveBeenCalledWith(false);
	});
});
