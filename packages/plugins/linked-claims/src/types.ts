import { Plugin } from '@learncard/core';
import { VC, VerificationCheck } from '@learncard/types';
import { VCPluginMethods } from '@learncard/vc-plugin';
import { ProofOptions } from '@learncard/didkit-plugin';

export type EndorsementEvidence = {
    id?: string;
    type: string | [string, ...string[]]; // Changed from string[] to match VC2Evidence
    name?: string;
    narrative?: string;
    description?: string;
    genre?: string;
    audience?: string;
    [key: string]: any; // Allow additional properties
};

export type EndorsementDetails = {
    // OBv3 Endorsement fields
    endorsementComment?: string;
    name?: string;
    description?: string;
    evidence?: EndorsementEvidence;
};

export type EndorsementRelationship = {
    type: string;
    label: string;
};

export type EndorsementVisibility = 'public' | 'private';

export type StoreIndexOptions = {
    storeName?: string;
    indexName?: string;
    credentialId?: string;
    sharedUri?: string;
    relationship?: EndorsementRelationship;
    visibility?: EndorsementVisibility;
};

export type LinkedClaimsPluginDependentMethods = VCPluginMethods;

export type LinkedClaimsPluginMethods = {
    endorseCredential: (
        original: VC,
        details: EndorsementDetails,
        options?: { contextUrl?: string }
    ) => Promise<VC>;

    verifyEndorsement: (
        endorsement: VC,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;

    storeEndorsement: (
        endorsement: VC,
        options?: StoreIndexOptions
    ) => Promise<{
        uri: string;
        indexed: boolean;
        id: string;
        indexName?: string;
        storeName?: string;
    }>;

    getEndorsements: (original: VC, options?: { indexName?: string }) => Promise<VC[]>;
};

export type LinkedClaimsPlugin = Plugin<
    'LinkedClaims',
    any,
    LinkedClaimsPluginMethods,
    'id' | 'store' | 'index' | 'read',
    LinkedClaimsPluginDependentMethods
>;
