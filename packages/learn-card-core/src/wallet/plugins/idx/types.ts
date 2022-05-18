import { StreamID } from '@ceramicnetwork/streamid';

export type IDXPluginMethods = {
    getCredentialsListFromIndex: (alias?: string) => Promise<CredentialsList>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredential: (title: string) => Promise<any>;
    getVerifiableCredentials: (title: string) => Promise<any>;
    persistVerifiableCredential: (cred: CredentialStreamId) => Promise<StreamID>;
    publishVerifiableCredential: (cred: any) => Promise<string>;
};

export type CredentialStreamId = {
    id: string;
    title: string;
};

export type CredentialsList = {
    credentials: CredentialStreamId[];
};
