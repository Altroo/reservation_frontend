import React from 'react';
import { Select, MenuItem, Chip, SelectChangeEvent } from '@mui/material';
import { GridFilterInputValueProps, GridFilterItem, GridFilterOperator } from '@mui/x-data-grid';

export interface DropdownFilterOption {
	value: string;
	label: string;
	color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

interface DropdownFilterProps extends GridFilterInputValueProps {
	options: DropdownFilterOption[];
	placeholder?: string;
	showChips?: boolean;
}

const DropdownFilter: React.FC<DropdownFilterProps> = (props) => {
	const { item, applyValue, options, placeholder = 'Tous', showChips = false } = props;

	const handleFilterChange = (event: SelectChangeEvent) => {
		applyValue({ ...item, value: event.target.value });
	};

	return (
		<Select value={item.value || ''} onChange={handleFilterChange} displayEmpty size="small">
			<MenuItem value="">
				<em>{placeholder}</em>
			</MenuItem>
			{options.map((option) => (
				<MenuItem key={option.value} value={option.value}>
					{showChips && option.color ? (
						<Chip label={option.label} color={option.color} variant="outlined" size="small" />
					) : (
						option.label
					)}
				</MenuItem>
			))}
		</Select>
	);
};

export const createDropdownFilterOperators = <T extends Record<string, unknown>>(
	options: DropdownFilterOption[],
	placeholder?: string,
	showChips?: boolean,
): GridFilterOperator<T, string, string>[] => [
	{
		label: 'est',
		value: 'is',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			if (!filterItem.value) {
				return null;
			}
			return (value: string | null | undefined): boolean => {
				return value === filterItem.value;
			};
		},
		InputComponent: (props: GridFilterInputValueProps) => (
			<DropdownFilter {...props} options={options} placeholder={placeholder} showChips={showChips} />
		),
	},
];

export const createBooleanFilterOperators = <T extends Record<string, unknown>>(
	options: DropdownFilterOption[],
	placeholder?: string,
): GridFilterOperator<T, boolean, string>[] => [
	{
		label: 'est',
		value: 'is',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			if (!filterItem.value) {
				return null;
			}
			// Convert string 'true'/'false' back to boolean for comparison
			const boolValue = filterItem.value === 'true';
			return (value: boolean | null | undefined): boolean => {
				return Boolean(value) === boolValue;
			};
		},
		InputComponent: (props: GridFilterInputValueProps) => (
			<DropdownFilter {...props} options={options} placeholder={placeholder} showChips={false} />
		),
	},
];

export default DropdownFilter;
