import { getFrameworkIdAndSkillIdFromUrl } from '../components/boost/alignmentHelpers';

export type SkillAlignment = {
    targetName?: string;
    targetUrl?: string;
    frameworkId?: string;
};

type CredentialWithSkillAlignments = {
    boostCredential?: {
        issuanceDate?: string;
        validFrom?: string;
        credentialSubject?: {
            achievement?: {
                alignment?: SkillAlignment[];
            };
        };
    };
    issuanceDate?: string;
    validFrom?: string;
    credentialSubject?: {
        achievement?: {
            alignment?: SkillAlignment[];
        };
    };
};

/**
 * Alignments for the skills hub: prefer CertifiedBoostCredential wrapper, then bare
 * OpenBadgeCredential `credentialSubject` (Just-me / claim-link skill boosts).
 * Same fallback as the Alignments panel / countSkillsForFrameworks.
 */
export const getCredentialAchievementAlignments = (credential: unknown): SkillAlignment[] => {
    const resolvedCredential = credential as CredentialWithSkillAlignments;

    return (
        resolvedCredential.boostCredential?.credentialSubject?.achievement?.alignment ??
        resolvedCredential.credentialSubject?.achievement?.alignment ??
        []
    );
};

/** Issuance / validFrom used for hub sort — boost wrapper first, then bare VC. */
export const getCredentialSkillIssuanceDate = (credential: unknown): string => {
    const resolvedCredential = credential as CredentialWithSkillAlignments;

    return (
        resolvedCredential.boostCredential?.issuanceDate ??
        resolvedCredential.boostCredential?.validFrom ??
        resolvedCredential.issuanceDate ??
        resolvedCredential.validFrom ??
        ''
    );
};

export const countSkillsForFrameworks = (
    credentials: unknown[] | undefined,
    frameworkIds: string[]
): number => {
    const skills = new Set<string>();
    const configuredFrameworkIds = new Set(frameworkIds);

    credentials?.forEach(credential => {
        const alignments = getCredentialAchievementAlignments(credential);

        alignments.forEach(alignment => {
            const { frameworkId } = getFrameworkIdAndSkillIdFromUrl(alignment.targetUrl ?? '');
            const alignmentFrameworkId = alignment.frameworkId ?? frameworkId;
            const skillIdentifier =
                alignment.targetUrl ??
                (alignmentFrameworkId && alignment.targetName
                    ? `${alignmentFrameworkId}:${alignment.targetName}`
                    : undefined);

            if (
                alignmentFrameworkId &&
                skillIdentifier &&
                configuredFrameworkIds.has(alignmentFrameworkId)
            ) {
                skills.add(skillIdentifier);
            }
        });
    });

    return skills.size;
};
