import { ModelAliases } from '@glazed/types';
import { StreamID } from '@ceramicnetwork/streamid';
import { VC } from '@learncard/types';

/** @group IDXPlugin */
export type CeramicIDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
    ceramicEndpoint: string;
    defaultContentFamily: string;
};

/** @group IDXPlugin */
export type IDXPluginMethods = {
    getCredentialsListFromIdx: (alias?: string) => Promise<CredentialsList>;
    publishContentToCeramic: (cred: any) => Promise<string>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredentialFromIdx: (title: string) => Promise<VC>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
    addVerifiableCredentialInIdx: (cred: IDXCredential) => Promise<StreamID>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
};

/** @group IDXPlugin */
export type StorageType = 'ceramic';

/** @group IDXPlugin */
export type IDXCredential = {
    id: string;
    title: string;
    storageType?: StorageType;
};

/** @group IDXPlugin */
export type CredentialsList = {
    credentials: IDXCredential[];
};
