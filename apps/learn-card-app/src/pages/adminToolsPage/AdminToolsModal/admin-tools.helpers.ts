export enum AdminToolOptionsEnum {
    API_TOKENS = 'API Tokens',
    SIGNING_AUTHORITY = 'Signing Authority',
    NETWORKS = 'Networks',
    STORAGE = 'Storage',
    BULK_UPLOAD = 'Bulk Upload',
    CONSENT_FLOW = 'Consent Flow',
    SYNC_ALL_CREDENTIALS = 'Sync All Credentials',
    CLI = 'CLI',
}

export type AdminToolOption = {
    id: number;
    label: string;
    title: string;
    description: string;
    actionLabel: string;
    type: AdminToolOptionsEnum;
};

// TODO: Bulk upload credentials + consent flow
export const adminToolOptions: AdminToolOption[] = [
    {
        id: 1,
        label: 'Import Credentials',
        title: 'Bulk Import Credentials',
        description: 'Upload multiple credentials at once.',
        actionLabel: 'Add Credentials',

        type: AdminToolOptionsEnum.BULK_UPLOAD,
    },
    {
        id: 2,
        label: 'Manage ConsentFlow Contracts',
        title: 'Manage ConsentFlow Contracts',
        description: 'Create and share consent contracts.',
        actionLabel: 'Create Contract',
        type: AdminToolOptionsEnum.CONSENT_FLOW,
    },
];

export const developerToolOptions: AdminToolOption[] = [
    {
        id: 1,
        label: 'API Tokens',
        title: 'API Tokens',
        description: 'Generate and manage API tokens.',
        actionLabel: 'Create API Token',

        type: AdminToolOptionsEnum.API_TOKENS,
    },
    {
        id: 2,
        label: 'Signing Authorities',
        title: 'Signing Authorities',
        description: 'Manage your credential signing infrastructure.',
        actionLabel: 'Create Signing Authority',
        type: AdminToolOptionsEnum.SIGNING_AUTHORITY,
    },
    {
        id: 3,
        label: 'Networks',
        title: 'Networks',
        description: 'Select your preferred network environment.',
        actionLabel: 'Manage',
        type: AdminToolOptionsEnum.NETWORKS,
    },
    {
        id: 4,
        label: 'Storage',
        title: 'Storage',
        description: 'Configure your data storage settings.',
        actionLabel: 'Manage',
        type: AdminToolOptionsEnum.STORAGE,
    },
    {
        id: 5,
        label: 'Sync All Credentials to Contracts',
        title: 'Sync All Credentials to Contracts',
        description:
            'Scan your wallet and sync all credentials to all consented contracts based on your sharing settings.',
        actionLabel: 'Sync Now',
        type: AdminToolOptionsEnum.SYNC_ALL_CREDENTIALS,
    },
    {
        id: 6,
        label: 'Developer CLI',
        title: 'LearnCard CLI',
        description: 'Interactive terminal for exploring and testing the LearnCard API.',
        actionLabel: 'Open CLI',
        type: AdminToolOptionsEnum.CLI,
    },
];
