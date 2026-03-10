import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Protected } from './protected';

// 🧩 Mock hooks module
jest.mock('@/utils/hooks', () => ({
	usePermission: jest.fn(),
}));

import { usePermission } from '@/utils/hooks';

describe('Protected component', () => {
	it('renders children when is_staff is true', () => {
		(usePermission as jest.Mock).mockReturnValue({ is_staff: true });

		render(
			<Protected>
				<div>Secret Content</div>
			</Protected>,
		);

		expect(screen.getByText('Secret Content')).toBeInTheDocument();
		expect(screen.queryByText('Accès Refusé')).not.toBeInTheDocument();
	});

	it('renders access denied message when is_staff is false', () => {
		(usePermission as jest.Mock).mockReturnValue({ is_staff: false });

		render(
			<Protected>
				<div>Secret Content</div>
			</Protected>,
		);

		expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
		expect(screen.getByText(/Vous n'avez pas la permission d'accéder à cette page/i)).toBeInTheDocument();
		expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
	});
});
