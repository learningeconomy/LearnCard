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
    title: string;
    description: string;
    type: PushNotificationSettingsEnum;
};

export const pushNotificationSettingOptions: PushNotificationSettingOptions[] = [
    {
        id: 1,
        title: 'New Connection Requests',
        description:
            'When someone scans your code or clicks your user links it will initiate a network request that you can accept or deny.',
        type: PushNotificationSettingsEnum.connectionRequests,
    },
    {
        id: 2,
        title: 'New Boosts',
        description:
            'Boosts include all types of credentials including:  Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges.',
        type: PushNotificationSettingsEnum.newBoosts,
    },
];
