import { WSMaintenanceAction, WSUserAvatarAction, WSNotificationAction } from '@/store/actions/wsActions';

/*
"message": {
	"pk": object_.pk,
	"avatar": object_.get_absolute_avatar_thumbnail,
}
 */

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
}

export type WSAction = ReturnType<typeof WSUserAvatarAction> | ReturnType<typeof WSMaintenanceAction> | ReturnType<typeof WSNotificationAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
	id?: number;
	reservation_id?: number | null;
	title?: string;
	message?: string;
	notification_type?: string;
	is_read?: boolean;
	date_created?: string;
};

export type WSEnvelope = {
	message: WSMessage;
};
