export type WSEventType = 'USER_AVATAR' | 'MAINTENANCE';

export type WSEvent<T> = {
	message: T;
};

interface WSRootType {
	type: WSEventType;
}

/*
"message": {
	"pk": object_.pk,
	"avatar": object_.get_absolute_avatar_thumbnail,
}
 */
// USER_AVATAR
export interface WSUserAvatar extends WSRootType {
	pk: number;
	avatar: string;
}

// MAINTENANCE
export interface WSMaintenance extends WSRootType {
	maintenance: boolean;
}

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
}
