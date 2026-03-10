import React from 'react';
import Styles from './squareImageInputFile.module.sass';
import { Button, Stack, ThemeProvider } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getDefaultTheme } from '@/utils/themes';

const defaultTheme = getDefaultTheme();

type Props = {
	onImageUpload: () => void;
	children?: React.ReactNode;
};

const SquareImageInputFile: React.FC<Props> = ({ onImageUpload }) => {
	return (
		<ThemeProvider theme={defaultTheme}>
			<Button className={Styles.squareImageWrapper} color="primary" onClick={onImageUpload}>
				<Stack direction="column" justifyContent="center" alignItems="center" spacing={1}>
					<AddIcon className={Styles.addIcon} sx={{ fontSize: 31.5 }} color="primary" />
					<span className={Styles.addImagesSpan}>Ajouter une image</span>
				</Stack>
			</Button>
		</ThemeProvider>
	);
};

export default SquareImageInputFile;
