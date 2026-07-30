import { z } from 'zod';
import {
    UnsignedVCValidator,
    UnsignedVPValidator,
    VCValidator,
    VPValidator,
} from '@learncard/types';

const ProofOptionsValidator = z
    .object({
        type: z.string().optional(),
        verificationMethod: z.string().optional(),
        proofPurpose: z.string().optional(),
        proofFormat: z.string().optional(),
        created: z.string().optional(),
        challenge: z.string().optional(),
        domain: z.string().optional(),
        checks: z.enum(['proof', 'JWS', 'credentialStatus', 'credentialSchema']).array().optional(),
        cryptosuite: z
            .enum([
                'eddsa-rdfc-2022',
                'eddsa-2022',
                'json-eddsa-2022',
                'ecdsa-2019',
                'jcs-ecdsa-2019',
            ])
            .optional(),
    })
    .passthrough();

export const IssueEndpointValidator = z.object({
    credential: UnsignedVCValidator,
    options: ProofOptionsValidator.extend({
        credentialStatus: z.object({ type: z.string() }).optional(),
    }).optional(),
});
export type IssueEndpoint = z.infer<typeof IssueEndpointValidator>;

export const IssuePresentationEndpointValidator = z.object({
    presentation: UnsignedVPValidator,
    options: ProofOptionsValidator.optional(),
});
export type IssuePresentationEndpoint = z.infer<typeof IssuePresentationEndpointValidator>;

export const UpdateStatusEndpointValidator = z.object({
    credentialId: z.string(),
    credentialStatus: z
        .object({ type: z.string().optional(), status: z.string().optional() })
        .array()
        .optional(),
});
export type UpdateStatusEndpoint = z.infer<typeof UpdateStatusEndpointValidator>;

export const VerifyCredentialEndpointValidator = z.object({
    verifiableCredential: VCValidator,
    options: ProofOptionsValidator.optional(),
});
export type VerifyCredentialEndpoint = z.infer<typeof VerifyCredentialEndpointValidator>;

export const VerifyPresentationEndpointValidator = z
    .object({
        verifiablePresentation: VPValidator,
        options: ProofOptionsValidator.optional(),
    })
    .or(z.object({ presentation: UnsignedVPValidator }));
export type VerifyPresentationEndpoint = z.infer<typeof VerifyPresentationEndpointValidator>;
