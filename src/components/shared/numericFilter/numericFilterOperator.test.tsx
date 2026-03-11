import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GridApiCommunity } from '@mui/x-data-grid/internals';
import { createNumericFilterOperators } from './numericFilterOperator';
import type { GridFilterItem, GridColDef } from '@mui/x-data-grid';

describe('createNumericFilterOperators', () => {
	const operators = createNumericFilterOperators();
	const mockColumn: GridColDef = { field: 'price', headerName: 'Prix' };
	const mockApiRef = { current: null } as unknown as React.RefObject<GridApiCommunity>;

	test('creates 6 numeric filter operators', () => {
		expect(operators).toHaveLength(6);
		expect(operators.map((op) => op.value)).toEqual([
			'numEquals',
			'numNotEquals',
			'numGreaterThan',
			'numGreaterThanOrEqual',
			'numLessThan',
			'numLessThanOrEqual',
		]);
	});

	test('all operators have correct labels', () => {
		expect(operators.map((op) => op.label)).toEqual(['=', '≠', '>', '>=', '<', '<=']);
	});

	test('all operators have getApplyFilterFn and InputComponent', () => {
		operators.forEach((op) => {
			expect(op.getApplyFilterFn).toBeDefined();
			expect(op.InputComponent).toBeDefined();
		});
	});

	describe('NumericFilterInput component', () => {
		test('renders text field with number type', () => {
			const operator = operators[0];
			const InputComponent = operator.InputComponent!;
			const item: GridFilterItem = { field: 'price', operator: 'numEquals', value: '' };
			const applyValue = jest.fn();

			render(<InputComponent item={item} applyValue={applyValue} apiRef={mockApiRef} />);

			const input = screen.getByPlaceholderText('Valeur');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('type', 'number');
		});

		test('displays current value', () => {
			const operator = operators[0];
			const InputComponent = operator.InputComponent!;
			const item: GridFilterItem = { field: 'price', operator: 'numEquals', value: '123' };
			const applyValue = jest.fn();

			render(<InputComponent item={item} applyValue={applyValue} apiRef={mockApiRef} />);

			const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
			expect(input.value).toBe('123');
		});

		test('calls applyValue when value changes', () => {
			const operator = operators[0];
			const InputComponent = operator.InputComponent!;
			const item: GridFilterItem = { field: 'price', operator: 'numEquals', value: '' };
			const applyValue = jest.fn();

			render(<InputComponent item={item} applyValue={applyValue} apiRef={mockApiRef} />);

			const input = screen.getByPlaceholderText('Valeur');
			fireEvent.change(input, { target: { value: '456' } });

			expect(applyValue).toHaveBeenCalledWith({ ...item, value: '456' });
		});

		test('handles empty value', () => {
			const operator = operators[0];
			const InputComponent = operator.InputComponent!;
			const item: GridFilterItem = { field: 'price', operator: 'numEquals', value: null };
			const applyValue = jest.fn();

			render(<InputComponent item={item} applyValue={applyValue} apiRef={mockApiRef} />);

			const input = screen.getByPlaceholderText('Valeur') as HTMLInputElement;
			expect(input.value).toBe('');
		});
	});

	describe('numEquals operator', () => {
		const operator = operators.find((op) => op.value === 'numEquals')!;

		test('returns null filter function when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns null filter function when value is null', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: null };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});

		test('returns filter function for zero', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: '0' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('numNotEquals operator', () => {
		const operator = operators.find((op) => op.value === 'numNotEquals')!;

		test('returns null when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numNotEquals', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numNotEquals', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('numGreaterThan operator', () => {
		const operator = operators.find((op) => op.value === 'numGreaterThan')!;

		test('returns null when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numGreaterThan', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numGreaterThan', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});

		test('handles decimal values', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numGreaterThan', value: '100.5' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('numGreaterThanOrEqual operator', () => {
		const operator = operators.find((op) => op.value === 'numGreaterThanOrEqual')!;

		test('returns null when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numGreaterThanOrEqual', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numGreaterThanOrEqual', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('numLessThan operator', () => {
		const operator = operators.find((op) => op.value === 'numLessThan')!;

		test('returns null when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numLessThan', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numLessThan', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});

		test('handles negative numbers', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numLessThan', value: '0' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('numLessThanOrEqual operator', () => {
		const operator = operators.find((op) => op.value === 'numLessThanOrEqual')!;

		test('returns null when value is empty', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numLessThanOrEqual', value: '' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});

		test('returns filter function for valid number', () => {
			const filterItem: GridFilterItem = { field: 'price', operator: 'numLessThanOrEqual', value: '100' };
			const filterFn = operator.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});
	});

	describe('edge cases', () => {
		test('handles very large numbers', () => {
			const gtOp = operators.find((op) => op.value === 'numGreaterThan')!;
			const filterItem: GridFilterItem = {
				field: 'price',
				operator: 'numGreaterThan',
				value: '999999999',
			};
			const filterFn = gtOp.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});

		test('handles string numbers correctly', () => {
			const equalsOp = operators.find((op) => op.value === 'numEquals')!;
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: '50' };
			const filterFn = equalsOp.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).not.toBeNull();
		});

		test('handles undefined value', () => {
			const equalsOp = operators.find((op) => op.value === 'numEquals')!;
			const filterItem: GridFilterItem = { field: 'price', operator: 'numEquals', value: undefined };
			const filterFn = equalsOp.getApplyFilterFn(filterItem, mockColumn);
			expect(filterFn).toBeNull();
		});
	});
});
