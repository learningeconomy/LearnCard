import React from 'react';

import { IonRow, IonCol, IonToggle } from '@ionic/react';

import { BoostCMSState } from '../../../boost';

const BoostCMSAIMissionForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const basicInfo = state?.basicInfo;

    // TODO: handle state here

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
            <IonCol size="12" className="w-full bg-white">
                <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                    <h1 className="text-black text-2xl p-0 m-0">AI Mission Generation</h1>
                    <IonToggle
                        mode="ios"
                        color="indigo-700"
                        onIonChange={() => {
                            const expiresValue = !basicInfo?.credentialExpires;
                            handleStateChange('credentialExpires', expiresValue);
                            //if we are toggling the value to false (eg does not expire, clear expiration date if exists)
                            if (!expiresValue) {
                                handleStateChange('expirationDate', null);
                            }
                        }}
                        checked={basicInfo?.credentialExpires}
                        disabled={disabled}
                    />
                </div>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSAIMissionForm;
