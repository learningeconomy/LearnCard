import { z } from 'zod';

import {
    UnsignedVCValidator,
} from '@learncard/types';

import { SigningAuthorityValidator } from './signing-authority';

export const IssueEndpointValidator = z.object({
    credential: UnsignedVCValidator,
    options: z
        .object({
            created: z.string().optional(),
            challenge: z.string().optional(),
            domain: z.string().optional(),
            credentialStatus: z.object({ type: z.string() }).optional(),
        })
        .optional(),
    signingAuthority: SigningAuthorityValidator.omit({ endpoint: true }),
    encryption: z.object({
        recipients: z.string().array()
    }).optional()
});
export type IssueEndpoint = z.infer<typeof IssueEndpointValidator>;