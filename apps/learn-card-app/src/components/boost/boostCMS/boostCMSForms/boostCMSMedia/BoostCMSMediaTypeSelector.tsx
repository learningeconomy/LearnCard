import React from 'react';

import { AppCol, AppRow } from '../../../../layout';

import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';

type BoostCMSMediaTypeSelectorProps = {
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
};

const BoostCMSMediaTypeSelector: React.FC<BoostCMSMediaTypeSelectorProps> = ({
    setActiveMediaType,
}) => {
    return (
        <AppRow className="flex w-full">
            <AppCol className="flex items-center justify-center flex-wrap">
                {boostMediaOptions.map(({ id, type, title, color, Icon }) => {
                    return (
                        <button
                            key={id}
                            className={`flex flex-col items-center justify-center text-center w-[45%] ion-padding h-[122px] m-2 bg-${color} rounded-[20px]`}
                            onClick={() => setActiveMediaType(type)}
                        >
                            <Icon className="h-[40px] text-white max-h-[40px] max-w-[40px]" />
                            <p className="font-poppins text-white text-xl tracking-wider">
                                {title}
                            </p>
                        </button>
                    );
                })}
            </AppCol>
        </AppRow>
    );
};

export default BoostCMSMediaTypeSelector;
