import React from 'react';

import {
    IonCol,
    IonRow,
} from '@ionic/react';

import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';

const BOOSTCMSMediaTypeSelector: React.FC<{
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    handleCloseModal: () => void;
}> = ({ setActiveMediaType, handleCloseModal }) => {
    return (
        <IonRow className="flex w-full">
            <IonCol className="flex items-center justify-center flex-wrap">
                {boostMediaOptions.map(({ id, type, title, color, Icon }) => {
                    return (
                        <button
                            key={id}
                            className={`flex flex-col items-center justify-center text-center w-[45%] ion-padding h-[122px] m-2 bg-${color} rounded-[20px]`}
                            onClick={() => setActiveMediaType(type)}
                        >
                            <Icon className="h-[40px] text-white max-h-[40px] max-w-[40px]" />
                            <p className="text-white text-2xl">{title}</p>
                        </button>
                    );
                })}
            </IonCol>
        </IonRow>
    );
};


export default BOOSTCMSMediaTypeSelector;
