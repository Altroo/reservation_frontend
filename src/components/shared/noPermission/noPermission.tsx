import { Box, Paper, Typography } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const NoPermission = () => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '60vh',
				px: 2,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 6,
					maxWidth: 500,
					width: '100%',
					textAlign: 'center',
					borderRadius: 3,
					background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)',
				}}
			>
				{/* Icon container */}
				<Box
					sx={{
						display: 'inline-flex',
						p: 2,
						borderRadius: '50%',
						backgroundColor: 'error.lighter',
						mb: 2,
					}}
				>
					<LockIcon
						sx={{
							fontSize: 48,
							color: 'error.main',
						}}
					/>
				</Box>

				{/* Title */}
				<Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
					Accès Refusé
				</Typography>

				{/* Description */}
				<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
					Vous n&#39;avez pas la permission d&#39;accéder à cette page. Veuillez contacter un administrateur si vous
					pensez qu&#39;il s&#39;agit d&#39;une erreur.
				</Typography>
			</Paper>
		</Box>
	);
};

export default NoPermission;
