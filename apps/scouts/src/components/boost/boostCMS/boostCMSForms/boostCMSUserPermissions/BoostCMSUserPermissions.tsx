import React, { useState } from 'react';
import moment from 'moment';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonRow, IonCol, IonToggle, IonCheckbox } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';

const BoostCMSUserPermissions: React.FC<{
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
                <h1 className="text-black text-2xl p-0 m-0">User Permissions</h1>
                <button onClick={() => setShowAbout(!showAbout)}>
                    <CaretLeft
                        className={`h-auto w-3 text-grayscale-800 ${
                            showAbout ? 'rotate-[-90deg]' : 'rotate-180'
                        }`}
                    />
                </button>
            </IonCol>
            {showAbout && (
                <>
                    <IonCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">
                                Create Custom Boosts
                            </p>
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
                    <IonCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">Create IDs</p>
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
                    <IonCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">
                                Create Memberships
                            </p>
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
                </>
            )}
        </IonRow>
    );
};

export default BoostCMSUserPermissions;
