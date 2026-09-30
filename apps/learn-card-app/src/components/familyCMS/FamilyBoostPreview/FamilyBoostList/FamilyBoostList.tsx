import React from 'react';
import { useHistory } from 'react-router-dom';

import SocialBadges from '../../../svgs/SocialBadges';
import SocialServices from '../../../svgs/SocialServices';
import FamilyBoostListItem from './FamilyBoostListItem';

import { BoostCategoryOptionsEnum, useModal } from 'learn-card-base';
import { VC } from '@learncard/types';
import * as m from '../../../../paraglide/messages.js';

export const FamilyBoostList: React.FC<{ credential: VC }> = ({ credential }) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const handleIssue = () => {
        closeAllModals();
        history.push('/issue');
    };

    const familyBoosts = [
        {
            id: 1,
            title: m['arabicFixes.socialBoosts'](),
            icon: <SocialBadges />,
            boostType: BoostCategoryOptionsEnum.socialBadge,
            onClick: handleIssue,
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
