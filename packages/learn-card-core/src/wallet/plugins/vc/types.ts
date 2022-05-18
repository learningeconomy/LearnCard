export type IssueCredential = {
    credential: any;
    options: any;
};

export type VerifyCredential = {
    credential: any;
    options: any;
};

export type PresentCredentials = {
    verifiableCredential: any;
    options: any;
};

export type VerifyPresentation = {
    presentation: any;
    options: any;
};

export type VCPluginMethods = {
    issue: (config: IssueCredential) => Promise<any>;
    issueUsingWalletSuite: (config: IssueCredential) => Promise<any>;
    verifyCredential: (config: VerifyCredential) => Promise<any>;
    createVerifiablePresentation: (config: PresentCredentials) => Promise<any>;
    verifyPresentation: (config: VerifyPresentation) => Promise<any>;
};
