import { useGetCredentialsForSkills } from 'learn-card-base';
import { useResolvedConsentFlowDataForDid } from 'learn-card-base';

const WEF_GLOBAL_SKILLS_FRAMEWORK_ID = 'wef-global-skills-taxonomy';

type SkillAlignment = {
    targetName?: string;
    targetUrl?: string;
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

const countWefSkills = (credentials: unknown[] | undefined): number => {
    const skills = new Set<string>();

    credentials?.forEach(credential => {
        const resolvedCredential = credential as CredentialWithSkillAlignments;
        const alignments =
            resolvedCredential.boostCredential?.credentialSubject?.achievement?.alignment ??
            resolvedCredential.credentialSubject?.achievement?.alignment ??
            [];

        alignments.forEach((alignment: { targetUrl?: string; targetName?: string }) => {
            if (
                alignment.targetUrl?.includes(`/frameworks/${WEF_GLOBAL_SKILLS_FRAMEWORK_ID}/`) &&
                alignment.targetName
            ) {
                skills.add(alignment.targetUrl ?? alignment.targetName);
            }
        });
    });

    return skills.size;
};

export const useSkillsCount = () => {
    const { data: allResolvedCreds } = useGetCredentialsForSkills();

    const total = countWefSkills(allResolvedCreds);

    return {
        totalSkills: total,
        totalSubskills: 0,
        total,
    };
};

export const useSkillsCountByDid = (did: string) => {
    const { data: allResolvedCreds, isLoading: isLoadingResolved } =
        useResolvedConsentFlowDataForDid(did, {
            limit: 100,
        });

    const total = countWefSkills(allResolvedCreds);

    return {
        totalSkills: total,
        totalSubskills: 0,
        total,
        isLoadingResolved,
    };
};
