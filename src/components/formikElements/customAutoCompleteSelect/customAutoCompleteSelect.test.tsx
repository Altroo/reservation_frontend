import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTheme } from '@mui/material/styles';
import CustomAutoCompleteSelect from './customAutoCompleteSelect';
import type { DropDownType } from '@/types/accountTypes';

const theme = createTheme();

const items: DropDownType[] = [
	{ value: '1', code: 'Alice' },
	{ value: '2', code: 'Bob' },
];

describe('CustomAutocompleteSelect', () => {
	it('renders label and initial value', () => {
		render(
			<CustomAutoCompleteSelect
				id="test"
				label="User"
				noOptionsText="Aucun utilisateur trouvé"
				items={items}
				theme={theme}
				value={items[0]}
				onChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText('User')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
	});

	it('shows options when opened and calls onChange on selection', () => {
		const handleChange = jest.fn();
		render(
			<CustomAutoCompleteSelect
				id="test"
				label="User"
				noOptionsText="Aucun utilisateur trouvé"
				items={items}
				theme={theme}
				value={null}
				onChange={handleChange}
			/>,
		);

		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input); // open the dropdown

		const option = screen.getByText('Bob');
		fireEvent.click(option);

		expect(handleChange).toHaveBeenCalledTimes(1);
		// MUI passes (event, newValue) to onChange
		const [, newValue] = handleChange.mock.calls[0];
		expect(newValue).toEqual(items[1]);
	});

	it('renders start and end icons when provided', () => {
		const StartIcon = () => <span data-testid="start-icon">S</span>;
		const EndIcon = () => <span data-testid="end-icon">E</span>;

		render(
			<CustomAutoCompleteSelect
				id="test"
				label="User"
				noOptionsText="Aucun utilisateur trouvé"
				items={items}
				theme={theme}
				value={null}
				startIcon={<StartIcon />}
				endIcon={<EndIcon />}
				onChange={() => {}}
			/>,
		);

		expect(screen.getByTestId('start-icon')).toBeInTheDocument();
		expect(screen.getByTestId('end-icon')).toBeInTheDocument();
	});

	it('disables interaction when disabled prop is true', () => {
		const handleChange = jest.fn();
		render(
			<CustomAutoCompleteSelect
				id="test"
				label="User"
				noOptionsText="Aucun utilisateur trouvé"
				items={items}
				theme={theme}
				value={null}
				disabled
				onChange={handleChange}
			/>,
		);

		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		// dropdown should not open
		expect(screen.queryByText('Alice')).not.toBeInTheDocument();
		expect(handleChange).not.toHaveBeenCalled();
	});
	it('renders noOptionsText when there are no items', () => {
		render(
			<CustomAutoCompleteSelect
				id="test"
				label="User"
				noOptionsText="Aucun utilisateur trouvé"
				items={[]} // empty list
				theme={theme}
				value={null}
				onChange={() => {}}
			/>,
		);
		// open the dropdown
		const input = screen.getByRole('combobox');
		fireEvent.mouseDown(input);
		// expect the noOptionsText to be shown
		expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
	});
});
