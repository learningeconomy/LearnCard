import { z } from 'zod';

import {
    UnsignedVCValidator,
    ProofValidator,
    ProfileValidator,
    ImageValidator,
} from './vc';

import {
    AchievementValidator,
    EndorsementCredentialValidator,
} from './obv3';

// ---------------------------------------------------------------------------
// CLR v2 — Comprehensive Learner Record
// Based on 1EdTech CLR Standard v2.0
// https://www.imsglobal.org/spec/clr/v2p0
// ---------------------------------------------------------------------------

export const AssociationTypeValidator = z
    .enum([
        'exactMatchOf',
        'extends',
        'isChildOf',
        'isParentOf',
        'isPartOf',
        'isPeerOf',
        'isRelatedTo',
        'precedes',
        'replacedBy',
    ])
    .or(z.string());
export type AssociationType = z.infer<typeof AssociationTypeValidator>;

export const AssociationValidator = z
    .object({
        type: z.string().array().nonempty(),
        associationType: AssociationTypeValidator,
        sourceId: z.string().optional(),
        targetId: z.string(),
    })
    .catchall(z.any());
export type Association = z.infer<typeof AssociationValidator>;

export const ClrSubjectValidator = z
    .object({
        id: z.string().optional(),
        type: z.string().array().nonempty(),
        identifier: z.any().array().optional(),
        achievement: AchievementValidator.array().optional(),
        association: AssociationValidator.array().optional(),
        verifiableCredential: z.any().array().optional(),
    })
    .catchall(z.any());
export type ClrSubject = z.infer<typeof ClrSubjectValidator>;

export const UnsignedClrCredentialValidator = UnsignedVCValidator.extend({
    name: z.string().optional(),
    description: z.string().optional(),
    image: ImageValidator.optional(),

    credentialSubject: ClrSubjectValidator.or(ClrSubjectValidator.array()) as z.ZodUnion<
        [typeof ClrSubjectValidator, z.ZodArray<typeof ClrSubjectValidator>]
    >,

    endorsement: EndorsementCredentialValidator.array().optional(),

    partial: z.boolean().optional(),
});
export type UnsignedClrCredential = z.infer<typeof UnsignedClrCredentialValidator>;

export const ClrCredentialValidator = UnsignedClrCredentialValidator.extend({
    proof: ProofValidator.or(ProofValidator.array()),
});
export type ClrCredential = z.infer<typeof ClrCredentialValidator>;
