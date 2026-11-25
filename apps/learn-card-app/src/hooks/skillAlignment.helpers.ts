import type { BoostCMSAlignment } from '../components/boost/boost';
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

    const alignment: unknown =
        resolvedCredential.boostCredential?.credentialSubject?.achievement?.alignment ??
        resolvedCredential.credentialSubject?.achievement?.alignment;

    // Generic VCs can carry arbitrary subject fields, so a non-array alignment must not reach .forEach.
    return Array.isArray(alignment) ? alignment : [];
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

export type HubSkillAlignment<TCredential> = BoostCMSAlignment & {
    targetUrl: string;
    credentials: TCredential[];
    count: number;
    frameworkId: string;
    skillId: string;
    issuanceDate: string;
};

/**
 * Skills hub aggregation, keyed by alignment URL. Alignments without a `targetUrl`
 * (e.g. bare OB3 `{ targetName, frameworkId }`) cannot be resolved to a hub skill
 * node, so they are skipped instead of being parsed.
 */
export const aggregateHubSkillAlignments = <TCredential>(
    credentials: readonly TCredential[] | undefined,
    frameworkIds: readonly string[]
): HubSkillAlignment<TCredential>[] => {
    const alignmentMap = new Map<string, HubSkillAlignment<TCredential>>();

    credentials?.forEach(credential => {
        const issuanceDate = getCredentialSkillIssuanceDate(credential);

        getCredentialAchievementAlignments(credential).forEach(alignment => {
            const { targetUrl } = alignment;
            if (!targetUrl) return;

            const existing = alignmentMap.get(targetUrl);
            if (existing) {
                existing.credentials.push(credential);
                existing.count++;
                // Keep the most recent issuanceDate
                if (
                    issuanceDate &&
                    (!existing.issuanceDate || issuanceDate > existing.issuanceDate)
                ) {
                    existing.issuanceDate = issuanceDate;
                }
                return;
            }

            const parsed = getFrameworkIdAndSkillIdFromUrl(targetUrl);
            alignmentMap.set(targetUrl, {
                ...alignment,
                type: 'Alignment',
                targetName: alignment.targetName ?? '',
                targetUrl,
                credentials: [credential],
                issuanceDate,
                count: 1,
                frameworkId: parsed.frameworkId ?? '',
                skillId: parsed.skillId ?? '',
            });
        });
    });

    return Array.from(alignmentMap.values()).filter(alignment =>
        frameworkIds.includes(alignment.frameworkId)
    );
};
