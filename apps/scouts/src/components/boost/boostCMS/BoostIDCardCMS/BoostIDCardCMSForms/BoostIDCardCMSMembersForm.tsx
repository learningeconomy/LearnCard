import React, { useState } from 'react';

import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';
import * as m from '../../../../../paraglide/messages.js';
import { AppToggle } from 'learn-card-base/ui/controls/AppToggle';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const BoostIDCardCMSMembersForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const memberOptions = state?.memberOptions;

    const [showAbout, setShowAbout] = useState<boolean>(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
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
        <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <AppCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-black text-2xl p-0 m-0">{m['boostCMS.memberOpts']()}</h1>
                <button onClick={() => setShowAbout(!showAbout)}>
                    <CaretLeft
                        className={`rtl-mirror h-auto w-3 text-grayscale-800 ${
                            showAbout ? '-rotate-90' : 'rotate-180'
                        }`}
                    />
                </button>
            </AppCol>
            {showAbout && (
                <>
                    <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                        <p className="text-grayscale-900 font-medium w-10/12">
                            {m['boostCMS.publicMembers']()}
                        </p>
                        <AppToggle
                            mode="ios"
                            color="emerald-700"
                            onCheckedChange={() => {
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
                        <AppToggle
                            mode="ios"
                            color="emerald-700"
                            onCheckedChange={() => {
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
        </AppRow>
    );
};

export default BoostIDCardCMSMembersForm;
