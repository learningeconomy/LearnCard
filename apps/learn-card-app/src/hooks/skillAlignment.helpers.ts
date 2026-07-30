import { getFrameworkIdAndSkillIdFromUrl } from '../components/boost/alignmentHelpers';

type SkillAlignment = {
    targetName?: string;
    targetUrl?: string;
    frameworkId?: string;
};

type CredentialWithSkillAlignments = {
    boostCredential?: {
        credentialSubject?: {
            achievement?: {
                alignment?: SkillAlignment[];
            };
        };
    };
    credentialSubject?: {
        achievement?: {
            alignment?: SkillAlignment[];
        };
    };
};

export const countSkillsForFrameworks = (
    credentials: unknown[] | undefined,
    frameworkIds: string[]
): number => {
    const skills = new Set<string>();
    const configuredFrameworkIds = new Set(frameworkIds);

    credentials?.forEach(credential => {
        const resolvedCredential = credential as CredentialWithSkillAlignments;
        const alignments =
            resolvedCredential.boostCredential?.credentialSubject?.achievement?.alignment ??
            resolvedCredential.credentialSubject?.achievement?.alignment ??
            [];

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
