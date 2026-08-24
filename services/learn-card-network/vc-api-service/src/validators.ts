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
            type: z.string().optional(),
            cryptosuite: z.string().optional(),
            // 'ldp' is the only proofFormat supported end-to-end: it is DIDKit's
            // linked-data value. 'jwt' is rejected because the DIDKit plugin
            // JSON-parses issued credentials, which breaks JWT (string) output.
            proofFormat: z.enum(['ldp']).optional(),
            created: z.string().optional(),
            challenge: z.string().optional(),
            domain: z.string().optional(),
            credentialStatus: z.object({ type: z.string() }).optional(),
        })
        .optional(),
});
export type IssueEndpoint = z.infer<typeof IssueEndpointValidator>;

export const IssuePresentationEndpointValidator = z.object({
    presentation: UnsignedVPValidator,
    options: z
        .object({
            created: z.string().optional(),
            challenge: z.string().optional(),
            domain: z.string().optional(),
        })
        .optional(),
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
    options: z
        .object({ challenge: z.string().optional(), domain: z.string().optional() })
        .optional(),
});
export type VerifyCredentialEndpoint = z.infer<typeof VerifyCredentialEndpointValidator>;

export const VerifyPresentationEndpointValidator = z
    .object({
        verifiablePresentation: VPValidator,
        options: z
            .object({ challenge: z.string().optional(), domain: z.string().optional() })
            .optional(),
    })
    .or(z.object({ presentation: UnsignedVPValidator }));
export type VerifyPresentationEndpoint = z.infer<typeof VerifyPresentationEndpointValidator>;
