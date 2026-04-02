'use client';

import React from 'react';
import { useLanguage } from '@/utils/hooks';

const SkipToContent: React.FC = () => {
	const { t } = useLanguage();

	return (
		<a href="#main-content" className="skip-to-content">
			{t.common.skipToContent}
		</a>
	);
};

export default SkipToContent;
