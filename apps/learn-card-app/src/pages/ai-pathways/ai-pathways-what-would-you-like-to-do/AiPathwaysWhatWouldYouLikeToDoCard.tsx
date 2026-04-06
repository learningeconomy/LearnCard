import React, { useState } from 'react';
import { IonLabel, IonInput } from '@ionic/react';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons/index';
import { CredentialCategoryEnum } from 'learn-card-base';

const AiPathwaysWhatWouldYouLikeToDoCard: React.FC<{
    handleExplorePathways: () => void;
}> = ({ handleExplorePathways }) => {
    const [keywordInput, setKeywordInput] = useState<string>('');
    const { getThemedCategoryIcons, getIconSet } = useTheme();

    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const InputDecoration = iconSet[CredentialCategoryEnum.aiPathway] as React.ComponentType<{
        className?: string;
        shadeColor?: string;
    }>;
    const { IconWithShape: PathwaysIcon, Icon: PathwaysIconOnly } = getThemedCategoryIcons(
        CredentialCategoryEnum.aiPathway
    );
    const { IconWithShape: SkillsIcon } = getThemedCategoryIcons(CredentialCategoryEnum.skill);

    const handleGrowSkills = () => {
        // TODO: Implement grow skills functionality
    };

    const handleFindRoles = () => {
        // TODO: Implement find roles functionality
    };

    return (
        <div className="flex items-center justify-center w-full rounded-[15px] px-4 max-w-[600px]">
            <div className="w-full bg-white rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="w-full gap-2 flex flex-col">
                    <IonLabel className="text-grayscale-900 font-poppins text-xl">
                        What would you like to do?
                    </IonLabel>
                    <div className="relative flex items-center">
                        <InputDecoration className="absolute left-3 w-[24px] h-[24px] text-teal-100 pointer-events-none z-10" />
                        <IonInput
                            value={keywordInput}
                            onIonInput={(e: any) => setKeywordInput(e.detail.value)}
                            onKeyDown={(e: any) => e.key === 'Enter' && handleExplorePathways()}
                            autocapitalize="on"
                            className={`w-full bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-sm`}
                            style={{ '--padding-start': '44px' } as any}
                            placeholder="Choose a skill, goal, or job..."
                            type="text"
                        />
                    </div>
                </div>

                <button
                    onClick={handleExplorePathways}
                    className="p-[11px] bg-teal-400 font-semibold rounded-full text-white border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                >
                    Explore Pathways
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={handleGrowSkills}
                        className="p-4 flex items-center justify-center flex-col bg-grayscale-50 rounded-[16px] text-grayscale-800 font-semibold border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                    >
                        <SkillsIcon className="w-[50px] h-[50px]" />
                        Grow Skills
                    </button>

                    <button
                        onClick={handleFindRoles}
                        className="p-4 flex items-center justify-center flex-col bg-grayscale-50 rounded-[16px] text-grayscale-800 font-semibold border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                    >
                        <PathwaysIcon className="w-[50px] h-[50px]" />
                        Find Roles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiPathwaysWhatWouldYouLikeToDoCard;
