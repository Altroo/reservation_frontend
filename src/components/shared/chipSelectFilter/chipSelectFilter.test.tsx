import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChipSelectFilter from './chipSelectFilter';
import type { ChipSelectOption } from './chipSelectFilter';
import '@testing-library/jest-dom';

const renderWithTheme = (ui: React.ReactElement) =>
	render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

const options: ChipSelectOption[] = [
	{ id: "1", nom: 'Céramique' },
	{ id: "2", nom: 'Bois' },
	{ id: "3", nom: 'Métal' },
];

describe('ChipSelectFilter component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders label text', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={jest.fn()}
			/>,
		);
		expect(screen.getByText('Catégorie')).toBeInTheDocument();
	});

	it('renders placeholder when no selection', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={jest.fn()}
				placeholder="Sélectionner une catégorie"
			/>,
		);
		expect(screen.getByPlaceholderText('Sélectionner une catégorie')).toBeInTheDocument();
	});

	it('renders default placeholder when none provided', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={jest.fn()}
			/>,
		);
		expect(screen.getByPlaceholderText('Filtrer par catégorie')).toBeInTheDocument();
	});

	it('renders selected options as chips', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={["1", "3"]}
				onChange={jest.fn()}
			/>,
		);
		expect(screen.getByText('Céramique')).toBeInTheDocument();
		expect(screen.getByText('Métal')).toBeInTheDocument();
		expect(screen.queryByText('Bois')).not.toBeInTheDocument();
	});

	it('shows options when input is focused and typed', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={jest.fn()}
			/>,
		);
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		fireEvent.change(input, { target: { value: 'Cér' } });
		expect(screen.getByText('Céramique')).toBeInTheDocument();
	});

	it('calls onChange when an option is selected', () => {
		const onChangeMock = jest.fn();
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={onChangeMock}
			/>,
		);
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		fireEvent.click(screen.getByText('Céramique'));
		expect(onChangeMock).toHaveBeenCalledWith(["1"]);
	});

	it('calls onChange when a chip is removed', () => {
		const onChangeMock = jest.fn();
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={["1", "2"]}
				onChange={onChangeMock}
			/>,
		);
		// Find the cancel icon on the first chip
		const cancelButtons = screen.getAllByTestId('CancelIcon');
		fireEvent.click(cancelButtons[0]);
		expect(onChangeMock).toHaveBeenCalledWith(["2"]);
	});

	it('renders with empty options', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={[]}
				selectedIds={[]}
				onChange={jest.fn()}
			/>,
		);
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		expect(screen.getByText('Aucune option')).toBeInTheDocument();
	});

	it('filters options based on input text', () => {
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={[]}
				onChange={jest.fn()}
			/>,
		);
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		fireEvent.change(input, { target: { value: 'Bois' } });
		expect(screen.getByText('Bois')).toBeInTheDocument();
	});

	it('handles multiple selections correctly', () => {
		const onChangeMock = jest.fn();
		renderWithTheme(
			<ChipSelectFilter
				label="Catégorie"
				options={options}
				selectedIds={["1"]}
				onChange={onChangeMock}
			/>,
		);
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		fireEvent.click(screen.getByText('Bois'));
		expect(onChangeMock).toHaveBeenCalledWith(["1", "2"]);
	});
});
