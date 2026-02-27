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
                    Default Permissions
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
                    <div className="pb-[12px]">
                        <p className="text-grayscale-600 text-xs m-0">
                            Configure what anyone can view, edit, or send by default for this
                            credential template.
                        </p>
                    </div>

                    <div className="w-full flex items-center justify-between py-[8px]">
                        <div className="w-10/12">
                            <p className="text-grayscale-900 font-medium m-0">View Template</p>
                            <p className="text-grayscale-600 text-xs m-0">
                                Anyone can view this credential template.
                            </p>
                        </div>
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

                    <div className="w-full flex items-center justify-between py-[8px]">
                        <div className="w-10/12">
                            <p className="text-grayscale-900 font-medium m-0">Edit Template</p>
                            <p className="text-grayscale-600 text-xs m-0">
                                Anyone can edit this credential template.
                            </p>
                        </div>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            checked={Boolean(state?.boostPermissions?.canEdit)}
                            disabled={disabled}
                            onIonChange={e => {
                                const canEdit = Boolean(e.detail.checked);
                                setState(prevState => ({
                                    ...prevState,
                                    boostPermissions: {
                                        ...prevState.boostPermissions,
                                        canEdit,
                                    },
                                }));
                            }}
                        />
                    </div>

                    <div className="w-full flex items-center justify-between py-[8px]">
                        <div className="w-10/12">
                            <p className="text-grayscale-900 font-medium m-0">Send Template</p>
                            <p className="text-grayscale-600 text-xs m-0">
                                Anyone can send this credential template.
                            </p>
                        </div>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            checked={Boolean(state?.boostPermissions?.canIssue)}
                            disabled={disabled}
                            onIonChange={e => {
                                const canIssue = Boolean(e.detail.checked);
                                setState(prevState => ({
                                    ...prevState,
                                    boostPermissions: {
                                        ...prevState.boostPermissions,
                                        canIssue,
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
