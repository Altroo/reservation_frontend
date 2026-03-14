import { ReactNode } from 'react';
import { usePermission } from '@/utils/hooks';
import NoPermission from '@/components/shared/noPermission/noPermission';

type PermissionKey = 'is_staff' | 'can_view' | 'can_create' | 'can_edit' | 'can_delete';

interface ProtectedProps {
	children: ReactNode;
	permission?: PermissionKey;
}

export const Protected = (props: ProtectedProps) => {
	const permissions = usePermission();
	const required = props.permission ?? 'is_staff';

	if (!permissions[required]) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
