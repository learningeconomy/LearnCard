import React from 'react';
import numeral from 'numeral';

import DotIcon from 'learn-card-base/svgs/DotIcon';
import { useLoadingLine } from '../../stores/loadingStore';
import { useGetCredentialsForSkills } from 'learn-card-base';

import { SubType, WalletPageItem } from './constants';
import { mapBoostsToSkills } from '../skills/skills.helpers';
import { IonSkeletonText } from '@ionic/react';

const WalletPageSkillsSquare: React.FC<{
    handleClickSquare: (subtype: SubType) => void;
    walletPageItem: WalletPageItem;
}> = ({ handleClickSquare, walletPageItem }) => {
    const {
        title,
        bgColor,
        bgColorSecondary,
        subtype,
        count,
        ShapeIcon,
        shapeColor,
        WalletIcon,
        notificationIndicator,
    } = walletPageItem;

    const { borderColor, backgroundColor } = notificationIndicator;

    const { data: allResolvedCreds, isLoading: allResolvedBoostsLoading } =
        useGetCredentialsForSkills();

    useLoadingLine(allResolvedBoostsLoading);

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + category.length,
        0
    );
    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = totalSkills + totalSubskills;

    return (
        <div
            key={walletPageItem.id}
            className="w-full flex flex-1 items-center justify-center"
            role="button"
            onClick={() => handleClickSquare(subtype)}
        >
            <div
                className={`w-[160px] h-[240px] flex-1 rounded-[25px] shadow-box-bottom ${bgColor} px-4 py-6 flex flex-col items-center justify-between border-[3px] border-white`}
            >
                <div className="w-full flex items-center justify-center relative">
                    <ShapeIcon className={`${shapeColor}`} />
                    <WalletIcon className="absolute" />
                </div>

                <div className="w-full flex items-center justify-center flex-col">
                    <p className="font-poppins text-lg font-semibold">{title}</p>
                    <div
                        className={`relative w-[50px] h-[30px] flex items-center justify-center rounded-full mt-1 ${bgColorSecondary}`}
                    >
                        <div
                            className={`absolute top-[-3px] right-[-3px] border-2 rounded-full border-solid ${borderColor}`}
                        >
                            <DotIcon className={`${backgroundColor}`} />
                        </div>
                        {allResolvedBoostsLoading ? (
                            <IonSkeletonText animated />
                        ) : (
                            <p className="text-white font-poppins font-semibold text-base">
                                {numeral(total).format('0a')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPageSkillsSquare;
