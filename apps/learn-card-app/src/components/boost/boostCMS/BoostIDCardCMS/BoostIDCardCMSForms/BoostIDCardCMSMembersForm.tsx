import React, { useState } from 'react';

import { IonRow, IonCol, IonToggle } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';

const BoostIDCardCMSMembersForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const memberOptions = state?.memberOptions;

    const [showAbout, setShowAbout] = useState<boolean>(false);

    const handleStateChange = (propName: string, value: any) => {
        setState(prevState => {
            return {
                ...prevState,
                memberOptions: {
                    ...prevState.memberOptions,
                    [propName]: value,
                },
            };
        });
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="font-poppins text-black text-xl p-0 m-0">Member Options</h1>
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
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                        <p className="text-grayscale-900 font-medium w-10/12">
                            Publicly display members
                        </p>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onIonChange={() => {
                                const publiclyDisplayMembers =
                                    !memberOptions?.publiclyDisplayMembers;
                                handleStateChange('publiclyDisplayMembers', publiclyDisplayMembers);
                            }}
                            checked={state?.memberOptions?.publiclyDisplayMembers}
                            disabled={disabled}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                        <p className="text-grayscale-900 font-medium w-10/12">
                            Automatically connect members in contacts
                        </p>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onIonChange={() => {
                                const autoConnectMembersInContacts =
                                    !memberOptions?.autoConnectMembersInContacts;
                                handleStateChange(
                                    'autoConnectMembersInContacts',
                                    autoConnectMembersInContacts
                                );
                            }}
                            checked={state?.memberOptions?.autoConnectMembersInContacts}
                            disabled={disabled}
                        />
                    </div>
                </>
            )}
        </IonRow>
    );
};

export default BoostIDCardCMSMembersForm;
