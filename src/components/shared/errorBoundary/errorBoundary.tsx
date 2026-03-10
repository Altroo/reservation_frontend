'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child
 * component tree and display a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to monitoring service in production
		if (process.env.NODE_ENV === 'production') {
			// Could integrate with Sentry, LogRocket, etc.
			// For now, just suppress the error in production
		} else {
			// In development, log to console for debugging
			console.error('ErrorBoundary caught an error:', error, errorInfo);
		}
	}

	handleReset = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', p: 3 }}>
					<Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
						<ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
						<Typography variant="h5" gutterBottom>
							Une erreur est survenue
						</Typography>
						<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
							Nous nous excusons pour ce désagrément. Veuillez réessayer ou actualiser la page.
						</Typography>
						{process.env.NODE_ENV !== 'production' && this.state.error && (
							<Typography
								variant="caption"
								component="pre"
								sx={{ textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto', maxHeight: 150, mb: 2 }}
							>
								{this.state.error.message}
							</Typography>
						)}
						<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
							<Button variant="contained" onClick={this.handleReset}>Réessayer</Button>
							<Button variant="outlined" onClick={() => window.location.reload()}>Actualiser la page</Button>
						</Box>
					</Paper>
				</Box>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
