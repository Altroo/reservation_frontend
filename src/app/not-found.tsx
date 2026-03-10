'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { SentimentDissatisfied as SadIcon, Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DASHBOARD } from '@/utils/routes';

const NotFound = () => {
	const router = useRouter();

	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
			<Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
				<SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
				<Typography variant="h4" gutterBottom fontWeight={700}>
					404
				</Typography>
				<Typography variant="h6" gutterBottom>
					Page introuvable
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
					La page que vous cherchez n&apos;existe pas ou a été déplacée.
				</Typography>
				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
					<Button variant="contained" startIcon={<HomeIcon />} onClick={() => router.push(DASHBOARD)}>
						Tableau de bord
					</Button>
					<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
						Retour
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default NotFound;
