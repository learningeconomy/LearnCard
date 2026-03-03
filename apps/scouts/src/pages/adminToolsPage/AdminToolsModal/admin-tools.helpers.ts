export enum AdminToolOptionsEnum {
    API_TOKENS = 'API Tokens',
    SIGNING_AUTHORITY = 'Signing Authority',
    NETWORKS = 'Networks',
    STORAGE = 'Storage',
    BULK_UPLOAD = 'Bulk Upload',
    CONSENT_FLOW = 'Consent Flow',
    SKILL_FRAMEWORKS = 'Skill Frameworks',
    IMPORT_SKILL_FRAMEWORKS = 'Import Skill Frameworks',
}

export type AdminToolOption = {
    id: number;
    label: string;
    title: string;
    description: string;
    actionLabel: string;
    type: AdminToolOptionsEnum;
    footerTextOverride?: string;
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
    // {
    //     id: 2,
    //     label: 'Manage ConsentFlow Contracts',
    //     title: 'Manage ConsentFlow Contracts',
    //     description: 'Create and share consent contracts.',
    //     actionLabel: 'Create Contract',
    //     type: AdminToolOptionsEnum.CONSENT_FLOW,
    // },
    {
        id: 3,
        label: 'Manage Skill Frameworks',
        title: 'Manage Skill Frameworks',
        description: 'Manage and import skill frameworks.',
        actionLabel: 'Manage',
        type: AdminToolOptionsEnum.SKILL_FRAMEWORKS,
        footerTextOverride: 'Back',
    },
];

export const developerToolOptions: AdminToolOption[] = [
    // {
    //     id: 1,
    //     label: 'API Tokens',
    //     title: 'API Tokens',
    //     description: 'Generate and manage API tokens.',
    //     actionLabel: 'Create API Token',
    //     type: AdminToolOptionsEnum.API_TOKENS,
    // },
    // {
    //     id: 2,
    //     label: 'Signing Authorities',
    //     title: 'Signing Authorities',
    //     description: 'Manage your credential signing infrastructure.',
    //     actionLabel: 'Create Signing Authority',
    //     type: AdminToolOptionsEnum.SIGNING_AUTHORITY,
    // },
    // {
    //     id: 3,
    //     label: 'Networks',
    //     title: 'Networks',
    //     description: 'Select your preferred network environment.',
    //     actionLabel: 'Manage',
    //     type: AdminToolOptionsEnum.NETWORKS,
    // },
    // {
    //     id: 4,
    //     label: 'Storage',
    //     title: 'Storage',
    //     description: 'Configure your data storage settings.',
    //     actionLabel: 'Manage',
    //     type: AdminToolOptionsEnum.STORAGE,
    // },
];
