import { z } from 'zod';
import {
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    VerificationItemValidator,
    VerificationCheckValidator,
    UnsignedVPValidator,
    IDXCredentialValidator,
} from '@learncard/types';

import { getRpcMethod, GetRPCMethodType, getAPIEndpoint, GetAPIEndpointType } from './helpers';

// Endpoint Methods

export const Did = getRpcMethod('did', { didMethod: z.string().optional() }, z.string(), {
    skipSerializationKeys: ['didMethod'],
    serializeReturnValue: false,
});
export type DidTypes = GetRPCMethodType<typeof Did>;

export const IssueCredential = getRpcMethod(
    'issueCredential',
    { credential: UnsignedVCValidator },
    VCValidator
);
export type IssueCredentialTypes = GetRPCMethodType<typeof IssueCredential>;

export const IssuePresentation = getRpcMethod(
    'issuePresentation',
    { presentation: UnsignedVPValidator },
    VPValidator
);
export type IssuePresentationTypes = GetRPCMethodType<typeof IssuePresentation>;

export const TestVC = getRpcMethod('getTestVc', {}, UnsignedVCValidator);
export type TestVCTypes = GetRPCMethodType<typeof TestVC>;

export const VerifyCredential = getRpcMethod(
    'verifyCredential',
    { credential: VCValidator },
    VerificationItemValidator.array()
);
export type VerifyCredentialTypes = GetRPCMethodType<typeof VerifyCredential>;

export const VerifyPresentation = getRpcMethod(
    'verifyPresentation',
    { presentation: VPValidator },
    VerificationCheckValidator
);
export type VerifyPresentationTypes = GetRPCMethodType<typeof VerifyPresentation>;

export const GetCredential = getRpcMethod(
    'getCredential',
    { title: z.string() },
    VCValidator.nullable(),
    { skipSerializationKeys: ['title'] }
);
export type GetCredentialTypes = GetRPCMethodType<typeof GetCredential>;

export const GetCredentials = getRpcMethod('getCredentials', {}, VCValidator.array());
export type GetCredentialsTypes = GetRPCMethodType<typeof GetCredentials>;

export const GetCredentialsList = getRpcMethod(
    'getCredentialsList',
    {},
    IDXCredentialValidator.array()
);
export type GetCredentialsListTypes = GetRPCMethodType<typeof GetCredentialsList>;

export const PublishCredential = getRpcMethod(
    'publishCredential',
    { credential: VCValidator },
    z.string(),
    { serializeReturnValue: false }
);
export type PublishCredentialTypes = GetRPCMethodType<typeof PublishCredential>;

export const AddCredential = getRpcMethod(
    'addCredential',
    { id: z.string(), title: z.string() },
    z.null(),
    { skipSerializationKeys: ['title', 'id'], serializeReturnValue: false }
);
export type AddCredentialTypes = GetRPCMethodType<typeof AddCredential>;

// API Endpoints

export const CredentialRPCAPI = getAPIEndpoint({ Did, IssueCredential, IssuePresentation });
export type CredentialRPCAPITypes = GetAPIEndpointType<typeof CredentialRPCAPI>;

export const LearnCardRPCAPI = getAPIEndpoint({
    Did,
    TestVC,
    IssueCredential,
    VerifyCredential,
    IssuePresentation,
    VerifyPresentation,
    GetCredential,
    GetCredentials,
    GetCredentialsList,
    PublishCredential,
    AddCredential,
});
export type LearnCardRPCAPITypes = GetAPIEndpointType<typeof LearnCardRPCAPI>;
