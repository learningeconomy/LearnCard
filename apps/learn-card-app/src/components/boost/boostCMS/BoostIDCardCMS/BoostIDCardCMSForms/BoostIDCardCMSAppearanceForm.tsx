import React from 'react';

import { BoostCMSState } from '../../../boost';
import BoostIDCardFontForm from './BoostIDCardCMSFontForm';
import BoostIDCardCMSBackgroundImageForm from './BoostIDCardCMSBackgroundImageForm';
import { IonRow } from '@ionic/react';
import BoostIDCardAccentForm from './BoostIDCardCMSAccentForm';

const BoostIDCardCMSAppearanceForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-2 mb-4 rounded-[20px]">
            <BoostIDCardFontForm state={state} setState={setState} />
            <BoostIDCardAccentForm state={state} setState={setState} />
            <BoostIDCardCMSBackgroundImageForm state={state} setState={setState} />
        </IonRow>
    );
};

export default BoostIDCardCMSAppearanceForm;
