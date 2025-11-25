export type RegistryEntry = {
    id: string;
    url: string;
    did: string;
    image: string;
    membershipId?: string;
};

export type CredRefInfo = {
    id: string;
    name: string;
};

export type JobRegistryEntry = {
    id: number | string;
    imgUrl?: string;
    title?: string;
    employer?: string;
    employerWebsite?: string;
    jobPostingUrl?: string;
    location?: string;
    description?: string;
    locationRequirement?: string;
    jobAgreementType?: string;
    jobSchedule?: string;
    experienceLevel?: string;
    citizenshipRequired?: Boolean;
    baseSalary?: string;
    workHours?: string;
    coursesRequired: CredRefInfo[] | [];
    microCredentialsRequired: CredRefInfo[] | [];
    skillsRequired: CredRefInfo[] | [];
};

export type TrustedAppRegistryEntry = {
    id: string;
    url: string;
    did: string;
    profileId: string;
    organization: { name: string; address: string };
    app: {
        name: string;
        description: string;
        icon: string;
        connectUrl: string;
        redirectUrl: string;
        allowSendingAdditionalVPs: boolean;
        publicizeOnLaunchPad: boolean;
        isTrusted: boolean;
        contractUri?: string;
    };
};

export type LCAStylesPackRegistryEntry = {
    category: string;
    type: string;
    url: string;
};
