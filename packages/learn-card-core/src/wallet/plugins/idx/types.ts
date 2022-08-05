import { StreamID } from '@ceramicnetwork/streamid';

export type IDXPluginMethods = {
    getCredentialsListFromIndex: (alias?: string) => Promise<CredentialsList>;
    publishContentToCeramic: (cred: any) => Promise<string>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredentialFromIndex: (title: string) => Promise<any>;
    getVerifiableCredentialsFromIndex: () => Promise<any>;
    addVerifiableCredentialInIdx: (cred: IDXCredential) => Promise<StreamID>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
};

export enum StorageType {
    ceramic = 'ceramic',
}

export type IDXCredential = {
    id: string;
    title: string;
    storageType?: StorageType;
};

export type CredentialsList = {
    credentials: IDXCredential[];
};
