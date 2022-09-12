import { StreamID } from '@ceramicnetwork/streamid';
import { VC } from '@learncard/types';
import { Plugin } from 'types/wallet';
import { StoragePlugin, CachingPlugin } from 'types/planes';

export type IDXPluginMethods = {
    getCredentialsListFromIdx: (alias?: string) => Promise<CredentialsList>;
    publishContentToCeramic: (cred: any) => Promise<string>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredentialFromIdx: (title: string) => Promise<VC>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
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

export type IDXPlugin = CachingPlugin<StoragePlugin<Plugin<'IDX', IDXPluginMethods>>>;
