import { ReactNode } from 'react';
import { usePermission } from '@/utils/hooks';
import NoPermission from '@/components/shared/noPermission/noPermission';

interface ProtectedProps {
	children: ReactNode;
}

export const Protected = (props: ProtectedProps) => {
	const { is_staff } = usePermission();

	if (!is_staff) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
