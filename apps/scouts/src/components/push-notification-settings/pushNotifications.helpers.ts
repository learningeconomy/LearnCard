export type PushNotificationsSettingsState = {
    connectionRequests: boolean;
    newBoosts: boolean;
};

export enum PushNotificationSettingsEnum {
    connectionRequests = 'connectionRequests',
    newBoosts = 'newBoosts',
}

export type PushNotificationSettingOptions = {
    id: number;
    type: PushNotificationSettingsEnum;
};

export const pushNotificationSettingOptions: PushNotificationSettingOptions[] = [
    {
        id: 1,
        type: PushNotificationSettingsEnum.connectionRequests,
    },
    {
        id: 2,
        type: PushNotificationSettingsEnum.newBoosts,
    },
];
