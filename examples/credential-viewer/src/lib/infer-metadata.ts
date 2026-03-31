/**
 * Infers fixture metadata from a parsed credential JSON object.
 * Returns partial metadata — only fields that can be confidently guessed.
 */

import type {
    CredentialSpec,
    CredentialProfile,
    CredentialFeature,
} from '@learncard/credential-library';

export interface InferredMetadata {
    name?: string;
    description?: string;
    spec?: CredentialSpec;
    profile?: CredentialProfile;
    features?: CredentialFeature[];
    signed?: boolean;
    folder?: string;
    tags?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asArray(val: unknown): unknown[] {
    if (Array.isArray(val)) return val;
    if (val != null) return [val];

    return [];
}

function getContextUrls(cred: Record<string, unknown>): string[] {
    return asArray(cred['@context']).filter((c): c is string => typeof c === 'string');
}

function getTypes(cred: Record<string, unknown>): string[] {
    return asArray(cred.type).filter((t): t is string => typeof t === 'string');
}

function getSubject(cred: Record<string, unknown>): Record<string, unknown> | undefined {
    const cs = cred.credentialSubject;

    if (Array.isArray(cs)) return cs[0] as Record<string, unknown>;
    if (cs && typeof cs === 'object') return cs as Record<string, unknown>;

    return undefined;
}

function getAchievement(cred: Record<string, unknown>): Record<string, unknown> | undefined {
    const subject = getSubject(cred);

    if (!subject) return undefined;

    const ach = subject.achievement;

    if (Array.isArray(ach)) return ach[0] as Record<string, unknown>;
    if (ach && typeof ach === 'object') return ach as Record<string, unknown>;

    return undefined;
}

// ---------------------------------------------------------------------------
// Spec detection
// ---------------------------------------------------------------------------

function inferSpec(cred: Record<string, unknown>): CredentialSpec | undefined {
    const contexts = getContextUrls(cred);
    const types = getTypes(cred);

    // CLR v2
    if (
        types.some(t => t === 'ClrCredential') ||
        contexts.some(c => c.includes('clr'))
    ) {
        return 'clr-v2';
    }

    // OBv3 (including Boost, which is OBv3-based)
    if (
        types.some(t => ['OpenBadgeCredential', 'AchievementCredential', 'BoostCredential'].includes(t)) ||
        contexts.some(c => c.includes('ob/v3') || c.includes('openbadges'))
    ) {
        return 'obv3';
    }

    // Europass
    if (contexts.some(c => c.includes('europass'))) {
        return 'europass';
    }

    // VC version — check context URLs
    if (contexts.some(c => c === 'https://www.w3.org/ns/credentials/v2')) {
        return 'vc-v2';
    }

    if (contexts.some(c => c === 'https://www.w3.org/2018/credentials/v1')) {
        return 'vc-v1';
    }

    return undefined;
}

// ---------------------------------------------------------------------------
// Profile detection
// ---------------------------------------------------------------------------

const ACHIEVEMENT_TYPE_TO_PROFILE: Record<string, CredentialProfile> = {
    Badge: 'badge',
    Certificate: 'certificate',
    Certification: 'certificate',
    Diploma: 'diploma',
    Degree: 'degree',
    AssociateDegree: 'degree',
    BachelorDegree: 'degree',
    MasterDegree: 'degree',
    DoctoralDegree: 'degree',
    Course: 'course',
    MicroCredential: 'micro-credential',
    License: 'license',
    Membership: 'membership',
    LearningProgram: 'learner-record',
};

function inferProfile(cred: Record<string, unknown>, spec?: CredentialSpec): CredentialProfile | undefined {
    const types = getTypes(cred);

    // Boost types
    if (types.includes('BoostID')) return 'boost-id';
    if (types.includes('BoostCredential')) return 'boost';

    // Endorsement
    if (types.includes('EndorsementCredential')) return 'endorsement';

    // CLR
    if (types.includes('ClrCredential') || spec === 'clr-v2') return 'learner-record';

    // Look at achievementType
    const achievement = getAchievement(cred);

    if (achievement) {
        const achType = achievement.achievementType as string | undefined;

        if (achType && ACHIEVEMENT_TYPE_TO_PROFILE[achType]) {
            return ACHIEVEMENT_TYPE_TO_PROFILE[achType];
        }
    }

    // ID-like credentials
    const subject = getSubject(cred);

    if (subject) {
        const subjectTypes = asArray(subject.type).filter((t): t is string => typeof t === 'string');

        if (subjectTypes.some(t => t.toLowerCase().includes('id') && !t.includes('Subject'))) {
            return 'id';
        }
    }

    // OBv3 without specific achievementType → badge
    if (spec === 'obv3') return 'badge';

    return undefined;
}

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

function inferFeatures(cred: Record<string, unknown>): CredentialFeature[] {
    const features: CredentialFeature[] = [];
    const subject = getSubject(cred);
    const achievement = getAchievement(cred);

    if (cred.evidence || subject?.evidence) features.push('evidence');

    if (achievement?.alignment || subject?.alignment) features.push('alignment');

    if (cred.endorsement || cred.endorsementJwt) features.push('endorsement');

    if (cred.expirationDate || cred.validUntil) features.push('expiration');

    if (cred.credentialStatus) features.push('status');

    if (Array.isArray(cred.credentialSubject) && cred.credentialSubject.length > 1) {
        features.push('multiple-subjects');
    }

    const proof = cred.proof;

    if (Array.isArray(proof) && proof.length > 1) features.push('multiple-proofs');

    if (cred.refreshService) features.push('refresh-service');

    if (cred.termsOfUse) features.push('terms-of-use');

    if (cred.credentialSchema) features.push('credential-schema');

    if (cred.image || achievement?.image) features.push('image');

    if (subject?.result || achievement?.result) features.push('results');

    if (subject?.source || achievement?.source) features.push('source');

    if (achievement?.tag || achievement?.skill || cred.skills) features.push('skills');

    if ((cred as Record<string, unknown>).display) features.push('display');

    if (cred.attachment || subject?.attachment) features.push('attachments');

    if (achievement?.association) features.push('associations');

    return features;
}

// ---------------------------------------------------------------------------
// Name / description detection
// ---------------------------------------------------------------------------

function inferName(cred: Record<string, unknown>): string | undefined {
    if (typeof cred.name === 'string') return cred.name;

    const achievement = getAchievement(cred);

    if (achievement && typeof achievement.name === 'string') return achievement.name;

    return undefined;
}

function inferDescription(cred: Record<string, unknown>): string | undefined {
    if (typeof cred.description === 'string') return cred.description;

    const achievement = getAchievement(cred);

    if (achievement && typeof achievement.description === 'string') {
        return achievement.description;
    }

    const subject = getSubject(cred);

    if (subject && typeof subject.description === 'string') {
        return subject.description;
    }

    return undefined;
}

// ---------------------------------------------------------------------------
// Tags detection
// ---------------------------------------------------------------------------

function inferTags(cred: Record<string, unknown>, types: string[]): string[] {
    const tags: string[] = [];

    // Add non-generic types as tags
    const skipTypes = new Set(['VerifiableCredential', 'VerifiablePresentation']);

    for (const t of types) {
        if (!skipTypes.has(t)) {
            // Convert PascalCase to kebab-case for tag
            const tag = t.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

            tags.push(tag);
        }
    }

    return tags;
}

// ---------------------------------------------------------------------------
// Folder detection
// ---------------------------------------------------------------------------

const SPEC_TO_FOLDER: Record<string, string> = {
    'obv3': 'obv3',
    'vc-v1': 'vc-v1',
    'vc-v2': 'vc-v2',
    'clr-v2': 'clr',
    'europass': 'europass',
};

function inferFolder(spec?: CredentialSpec, profile?: CredentialProfile): string | undefined {
    // Boost profiles go to boost folder
    if (profile === 'boost' || profile === 'boost-id') return 'boost';

    if (spec && SPEC_TO_FOLDER[spec]) return SPEC_TO_FOLDER[spec];

    return undefined;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function inferMetadata(cred: Record<string, unknown>): InferredMetadata {
    const types = getTypes(cred);
    const spec = inferSpec(cred);
    const profile = inferProfile(cred, spec);
    const features = inferFeatures(cred);
    const signed = cred.proof != null;
    const folder = inferFolder(spec, profile);

    return {
        name: inferName(cred),
        description: inferDescription(cred),
        spec,
        profile,
        features: features.length > 0 ? features : undefined,
        signed,
        folder,
        tags: inferTags(cred, types),
    };
}
