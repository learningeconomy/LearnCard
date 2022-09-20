import { ModelAliases } from '@glazed/types';
import { z } from 'zod';
import { StreamID } from '@ceramicnetwork/streamid';
import { VC, IDXCredential, IDXCredentialValidator } from '@learncard/types';

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
export const CredentialsListValidator = z
    .object({ credentials: IDXCredentialValidator.array() })
    .strict();
/** @group IDXPlugin */
export type CredentialsList = z.infer<typeof CredentialsListValidator>;
