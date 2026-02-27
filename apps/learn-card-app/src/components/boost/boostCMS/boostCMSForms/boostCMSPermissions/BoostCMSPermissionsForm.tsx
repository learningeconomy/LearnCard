import React, { useState } from 'react';
import { IonCol, IonRow, IonToggle } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';

const BoostCMSPermissionsForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const [showPermissions, setShowPermissions] = useState<boolean>(true);

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="font-poppins font-medium text-grayscale-900 text-lg p-0 m-0">
                    Boost Permissions
                </h1>
                <button onClick={() => setShowPermissions(!showPermissions)}>
                    <CaretLeft
                        className={`h-auto w-3 text-grayscale-800 ${
                            showPermissions ? 'rotate-[-90deg]' : 'rotate-180'
                        }`}
                    />
                </button>
            </IonCol>
            {showPermissions && (
                <IonCol size="12" className="w-full bg-white">
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                        <p className="text-grayscale-900 font-medium w-10/12">Visibility</p>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            checked={Boolean(state?.boostPermissions?.canView)}
                            disabled={disabled}
                            onIonChange={e => {
                                const canView = Boolean(e.detail.checked);
                                setState(prevState => ({
                                    ...prevState,
                                    boostPermissions: {
                                        ...prevState.boostPermissions,
                                        canView,
                                    },
                                }));
                            }}
                        />
                    </div>
                </IonCol>
            )}
        </IonRow>
    );
};

export default BoostCMSPermissionsForm;
