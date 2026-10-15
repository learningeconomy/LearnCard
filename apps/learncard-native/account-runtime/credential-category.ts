import { CREDENTIAL_CATEGORIES } from '../../../packages/learn-card-base/src/types/credentials';

// Qualifications shipped after this experiment branched (web PR #1638).
// Match the web's explicit-tag precedence and conservative legacy backfill rules
// without importing its UI helpers or modifying the index/signed credential.
const categories = new Set<string>([...CREDENTIAL_CATEGORIES, 'Qualifications']);
const historicQualifications = new Map([
    ['License', 'ID'],
    ['Certification', 'Achievement'],
    ['ApprenticeshipCertificate', 'Work History'],
    ['JourneymanCertificate', 'Work History'],
    ['MasterCertificate', 'Work History'],
]);
const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const types = (value: unknown): string[] =>
    (Array.isArray(value) ? value : [value]).filter(
        (item): item is string => typeof item === 'string'
    );

/** Presentation-only resolution. Never migrates account data or rewrites a proof. */
export const credentialCategoryForDisplay = (
    indexed: unknown,
    raw: unknown
): string | undefined => {
    const original = object(raw);
    const credential =
        types(original.type).includes('CertifiedBoostCredential') && original.boostCredential
            ? object(original.boostCredential)
            : original;
    const subject = object(
        Array.isArray(credential.credentialSubject)
            ? credential.credentialSubject[0]
            : credential.credentialSubject
    );
    const achievement = object(
        Array.isArray(subject.achievement) ? subject.achievement[0] : subject.achievement
    );
    let explicit: string | undefined;
    for (const tag of Array.isArray(achievement.tag) ? achievement.tag : []) {
        if (typeof tag !== 'string') continue;
        const match = /^lc:category:(.+)$/i.exec(tag);
        const candidate = match?.[1]?.trim();
        if (candidate && categories.has(candidate)) explicit = candidate;
    }
    if (explicit) return explicit;
    const stored = text(indexed);
    const achievementType = text(achievement.achievementType);
    // A known non-qualification achievement must not be reclassified by an
    // unrelated outer type. In particular, Certificate != Certification.
    const historic = achievementType
        ? historicQualifications.get(achievementType)
        : types(credential.type)
              .map(type => historicQualifications.get(type))
              .find(Boolean);
    if (historic && (!stored || stored === historic)) return 'Qualifications';
    return stored || undefined;
};
