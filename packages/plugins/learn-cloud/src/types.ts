import type { DID } from 'dids';
import type { MongoCustomDocumentType, Filter, UpdateFilter } from '@learncard/learn-cloud-service';
import { UnsignedVC, VC, VP } from '@learncard/types';
import type { LearnCard, Plugin } from '@learncard/core';
import type { ProofOptions } from '@learncard/didkit-plugin';

/** @group LearnCloud Plugin */
export type LearnCloudPluginDependentMethods = {
    getDIDObject: () => DID;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    crypto: () => Crypto;
};

/** @group LearnCloud Plugin */
export type LearnCloudPluginMethods = {
    learnCloudCreate: (document: MongoCustomDocumentType) => Promise<boolean>;
    learnCloudCreateMany: (documents: MongoCustomDocumentType[]) => Promise<boolean>;
    learnCloudRead: (
        query: Filter<MongoCustomDocumentType>,
        includeAssociatedDids?: boolean
    ) => Promise<MongoCustomDocumentType[]>;
    learnCloudCount: (
        query: Filter<MongoCustomDocumentType>,
        includeAssociatedDids?: boolean
    ) => Promise<number>;
    learnCloudUpdate: (
        query: Filter<MongoCustomDocumentType>,
        update: UpdateFilter<MongoCustomDocumentType>,
        includeAssociatedDids?: boolean
    ) => Promise<number>;
    learnCloudDelete: (
        query: Filter<MongoCustomDocumentType>,
        includeAssociatedDids?: boolean
    ) => Promise<number | false>;
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
