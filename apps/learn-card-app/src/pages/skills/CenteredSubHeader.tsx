import React from 'react';

import { IonRow, IonCol } from '@ionic/react';
import SKillsShield from '../../assets/images/skills-shield.png';

import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import * as m from '../../paraglide/messages.js';

export const CenteredSubHeader: React.FC<{ subheaderType: SubheaderTypeEnum }> = ({
    subheaderType,
}) => {
    let icon = null;
    let title = '';

    if (subheaderType === SubheaderTypeEnum.Skill) {
        icon = <SkillsIconWithShape />;
        title = m['aiFeatureLinks.skillsHub']();
    } else if (subheaderType === SubheaderTypeEnum.AiInsights) {
        icon = <AiInsightsIconWithShape />;
        title = m['wallet.categories.aiInsights']();
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
