import React from 'react';
import { IonLabel } from '@ionic/react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import useTheme from '../../../theme/hooks/useTheme';
import { CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';

import PathwaySearchInput from './PathwaySearchInput';
import ExplorePathwaysModal from '../ExplorePathwaysModal';

export enum AiPathwaysWhatWouldYouLikeToDoCardOptions {
    GrowSkills = 'grow-skills',
    FindRoles = 'find-roles',
}

const AiPathwaysWhatWouldYouLikeToDoCard: React.FC<{
    handleExplorePathways: (option?: AiPathwaysWhatWouldYouLikeToDoCardOptions) => void;
    variant?: AiPathwaysWhatWouldYouLikeToDoCardOptions;
}> = ({
    handleExplorePathways,
    variant = AiPathwaysWhatWouldYouLikeToDoCardOptions.GrowSkills,
}) => {
    const { newModal } = useModal();
    const flags = useFlags();
    const { getThemedCategoryIcons } = useTheme();

    const enableExplorePathways = flags?.enableExplorePathways ?? false;

    const { IconWithShape: PathwaysIcon } = getThemedCategoryIcons(
        CredentialCategoryEnum.aiPathway
    );
    const { IconWithShape: SkillsIcon } = getThemedCategoryIcons(CredentialCategoryEnum.skill);

    const handleGrowSkills = () => {
        handleExplorePathways(AiPathwaysWhatWouldYouLikeToDoCardOptions.GrowSkills);
    };

    const handleFindRoles = () => {
        handleExplorePathways(AiPathwaysWhatWouldYouLikeToDoCardOptions.FindRoles);
    };

    const handleSearchSubmit = (query: string) => {
        newModal(<ExplorePathwaysModal initialSearchQuery={query} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    if (!enableExplorePathways) return null;

    return (
        <div className="flex items-center justify-center w-full rounded-[15px] px-4 max-w-[600px]">
            <div className="w-full bg-white rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="w-full gap-2 flex flex-col">
                    <IonLabel className="text-grayscale-900 font-poppins text-xl">
                        What would you like to do?
                    </IonLabel>
                    <PathwaySearchInput onSearchSubmit={handleSearchSubmit} />
                </div>

                <button
                    onClick={() => handleExplorePathways()}
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
