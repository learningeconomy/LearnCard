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
    getCredentialsListFromIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        alias?: string
    ) => Promise<CredentialsList<Metadata>>;
    publishContentToCeramic: (cred: any) => Promise<string>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredentialFromIdx: (title: string) => Promise<VC>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
    addVerifiableCredentialInIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        cred: IDXCredential<Metadata>
    ) => Promise<StreamID>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
};

/** @group IDXPlugin */
export type CredentialsList<Metadata extends Record<string, any> = Record<never, never>> = {
    credentials: Array<IDXCredential<Metadata>>;
};

/** @group IDXPlugin */
export const CredentialsListValidator: z.ZodType<CredentialsList> = z
    .object({ credentials: IDXCredentialValidator.array() })
    .strict();
