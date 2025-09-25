import { z } from 'zod';

export const ContextValidator = z.array(z.string().or(z.record(z.any())));
export type Context = z.infer<typeof ContextValidator>;

export const AchievementCriteriaValidator = z.object({
    type: z.string().optional(),
    narrative: z.string().optional(),
});
export type AchievementCriteria = z.infer<typeof AchievementCriteriaValidator>;

export const ImageValidator = z.string().or(
    z.object({
        id: z.string(),
        type: z.string(),
        caption: z.string().optional(),
    })
);
export type Image = z.infer<typeof ImageValidator>;

export const GeoCoordinatesValidator = z.object({
    type: z.string().min(1).or(z.string().array().nonempty()),
    latitude: z.number(),
    longitude: z.number(),
});
export type GeoCoordinates = z.infer<typeof GeoCoordinatesValidator>;

export const AddressValidator = z.object({
    type: z.string().min(1).or(z.string().array().nonempty()),
    addressCountry: z.string().optional(),
    addressCountryCode: z.string().optional(),
    addressRegion: z.string().optional(),
    addressLocality: z.string().optional(),
    streetAddress: z.string().optional(),
    postOfficeBoxNumber: z.string().optional(),
    postalCode: z.string().optional(),
    geo: GeoCoordinatesValidator.optional(),
});
export type Address = z.infer<typeof AddressValidator>;

export const IdentifierTypeValidator = z
    .enum([
        'sourcedId',
        'systemId',
        'productId',
        'userName',
        'accountId',
        'emailAddress',
        'nationalIdentityNumber',
        'isbn',
        'issn',
        'lisSourcedId',
        'oneRosterSourcedId',
        'sisSourcedId',
        'ltiContextId',
        'ltiDeploymentId',
        'ltiToolId',
        'ltiPlatformId',
        'ltiUserId',
        'identifier',
    ])
    .or(z.string());
export type IdentifierType = z.infer<typeof IdentifierTypeValidator>;

export const IdentifierEntryValidator = z.object({
    type: z.string().min(1).or(z.string().array().nonempty()),
    identifier: z.string(),
    identifierType: IdentifierTypeValidator,
});
export type IdentifierEntry = z.infer<typeof IdentifierEntryValidator>;

export const ProfileValidator = z.string().or(
    z
        .object({
            id: z.string().optional(),
            type: z.string().or(z.string().array().nonempty().optional()),
            name: z.string().optional(),
            url: z.string().optional(),
            phone: z.string().optional(),
            description: z.string().optional(),
            endorsement: z.any().array().optional(), // Recursive type
            image: ImageValidator.optional(),
            email: z.string().email().optional(),
            address: AddressValidator.optional(),
            otherIdentifier: IdentifierEntryValidator.array().optional(),
            official: z.string().optional(),
            parentOrg: z.any().optional(), // Recursive types are annoying =(
            familyName: z.string().optional(),
            givenName: z.string().optional(),
            additionalName: z.string().optional(),
            patronymicName: z.string().optional(),
            honorificPrefix: z.string().optional(),
            honorificSuffix: z.string().optional(),
            familyNamePrefix: z.string().optional(),
            dateOfBirth: z.string().optional(),
        })
        .catchall(z.any())
);
export type Profile = z.infer<typeof ProfileValidator>;

export const CredentialSubjectValidator = z.object({ id: z.string().optional() }).catchall(z.any());
export type CredentialSubject = z.infer<typeof CredentialSubjectValidator>;

export const CredentialStatusValidator = z
    .object({ type: z.string(), id: z.string() })
    .catchall(z.any());
export type CredentialStatus = z.infer<typeof CredentialStatusValidator>;

export const CredentialSchemaValidator = z
    .object({ id: z.string(), type: z.string() })
    .catchall(z.any());
export type CredentialSchema = z.infer<typeof CredentialSchemaValidator>;

export const RefreshServiceValidator = z
    .object({ id: z.string().optional(), type: z.string() })
    .catchall(z.any());
export type RefreshService = z.infer<typeof RefreshServiceValidator>;

export const TermsOfUseValidator = z
    .object({ type: z.string(), id: z.string().optional() })
    .catchall(z.any());
export type TermsOfUse = z.infer<typeof TermsOfUseValidator>;

export const VC2EvidenceValidator = z
    .object({
        id: z.string().optional(),
        type: z.array(z.string()).nonempty(),
        name: z.string().optional(),
        narrative: z.string().optional(),
        description: z.string().optional(),
        genre: z.string().optional(),
        audience: z.string().optional(),
    })
    .catchall(z.any());
export type VC2Evidence = z.infer<typeof VC2EvidenceValidator>;

export const UnsignedVCValidator = z
    .object({
        '@context': ContextValidator,
        id: z.string().optional(),
        type: z.string().array().nonempty(),
        issuer: ProfileValidator,
        credentialSubject: CredentialSubjectValidator.or(CredentialSubjectValidator.array()),
        refreshService: RefreshServiceValidator.or(RefreshServiceValidator.array()).optional(),
        credentialSchema: CredentialSchemaValidator.or(
            CredentialSchemaValidator.array()
        ).optional(),

        // V1
        issuanceDate: z.string().optional(),
        expirationDate: z.string().optional(),
        credentialStatus: CredentialStatusValidator.or(
            CredentialStatusValidator.array()
        ).optional(),

        // V2
        name: z.string().optional(),
        description: z.string().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        status: CredentialStatusValidator.or(CredentialStatusValidator.array()).optional(),
        termsOfUse: TermsOfUseValidator.or(TermsOfUseValidator.array()).optional(),
        evidence: z.union([VC2EvidenceValidator, z.array(VC2EvidenceValidator)]).optional(),
    })
    .catchall(z.any());
export type UnsignedVC = z.infer<typeof UnsignedVCValidator>;

export const ProofValidator = z
    .object({
        type: z.string(),
        created: z.string(),
        challenge: z.string().optional(),
        domain: z.string().optional(),
        nonce: z.string().optional(),
        proofPurpose: z.string(),
        verificationMethod: z.string(),
        jws: z.string().optional(),
    })
    .catchall(z.any());
export type Proof = z.infer<typeof ProofValidator>;

export const VCValidator = UnsignedVCValidator.extend({
    proof: ProofValidator.or(ProofValidator.array()),
});
export type VC = z.infer<typeof VCValidator>;

export const UnsignedVPValidator = z
    .object({
        '@context': ContextValidator,
        id: z.string().optional(),
        type: z.string().or(z.string().array().nonempty()),
        verifiableCredential: VCValidator.or(VCValidator.array()).optional(),
        holder: z.string().optional(),
    })
    .catchall(z.any());
export type UnsignedVP = z.infer<typeof UnsignedVPValidator>;

export const VPValidator = UnsignedVPValidator.extend({
    proof: ProofValidator.or(ProofValidator.array()),
});
export type VP = z.infer<typeof VPValidator>;
