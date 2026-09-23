'use client';

import { type FC } from 'react';
import { useLanguage } from '@/utils/hooks';

const SkipToContent: FC = () => {
	const { t } = useLanguage();

	return (
		<a href="#main-content" className="skip-to-content">
			{t.common.skipToContent}
		</a>
	);
};

export default SkipToContent;
