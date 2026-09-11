import * as m from '../../paraglide/messages.js';

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
};

export const getNetworkSettingOptions = (): NetworkSettingOptions[] => [
    {
        id: 1,
        title: m['networkPrompts.settings.sendReq'](),
        description: m['networkPrompts.settings.sendReqDesc'](),
        type: NetworkSettingsEnum.sendRequests,
    },
    {
        id: 2,
        title: m['networkPrompts.settings.recvReq'](),
        description: m['networkPrompts.settings.recvReqDesc'](),
        type: NetworkSettingsEnum.receiveRequests,
    },
    {
        id: 3,
        title: m['networkPrompts.settings.showName'](),
        description: m['networkPrompts.settings.nameDesc'](),
        type: NetworkSettingsEnum.showDisplayName,
    },
    {
        id: 4,
        title: m['networkPrompts.settings.showPhoto'](),
        description: m['networkPrompts.settings.photoDesc'](),
        type: NetworkSettingsEnum.showProfilePicture,
    },
];
