import React, { useState } from 'react';
import moment from 'moment';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { AppCol, AppRow } from 'learn-card-base/ui/layout';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { AppToggle } from 'learn-card-base/ui/controls/AppToggle';

import { BoostCMSState } from '../../../boost';
import * as m from '../../../../../paraglide/messages.js';

const BoostCMSUserPermissions: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const flags = useFlags();
    const basicInfo = state?.basicInfo;
    const boostType = state?.basicInfo?.type;

    const [showAbout, setShowAbout] = useState<boolean>(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
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
        <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <AppCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-black text-2xl p-0 m-0">
                    {m['boost.cms.userPermissions.title']()}
                </h1>
                <button onClick={() => setShowAbout(!showAbout)}>
                    <CaretLeft
                        className={`h-auto w-3 text-grayscale-800 ${
                            showAbout ? '-rotate-90' : 'rotate-180'
                        }`}
                    />
                </button>
            </AppCol>
            {showAbout && (
                <>
                    <AppCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">
                                {m['boost.cms.userPermissions.createCustomBoosts']()}
                            </p>
                            <AppToggle
                                mode="ios"
                                color="indigo-700"
                                onCheckedChange={() => {
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
                    </AppCol>
                    <AppCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">
                                {m['boost.cms.userPermissions.createIDs']()}
                            </p>
                            <AppToggle
                                mode="ios"
                                color="indigo-700"
                                onCheckedChange={() => {
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
                    </AppCol>
                    <AppCol size="12" className="w-full bg-white">
                        <div className="w-full flex items-center justify-between py-[8px]">
                            <p className="text-grayscale-900 font-medium w-10/12">
                                {m['boost.cms.userPermissions.createMemberships']()}
                            </p>
                            <AppToggle
                                mode="ios"
                                color="indigo-700"
                                onCheckedChange={() => {
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
                    </AppCol>
                </>
            )}
        </AppRow>
    );
};

export default BoostCMSUserPermissions;
