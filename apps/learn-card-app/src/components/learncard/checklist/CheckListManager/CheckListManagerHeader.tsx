import React from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';

import * as m from '../../../../paraglide/messages.js';
import { TransP } from '../../../../i18n/TransP';

import BuildColorBlocksIcon from 'learn-card-base/svgs/BuildColorBlocksIcon';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

export const CheckListManagerHeader: React.FC<{}> = ({}) => {
    const brandingConfig = useBrandingConfig();

    return (
        <IonHeader
            color="light"
            className="rounded-b-[30px] safe-area-top-margin overflow-hidden shadow-md"
        >
            <IonToolbar color="light" className="text-white px-4 !py-4">
                <div className="flex items-center justify-normal p-2">
                    <div className="flex items-center">
                        <div className="bg-white rounded-[15px] p-2 w-[60px] flex items-center justify-center mr-2">
                            <BuildColorBlocksIcon className="w-[60px] h-[60px]" />
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h5 className="text-[22px] font-semibold text-grayscale-900 font-poppins">
                                <TransP
                                    m={m['passport.buildMyLearnCard.titleMarkup']}
                                    values={{ brand: brandingConfig.name }}
                                    components={[<span key="brand" />]}
                                />
                            </h5>
                            <p className="text-sm text-grayscale-600 font-notoSans leading-[24px] tracking-[0.25px]">
                                {m['passport.buildMyLearnCard.managerDescription']()}
                            </p>
                        </div>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default CheckListManagerHeader;
