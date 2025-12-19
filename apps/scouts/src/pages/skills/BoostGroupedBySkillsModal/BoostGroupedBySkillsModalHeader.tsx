import React from 'react';
import numeral from 'numeral';

import { SkillsArchIcon } from 'learn-card-base/svgs/SkillsArchIcon';
import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';
import { IonHeader, IonToolbar } from '@ionic/react';

import { BoostCMSSKillsCategoryEnum } from '../../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

type BoostGroupedBySkillsModalProps = {
    category: BoostCMSSKillsCategoryEnum;
    totalSkillsCount: number;
};

const BoostGroupedBySkillsModalHeader: React.FC<BoostGroupedBySkillsModalProps> = ({
    category,
    totalSkillsCount,
}) => {
    const { IconComponent } = category;

    return (
        <IonHeader color="violet-600" className="rounded-b-[30px] overflow-hidden shadow-md ">
            <IonToolbar color="violet-600" className="text-white px-4 !pt-8">
                <div className="w-full flex">
                    {/* Left Column */}
                    <div className="relative flex flex-col items-center justify-start mb-[-10px] ml-4">
                        <SkillsArchIcon className="h-[140px] w-[80px]" />
                        <div className="absolute top-[25px] w-[70px] h-[70px] rounded-full overflow-hidden">
                            <img
                                src={IconComponent}
                                alt="category icon"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="absolute bottom-[15px] flex items-center text-[17px] font-semibold bg-white text-violet-800 px-2">
                            <SkillsIcon className="h-[25px] w-[25px] mr-1" fill="#6D28D9" />
                            {numeral(totalSkillsCount).format('0a')}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col justify-center ml-4">
                        <h2 className="font-poppins font-semibold text-[22px] text-white leading-tight">
                            {category?.title}
                        </h2>
                        <p className="text-white opacity-90 text-sm font-semibold">
                            {category?.description}
                        </p>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default BoostGroupedBySkillsModalHeader;
