import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    useGetSkillFrameworkById,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
} from 'learn-card-base';

export const useSkillSearchSelectorData = () => {
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const initialSkillIds = flags?.initialSelfAssignedSkillIds?.skillIds as string[];

    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);

    const errorLoadingFramework = !selfAssignedSkillFramework && !selfAssignedSkillFrameworkLoading;

    return {
        frameworkId,
        initialSkillIds,
        selfAssignedSkillFramework,
        selfAssignedSkillFrameworkLoading,
        sasBoostSkills,
        skillsLoading,
        errorLoadingFramework,
    };
};
