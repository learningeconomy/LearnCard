import { z } from 'zod';
import { ContextValidator, ProofValidator } from './vc';
import { JWKValidator } from './crypto';

export const VerificationMethodValidator = z.string().or(
    z
        .object({
            '@context': ContextValidator.optional(),
            id: z.string(),
            type: z.string(),
            controller: z.string(),
            publicKeyJwk: JWKValidator.optional(),
            publicKeyBase58: z.string().optional(),
            blockChainAccountId: z.string().optional(),
        })
        .catchall(z.any())
);
export type VerificationMethod = z.infer<typeof VerificationMethodValidator>;

export const ServiceValidator = z
    .object({
        id: z.string(),
        type: z.string().or(z.string().array().nonempty()),
        serviceEndpoint: z.any().or(z.any().array().nonempty()),
    })
    .catchall(z.any());
export type Service = z.infer<typeof ServiceValidator>;

export const DidDocumentValidator = z
    .object({
        '@context': ContextValidator,
        id: z.string(),
        alsoKnownAs: z.string().optional(),
        controller: z.string().or(z.string().array().nonempty()).optional(),
        verificationMethod: VerificationMethodValidator.array().optional(),
        authentication: VerificationMethodValidator.array().optional(),
        assertionMethod: VerificationMethodValidator.array().optional(),
        keyAgreement: VerificationMethodValidator.array().optional(),
        capabilityInvocation: VerificationMethodValidator.array().optional(),
        capabilityDelegation: VerificationMethodValidator.array().optional(),
        publicKey: VerificationMethodValidator.array().optional(),
        service: ServiceValidator.array().optional(),
        proof: ProofValidator.or(ProofValidator.array()).optional(),
    })
    .catchall(z.any());
export type DidDocument = z.infer<typeof DidDocumentValidator>;
