import React, { useState, useEffect } from 'react';

import { IonTextarea } from '@ionic/react';

import useFirebaseAnalytics from '../../../../../hooks/useFirebaseAnalytics';

import { BoostCMSState } from '../../../boost';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

const BoostCMSTitleForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const { logAnalyticsEvent } = useFirebaseAnalytics();
    const basicInfo = state?.basicInfo;

    const isID = state?.basicInfo?.type === BoostCategoryOptionsEnum.id;
    const isMembership = state?.basicInfo?.type === BoostCategoryOptionsEnum.membership;

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
        setCharCount(state?.basicInfo?.name?.length ?? 0);
    }, [state.basicInfo.name]);

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

    const placeHolder = isID || isMembership ? 'Title' : 'Boost Title';

    return (
        <div className="max-w-[600px] flex flex-col items-start justify-center w-full mt-6">
            <IonTextarea
                autocapitalize="on"
                value={basicInfo?.name}
                onIonInput={e => handleStateChange('name', e?.detail?.value)}
                placeholder={placeHolder}
                className={`relative bg-grayscale-900 text-grayscale-400 rounded-[15px] px-[16px] py-[4px] font-medium tracking-widest text-base `}
                disabled={disabled}
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
