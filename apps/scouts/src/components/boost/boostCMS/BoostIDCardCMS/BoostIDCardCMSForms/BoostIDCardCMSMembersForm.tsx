import React, { useState } from 'react';

import { IonRow, IonCol, IonToggle } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';
import * as m from '../../../../../paraglide/messages.js';

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
                <h1 className="text-black text-2xl p-0 m-0">{m['boostCMS.memberOpts']()}</h1>
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
                            {m['boostCMS.publicMembers']()}
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
                            {m['boostCMS.autoConnect']()}
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
