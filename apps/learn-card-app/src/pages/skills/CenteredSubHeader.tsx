import React from 'react';

import { IonRow, IonCol } from '@ionic/react';
import SKillsShield from '../../assets/images/skills-shield.png';

import { useGetCredentialsForSkills } from 'learn-card-base';

import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { mapBoostsToSkills, RawCategorizedEntry } from './skills.helpers';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';

export const CenteredSubHeader: React.FC<{ subheaderType: SubheaderTypeEnum }> = ({
    subheaderType,
}) => {
    const { data: allResolvedCreds, isLoading: allResolvedBoostsLoading } =
        useGetCredentialsForSkills(subheaderType === SubheaderTypeEnum.Skill);

    const skillsMap = mapBoostsToSkills(allResolvedCreds);
    // Calculate total count of skills and subskills
    const totalSkills = Object?.values(skillsMap)?.reduce(
        (total, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = Object?.values(skillsMap)?.reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    let icon = null;
    let title = '';

    if (subheaderType === SubheaderTypeEnum.Skill) {
        icon = <SkillsIconWithShape />;
        title = 'Skills Hub';
    } else if (subheaderType === SubheaderTypeEnum.AiInsights) {
        icon = <AiInsightsIconWithShape />;
        title = 'AI Insights Hub';
    }

    return (
        <IonRow className="flex items-center justify-center w-full">
            <IonCol size={'9'} className="flex flex-col items-center justify-center">
                {icon}
                <h2 className="select-none text-center font-poppins font-[600] text-[22px] text-grayscale-900 mt-2">
                    {title}
                </h2>
            </IonCol>
        </IonRow>
    );
};

export default CenteredSubHeader;
