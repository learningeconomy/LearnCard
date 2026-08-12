import { useGetSelfAssignedSkillsBoost, useGetBoostSkills } from 'learn-card-base';

import { useGlobalSkillFrameworks } from '../../helpers/globalSkillFrameworks.helpers';

export const useSkillSearchSelectorData = () => {
    const globalSkillFrameworks = useGlobalSkillFrameworks();

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);

    return {
        globalSkillFrameworks,
        sasBoostSkills,
        skillsLoading,
    };
};
