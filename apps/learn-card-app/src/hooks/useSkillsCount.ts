import { useGetCredentialsForSkills } from 'learn-card-base';
import { useResolvedConsentFlowDataForDid } from 'learn-card-base';
import { useGlobalSkillFrameworks } from '../helpers/globalSkillFrameworks.helpers';
import { countSkillsForFrameworks } from './skillAlignment.helpers';

export const useSkillsCount = () => {
    const { data: allResolvedCreds } = useGetCredentialsForSkills();
    const globalSkillFrameworks = useGlobalSkillFrameworks();
    const frameworkIds = globalSkillFrameworks.map(framework => framework.frameworkId);

    const total = countSkillsForFrameworks(allResolvedCreds, frameworkIds);

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
    const globalSkillFrameworks = useGlobalSkillFrameworks();
    const frameworkIds = globalSkillFrameworks.map(framework => framework.frameworkId);

    const total = countSkillsForFrameworks(allResolvedCreds, frameworkIds);

    return {
        totalSkills: total,
        totalSubskills: 0,
        total,
        isLoadingResolved,
    };
};
