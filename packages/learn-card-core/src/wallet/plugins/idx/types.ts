import { z } from 'zod';
import { StreamID } from '@ceramicnetwork/streamid';
import { VC } from '@learncard/types';

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
export const StorageTypeValidator = z.nativeEnum(StorageType);

export const CredentialMetadataValidator = z
    .object({
        name: z.string().optional(),
        image: z.string().optional(),
    })
    .catchall(z.any());
export type CredentialMetadata = z.infer<typeof CredentialMetadataValidator>;

export const IDXCredentialValidator = z
    .object({
        id: z.string(),
        title: z.string(),
        storageType: StorageTypeValidator.optional(),
        metadata: CredentialMetadataValidator.optional(),
    })
    .catchall(z.any());
export type IDXCredential = z.infer<typeof IDXCredentialValidator>;

export const CredentialsListValidator = z.object({
    credentials: IDXCredentialValidator.array(),
});
export type CredentialsList = z.infer<typeof CredentialsListValidator>;
