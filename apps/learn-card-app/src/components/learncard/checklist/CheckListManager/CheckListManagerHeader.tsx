import React from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';
import WrenchIcon from 'learn-card-base/svgs/WrenchIcon';
import BuildColorBlocksIcon from 'learn-card-base/svgs/BuildColorBlocksIcon';
import { useGetCheckListStatus, checklistItems } from 'learn-card-base';

export const CheckListManagerHeader: React.FC<{}> = ({}) => {
    const { completedItems } = useGetCheckListStatus();

    return (
        <IonHeader
            color="light"
            className="rounded-b-[30px] safe-area-top-margin overflow-hidden shadow-md "
        >
            <IonToolbar color="light" className="text-white px-4 !py-4">
                <div className="flex items-center justify-normal p-2">
                    <div className="flex items-center">
                        <div className="bg-white rounded-[15px] p-2 w-[60px] flex items-center justify-center mr-2">
                            <BuildColorBlocksIcon className="w-[60px] h-[60px]" />
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h5 className="text-[22px] font-semibold text-grayscale-900 font-poppins">
                                Build My LearnCard
                            </h5>
                            <p className="text-[17px] text-grayscale-900 font-notoSans leading-[24px] tracking-[0.25px]">
                                <span className="font-semibold">{completedItems}</span> of{' '}
                                <span className="font-semibold">{checklistItems.length}</span> Steps
                                Completed
                            </p>
                        </div>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default CheckListManagerHeader;
