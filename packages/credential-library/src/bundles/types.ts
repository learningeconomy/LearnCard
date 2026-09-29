export interface CredentialBundleIssuer {
    /** Namespaced profile ID created and owned by the sample seeder. */
    profileId: `sample-${string}`;
    /** Issuer name shown on the rendered credential. */
    displayName: string;
    /** Optional issuer avatar copied to the safe sample profile. */
    image?: string;
}

export interface CredentialBundleEntry {
    fixtureId: string;
    /** Shift the fixture's issue date relative to the seed run. */
    validFromOffsetDays: number;
    /** Safe sample issuer used when publishing this credential. */
    issuer: CredentialBundleIssuer;
    /** Override the credential's display name after fixture preparation. */
    name?: string;
}

export interface CredentialBundle {
    id: string;
    displayName: string;
    blurb: string;
    entries: readonly CredentialBundleEntry[];
}
