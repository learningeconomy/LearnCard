import type { Filter } from '@learncard/learn-cloud-service';
import type {
    JWE,
    JWKWithPrivateKey,
    UnsignedVC,
    VC,
    VP,
    PaginationResponseType,
    PaginationOptionsType,
} from '@learncard/types';
import type { LearnCard, Plugin } from '@learncard/core';
import type { ProofOptions } from '@learncard/didkit-plugin';

/** @group LearnCloud Plugin */
export type LearnCloudPluginDependentMethods = {
    createDagJwe: <T>(cleartext: T, recipients?: string[]) => Promise<JWE>;
    decryptDagJwe: <T>(jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<T>;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    crypto: () => Crypto;
    hash?: (message: string, algorithm?: string) => Promise<string | undefined>;
};

/** @group LearnCloud Plugin */
export type LearnCloudPluginMethods = {
    learnCloudCreate: <Document extends Record<string, any>>(
        document: Document
    ) => Promise<boolean>;
    learnCloudCreateMany: <Document extends Record<string, any>>(
        documents: Document[]
    ) => Promise<boolean>;
    learnCloudRead: <Document extends Record<string, any>>(
        query: Filter<Document>,
        includeAssociatedDids?: boolean
    ) => Promise<Document[]>;
    learnCloudReadPage: <Document extends Record<string, any>>(
        query: Filter<Document>,
        paginationOptions?: Partial<PaginationOptionsType>,
        includeAssociatedDids?: boolean
    ) => Promise<PaginationResponseType & { records: Document[] }>;
    learnCloudCount: <Document extends Record<string, any>>(
        query: Filter<Document>,
        includeAssociatedDids?: boolean
    ) => Promise<number>;
    learnCloudUpdate: <Document extends Record<string, any>>(
        query: Filter<Document>,
        update: Partial<Document>
    ) => Promise<number>;
    learnCloudDelete: <Document extends Record<string, any>>(
        query: Filter<Document>,
        includeAssociatedDids?: boolean
    ) => Promise<number | false>;
    learnCloudBatchResolve: (uris: string[]) => Promise<(VC | VP | null)[]>;
};

/** @group LearnCloud Plugin */
export type LearnCloudPlugin = Plugin<
    'LearnCloud',
    'index' | 'read' | 'store',
    LearnCloudPluginMethods,
    'id',
    LearnCloudPluginDependentMethods
>;

/** @group LearnCloud Plugin */
export type LearnCloudDependentLearnCard = LearnCard<any, 'id', LearnCloudPluginDependentMethods>;
