import { z } from 'zod';
import {
    UnsignedVCValidator,
    UnsignedVPValidator,
    VCValidator,
    VPValidator,
} from '@learncard/types';

export const IssueEndpointValidator = z.object({
    credential: UnsignedVCValidator,
    options: z
        .object({
            created: z.string(),
            challenge: z.string(),
            domain: z.string(),
            credentialStatus: z.object({ type: z.string() }),
        })
        .optional(),
});
export type IssueEndpoint = z.infer<typeof IssueEndpointValidator>;

export const UpdateStatusEndpointValidator = z.object({
    credentialId: z.string(),
    credentialStatus: z.object({ type: z.string(), status: z.string() }).array().optional(),
});
export type UpdateStatusEndpoint = z.infer<typeof UpdateStatusEndpointValidator>;

export const VerifyCredentialEndpointValidator = z.object({
    verifiableCredential: VCValidator,
    options: z.object({ challenge: z.string().optional(), domain: z.string().optional() }).optional(),
});
export type VerifyCredentialEndpoint = z.infer<typeof VerifyCredentialEndpointValidator>;

export const VerifyPresentationEndpointValidator = z
    .object({
        verifiablePresentation: VPValidator,
        options: z.object({ challenge: z.string(), domain: z.string() }).optional(),
    })
    .or(z.object({ presentation: UnsignedVPValidator }));
export type VerifyPresentationEndpoint = z.infer<typeof VerifyPresentationEndpointValidator>;
