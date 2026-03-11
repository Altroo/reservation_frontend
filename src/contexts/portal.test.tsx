import React from 'react';
import { render, screen } from '@testing-library/react';
import Portal from './portal';

// Mock useIsClient to always return true in tests
jest.mock('@/utils/hooks', () => ({
	useIsClient: jest.fn(() => true),
}));

describe('Portal', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('renders children into an existing container', () => {
		const existing = document.createElement('div');
		existing.id = 'portal-root';
		document.body.appendChild(existing);

		render(
			<Portal id="portal-root">
				<div data-testid="child">Child</div>
			</Portal>,
		);

		expect(screen.getByTestId('child')).toBeInTheDocument();
		expect(existing).toContainElement(screen.getByTestId('child'));
	});

	it('creates a new container if none exists', () => {
		// Pre-create the container manually
		const created = document.createElement('div');
		created.id = 'new-portal';
		document.body.appendChild(created);

		render(
			<Portal id="new-portal">
				<div data-testid="child">Child</div>
			</Portal>,
		);

		expect(created).toContainElement(screen.getByTestId('child'));
	});

	it('applies default styles to the created container', () => {
		render(
			<Portal id="styled-portal">
				<div data-testid="child">Child</div>
			</Portal>,
		);

		const created = document.getElementById('styled-portal')!;
		expect(created.style.position).toBe('fixed');
		expect(created.style.bottom).toBe('20px');
		expect(created.style.left).toBe('20px');
		expect(created.style.zIndex).toBe('9999');
		expect(created.style.display).toBe('flex');
		expect(created.style.flexDirection).toBe('column');
		expect(created.style.alignItems).toBe('flex-start');
	});
});
