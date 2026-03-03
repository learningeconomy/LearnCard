import { useGetCredentialsForSkills } from 'learn-card-base';
import { mapBoostsToSkills } from '../pages/skills/skills.helpers';
import { useResolvedConsentFlowDataForDid } from 'learn-card-base';

export const useSkillsCount = () => {
    const { data: allResolvedCreds } = useGetCredentialsForSkills();

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );

    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    return {
        totalSkills,
        totalSubskills,
        total,
    };
};

export const useSkillsCountByDid = (did: string) => {
    const { data: allResolvedCreds, isLoading: isLoadingResolved } =
        useResolvedConsentFlowDataForDid(did, {
            limit: 100,
        });

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );

    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    return {
        totalSkills,
        totalSubskills,
        total,
        isLoadingResolved,
    };
};
