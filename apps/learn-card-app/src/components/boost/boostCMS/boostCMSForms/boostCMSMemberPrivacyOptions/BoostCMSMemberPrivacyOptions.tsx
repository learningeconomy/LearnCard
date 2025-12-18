import React, { useState } from 'react';
import moment from 'moment';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonRow, IonCol, IonToggle, IonCheckbox } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import { BoostCMSState } from '../../../boost';

import useTheme from '../../../../../theme/hooks/useTheme';

export enum MemberPrivacyOptionsEnum {
    public = 'public',
    private = 'private',
    secret = 'secret',
}

const BoostCMSMemberOptions: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

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

    const memberOptions = [
        {
            privacyLevel: MemberPrivacyOptionsEnum.public,
            text: 'Show to public',
        },
        {
            privacyLevel: MemberPrivacyOptionsEnum.private,
            text: 'Show to members only',
        },
        {
            privacyLevel: MemberPrivacyOptionsEnum.secret,
            text: 'Hide members',
        },
    ];

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-black text-2xl p-0 m-0">Member Options</h1>
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
                                Automatically connect members in contacts
                            </p>
                            <IonToggle
                                mode="ios"
                                color={primaryColor}
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

                        <div className="w-full h-[2px] bg-grayscale-100 mt-2 mb-2" />
                    </IonCol>
                    <IonCol
                        size="12"
                        className="w-full bg-white flex flex-col items-center justify-between"
                    >
                        <h1 className="text-black text-2xl p-0 m-0 w-full text-left">
                            Member Display
                        </h1>
                        {memberOptions?.map(option => {
                            return (
                                <div className="w-full flex items-center justify-between py-[8px]">
                                    <p className="text-grayscale-900 font-medium w-10/12">
                                        {option?.text}
                                    </p>
                                    <IonCheckbox />
                                </div>
                            );
                        })}
                    </IonCol>
                </>
            )}
        </IonRow>
    );
};

export default BoostCMSMemberOptions;
