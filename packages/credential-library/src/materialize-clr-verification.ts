import type { VC } from '@learncard/types';
import { clrMultiIssuerVerification } from './fixtures/clr/multi-issuer-verification';

/** A signer must return a VC with a genuine proof made by the named issuer. */
export type ClrVerificationSigner = (credential: Record<string, unknown>) => Promise<VC>;

export interface ClrVerificationFixtureOptions {
    issuerDids: readonly [string, string];
    publisherDid: string;
    revokedStatusList: VC;
    learnerDid: string;
    signers: Readonly<Record<string, ClrVerificationSigner>>;
    /** Add a second independent occurrence carrying the same child ID and proof. */
    duplicateValidChild?: boolean;
    /** Alter the signed child payload while preserving its proof. */
    tamperChild?: (credential: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Build a real, independently signed multi-issuer CLR. The third child is
 * signed first and then altered while assembling the outer CLR. Signing the
 * outer document last keeps its proof valid while the nested proof fails.
 */
export const materializeMultiIssuerClrVerificationFixture = async ({
    issuerDids,
    publisherDid,
    revokedStatusList,
    learnerDid,
    signers,
    duplicateValidChild = false,
    tamperChild = credential => {
        const subject = credential.credentialSubject as Record<string, unknown>;
        const achievement = subject.achievement as Record<string, unknown>;
        return {
            ...credential,
            credentialSubject: {
                ...subject,
                achievement: { ...achievement, name: 'Tampered nested record' },
            },
        };
    },
}: ClrVerificationFixtureOptions): Promise<VC> => {
    const blueprint = structuredClone(clrMultiIssuerVerification.credential) as unknown as Record<
        string,
        unknown
    >;
    const outerSubject = blueprint.credentialSubject as Record<string, unknown>;
    const childBlueprints = outerSubject.verifiableCredential as Record<string, unknown>[];
    if (childBlueprints.length < 3)
        throw new Error('CLR verification blueprint needs three children');
    const [districtA, districtB] = issuerDids;
    const signChild = async (
        source: Record<string, unknown>,
        issuer: string,
        tamper = false
    ): Promise<VC> => {
        const signer = signers[issuer];
        if (!signer) throw new Error(`Missing CLR fixture signer for ${issuer}`);
        const draft = structuredClone(source);
        draft.issuer = {
            ...(draft.issuer && typeof draft.issuer === 'object'
                ? (draft.issuer as Record<string, unknown>)
                : {}),
            id: issuer,
        };
        const subject = draft.credentialSubject as Record<string, unknown>;
        subject.id = learnerDid;
        if (draft.credentialStatus) {
            draft.credentialStatus = {
                ...(draft.credentialStatus as Record<string, unknown>),
                id: `${revokedStatusList.id}#revoked-1`,
                statusListCredential: revokedStatusList.id,
            };
        }
        const signed = await signer(draft);
        return tamper ? (tamperChild(signed as unknown as Record<string, unknown>) as VC) : signed;
    };
    const valid = await signChild(childBlueprints[0]!, districtA);
    const revoked = await signChild(childBlueprints[1]!, districtB);
    const tampered = await signChild(childBlueprints[2]!, districtB, true);
    const signOuter = signers[publisherDid];
    if (!signOuter) throw new Error(`Missing CLR fixture signer for ${publisherDid}`);
    blueprint.issuer = {
        ...(blueprint.issuer as Record<string, unknown>),
        id: publisherDid,
    };
    outerSubject.id = learnerDid;
    outerSubject.verifiableCredential = duplicateValidChild
        ? [valid, revoked, tampered, structuredClone(valid)]
        : [valid, revoked, tampered];
    return signOuter(blueprint);
};

export interface ClrVerificationScaleFixtureOptions {
    issuerDids: readonly string[];
    learnerDid: string;
    signers: Readonly<Record<string, ClrVerificationSigner>>;
    recordCount?: number;
}

/** Materialize independently signed CLR children for resolver/concurrency regression coverage. */
export const materializeClrVerificationScaleFixture = async ({
    issuerDids,
    learnerDid,
    signers,
    recordCount = 50,
}: ClrVerificationScaleFixtureOptions): Promise<VC> => {
    if (issuerDids.length < 1) throw new Error('At least one CLR issuer is required');
    if (!Number.isInteger(recordCount) || recordCount < 1) {
        throw new Error('recordCount must be a positive integer');
    }
    const issuerProfiles = Object.fromEntries(
        issuerDids.map((did, index) => {
            const name = `District ${index + 1} (Fictional)`;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#315b8a"/><text x="48" y="62" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="white">${index + 1}</text></svg>`;
            return [
                did,
                {
                    id: did,
                    type: ['Profile'],
                    name,
                    image: {
                        id: `data:image/svg+xml,${encodeURIComponent(svg)}`,
                        type: 'Image',
                        caption: `${name} logo`,
                    },
                },
            ];
        })
    );
    const issuer = issuerDids[0]!;
    const signer = signers[issuer];
    if (!signer) throw new Error(`Missing CLR fixture signer for ${issuer}`);
    const records = await Promise.all(
        Array.from({ length: recordCount }, async (_, index) => {
            const childIssuer = issuerDids[index % issuerDids.length]!;
            const childSigner = signers[childIssuer];
            if (!childSigner) throw new Error(`Missing CLR fixture signer for ${childIssuer}`);
            return childSigner({
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: `urn:uuid:clr-scale-record-${String(index + 1).padStart(2, '0')}`,
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: issuerProfiles[childIssuer],
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: {
                    id: learnerDid,
                    type: ['AchievementSubject'],
                    achievement: {
                        id: `urn:uuid:clr-scale-record-${String(index + 1).padStart(2, '0')}#achievement`,
                        type: 'Achievement',
                        name: `District record ${index + 1}`,
                    },
                },
            });
        })
    );
    return signer({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
        ],
        id: 'urn:uuid:clr-verification-scale',
        type: ['VerifiableCredential', 'ClrCredential'],
        issuer: issuerProfiles[issuer],
        validFrom: '2026-01-01T00:00:00Z',
        credentialSubject: {
            id: learnerDid,
            type: ['ClrSubject'],
            name: 'Multi-issuer scale test learner',
            verifiableCredential: records,
        },
    });
};
