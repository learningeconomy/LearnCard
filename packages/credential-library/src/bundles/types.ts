export interface CredentialBundleEntry {
    fixtureId: string;
    /** Shift the fixture's issue date relative to the seed run. */
    validFromOffsetDays: number;
    /** Override the credential's display name after fixture preparation. */
    name?: string;
}

export interface CredentialBundle {
    id: string;
    displayName: string;
    blurb: string;
    entries: readonly CredentialBundleEntry[];
}
