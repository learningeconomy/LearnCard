import React from 'react';

import { BoostCMSState } from '../../../boost';
import BoostIDCardFontForm from './BoostIDCardCMSFontForm';
import BoostIDCardCMSBackgroundImageForm from './BoostIDCardCMSBackgroundImageForm';
import { AppRow } from 'learn-card-base/ui/layout';
import BoostIDCardAccentForm from './BoostIDCardCMSAccentForm';

const BoostIDCardCMSAppearanceForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    return (
        <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-2 mb-4 rounded-[20px]">
            <BoostIDCardFontForm state={state} setState={setState} />
            <BoostIDCardAccentForm state={state} setState={setState} />
            <BoostIDCardCMSBackgroundImageForm state={state} setState={setState} />
        </AppRow>
    );
};

export default BoostIDCardCMSAppearanceForm;
