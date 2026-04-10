import React, { useState } from 'react';
import { IonLabel } from '@ionic/react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import useTheme from '../../../theme/hooks/useTheme';
import { CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';

import PathwaySearchInput from './PathwaySearchInput';
import ExplorePathwaysModal from '../ExplorePathwaysModal';

export enum AiPathwaysWhatWouldYouLikeToDoCardOptions {
    GrowSkills = 'grow-skills',
    FindRoles = 'find-roles',
}

const AiPathwaysWhatWouldYouLikeToDoCard: React.FC = () => {
    const { newModal } = useModal();
    const flags = useFlags();
    const { getThemedCategoryIcons } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const enableExplorePathways = flags?.enableExplorePathways ?? false;

    const { IconWithShape: PathwaysIcon } = getThemedCategoryIcons(
        CredentialCategoryEnum.aiPathway
    );
    const { IconWithShape: SkillsIcon } = getThemedCategoryIcons(CredentialCategoryEnum.skill);
    const ResolvedPathwaysIcon = PathwaysIcon ?? AiPathwaysIconWithShape;
    const ResolvedSkillsIcon = SkillsIcon ?? SkillsIconWithShape;

    const openExplorePathwaysModal = ({
        query,
        option,
    }: {
        query?: string;
        option?: AiPathwaysWhatWouldYouLikeToDoCardOptions;
    }) => {
        newModal(
            <ExplorePathwaysModal initialSearchQuery={query?.trim()} option={option} />,
            undefined,
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    if (!enableExplorePathways) return null;

    return (
        <div className="flex items-center justify-center w-full rounded-[15px] px-4 max-w-[600px]">
            <div className="w-full bg-white rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="w-full gap-2 flex flex-col">
                    <IonLabel className="text-grayscale-900 font-poppins text-xl">
                        What would you like to do?
                    </IonLabel>
                    <PathwaySearchInput
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        onSearchSubmit={query => openExplorePathwaysModal({ query })}
                    />
                </div>

                <button
                    onClick={() => openExplorePathwaysModal({ query: searchQuery })}
                    className="p-[11px] bg-teal-400 font-semibold rounded-full text-white flex-1 font-poppins text-[17px]"
                >
                    Explore Pathways
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() =>
                            openExplorePathwaysModal({
                                query: searchQuery,
                                option: AiPathwaysWhatWouldYouLikeToDoCardOptions.GrowSkills,
                            })
                        }
                        className="p-4 flex items-center justify-center flex-col bg-grayscale-50 rounded-[16px] text-grayscale-800 font-semibold border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                    >
                        <ResolvedSkillsIcon className="w-[50px] h-[50px]" />
                        Grow Skills
                    </button>

                    <button
                        onClick={() =>
                            openExplorePathwaysModal({
                                query: searchQuery,
                                option: AiPathwaysWhatWouldYouLikeToDoCardOptions.FindRoles,
                            })
                        }
                        className="p-4 flex items-center justify-center flex-col bg-grayscale-50 rounded-[16px] text-grayscale-800 font-semibold border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                    >
                        <ResolvedPathwaysIcon className="w-[50px] h-[50px]" />
                        Find Roles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiPathwaysWhatWouldYouLikeToDoCard;
