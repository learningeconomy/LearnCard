import React, { useState, useEffect } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonTextarea } from '@ionic/react';

import useFirebaseAnalytics from '../../../../../hooks/useFirebaseAnalytics';
import { isCustomBoostType } from 'learn-card-base';
import { BoostCMSState } from '../../../boost';

const BoostCMSTitleForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    showTitle?: boolean;
    disabled?: boolean;
    overrideCustomize?: boolean;
}> = ({ state, setState, showTitle, disabled = false, overrideCustomize }) => {
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const flags = useFlags();
    const basicInfo = state?.basicInfo;

    const [charCount, setCharCount] = useState<number>(0);
    const maxCount = 100;

    const handleLogBoostCMSCreateStep = () => {
        logAnalyticsEvent('boostCMS_data_entry', {
            timestamp: Date.now(),
            action: 'data_entry',
            boostType: state?.basicInfo?.achievementType,
            category: state?.basicInfo?.type,
        });
    };

    useEffect(() => {
        handleLogBoostCMSCreateStep();
    }, []);

    useEffect(() => {
        setCharCount(state?.basicInfo?.name?.length);
    }, [state?.basicInfo?.name]);

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

    const placeHolder = 'Title';

    const _disabled = (disabled || flags?.disableCmsCustomization) && !overrideCustomize;

    return (
        <div className="max-w-[600px] flex flex-col items-start justify-center w-full mt-2">
            {showTitle && <p className="font-medium ml-[5px] mb-[5px]">Boost Title</p>}
            <IonTextarea
                autocapitalize="on"
                value={basicInfo?.name}
                onIonInput={e => handleStateChange('name', e?.detail?.value)}
                placeholder={placeHolder}
                className={`relative bg-grayscale-900 text-grayscale-400 rounded-[15px] px-[16px] py-[4px] font-medium text-base ${
                    _disabled ? '!opacity-70' : ''
                }`}
                disabled={_disabled}
                rows={3}
                maxlength={100}
            >
                <p className="absolute right-[10px] bottom-[10px] text-xs" slot="end">
                    {charCount}/{maxCount}
                </p>
            </IonTextarea>
        </div>
    );
};

export default BoostCMSTitleForm;
