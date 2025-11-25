export type NetworkSettingsState = {
    sendRequests: boolean;
    receiveRequests: boolean;
    showDisplayName: boolean;
    showProfilePicture: boolean;
};

export enum NetworkSettingsEnum {
    sendRequests = 'sendRequests',
    receiveRequests = 'receiveRequests',
    showDisplayName = 'showDisplayName',
    showProfilePicture = 'showProfilePicture',
}

export type NetworkSettingOptions = {
    id: number;
    title: string;
    description: string;
    type: NetworkSettingsEnum;
}

export const networkSettingOptions: NetworkSettingOptions[] = [
    {
        id: 1,
        title: 'Send Connection Requests.',
        description:
            'ScoutPass acts as a gateway that sends encrypted connection requests on your behalf.',
        type: NetworkSettingsEnum.sendRequests,
    },
    {
        id: 2,
        title: 'Receive connection requests.',
        description:
            'ScoutPass acts as a gateway that receives encrypted connection requests on your behalf.',
        type: NetworkSettingsEnum.receiveRequests,
    },
    {
        id: 3,
        title: 'Display name in your connections’ contact lists.',
        description:
            'Your name will appear in  your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission.',
        type: NetworkSettingsEnum.showDisplayName,
    },
    {
        id: 4,
        title: 'Display profile photo in your connections’ contact lists.',
        description:
            'Your profile photo will appear in  your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission.',
        type: NetworkSettingsEnum.showProfilePicture,
    },
];