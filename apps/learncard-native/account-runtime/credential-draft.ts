export interface NativeCredentialDraft {
    requestID: string;
    title: string;
    summary: string;
    kind: string;
    achievementType: string;
    criteria: string;
    artworkURL?: string;
    recipient?: string;
}

/** Current web builder contexts and fields; SDK send fills the recipient and issue date. */
export const buildNativeTemplate = (
    input: NativeCredentialDraft,
    issuerDid: string,
    issuerName: string
) => {
    if (
        !input.requestID ||
        input.requestID.length > 100 ||
        !input.title.trim() ||
        !input.summary.trim() ||
        input.title.length > 100 ||
        input.summary.length > 1000 ||
        input.criteria.length > 2000 ||
        !['Achievements', 'Memberships', 'Learning'].includes(input.kind) ||
        ![
            'Badge',
            'Certificate',
            'Course',
            'Competency',
            'Membership',
            'License',
            'MicroCredential',
        ].includes(input.achievementType)
    ) {
        throw new Error('Invalid credential details');
    }
    if (input.artworkURL) {
        const url = new URL(input.artworkURL);
        if (
            url.protocol !== 'https:' ||
            url.host !== 'cdn.filestackcontent.com' ||
            url.username ||
            url.password
        )
            throw new Error('Unsupported artwork');
    }
    return {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: input.title.trim(),
        issuer: { id: issuerDid, name: issuerName },
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                name: input.title.trim(),
                description: input.summary.trim(),
                achievementType: input.achievementType,
                criteria: { narrative: input.criteria.trim() || input.summary.trim() },
                ...(input.artworkURL ? { image: { id: input.artworkURL, type: 'Image' } } : {}),
            },
        },
    };
};
