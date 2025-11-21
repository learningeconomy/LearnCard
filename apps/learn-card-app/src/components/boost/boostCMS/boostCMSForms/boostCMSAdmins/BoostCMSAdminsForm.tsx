import React, { useState } from 'react';
import moment from 'moment';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonRow, IonCol, IonToggle, IonCheckbox } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';
import Plus from 'learn-card-base/svgs/Plus';

const BoostCMSAdminsForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const flags = useFlags();
    const basicInfo = state?.basicInfo;
    const boostType = state?.basicInfo?.type;

    const [showAbout, setShowAbout] = useState<boolean>(true);

    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                basicInfo: {
                    ...prevState.basicInfo,
                    [propName]: value,
                },
            };
        });
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-grayscale-900 font-medium text-xl p-0 m-0">Assign Admins</h1>
                <button
                    onClick={() => setShowAbout(!showAbout)}
                    className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl"
                >
                    <Plus className="w-8 h-auto" />
                </button>
            </IonCol>
            <IonCol size="12" className="w-full bg-white">
                <div className="w-full flex items-center justify-between py-[8px]" />
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSAdminsForm;
