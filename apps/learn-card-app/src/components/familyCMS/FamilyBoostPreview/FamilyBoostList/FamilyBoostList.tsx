import React from 'react';

import SocialBadges from '../../../svgs/SocialBadges';
import SocialServices from '../../../svgs/SocialServices';
import FamilyBoostListItem from './FamilyBoostListItem';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { VC } from '@learncard/types';
import useBoostModal from '../../../boost/hooks/useBoostModal';

export const FamilyBoostList: React.FC<{ credential: VC }> = ({ credential }) => {
    const { handlePresentBoostModal } = useBoostModal(
        undefined,
        BoostCategoryOptionsEnum.socialBadge
    );

    const familyBoosts = [
        {
            id: 1,
            title: 'Social Boosts',
            icon: <SocialBadges />,
            boostType: BoostCategoryOptionsEnum.socialBadge,
            onClick: handlePresentBoostModal,
        },
        // ! Social Services hidden for now
        // {
        //     id: 2,
        //     title: 'Social Services',
        //     icon: <SocialServices />,
        //     boostType: BoostCategoryOptionsEnum.socialBadge,
        // },
    ];

    return (
        <div className="w-full flex items-center flex-col">
            {familyBoosts?.map(familyBoost => {
                const { title, icon, boostType, onClick } = familyBoost;

                return (
                    <FamilyBoostListItem
                        onClick={onClick}
                        key={familyBoost?.id}
                        title={title}
                        icon={icon}
                        boostType={boostType}
                    />
                );
            })}
        </div>
    );
};

export default FamilyBoostList;
