import React, { useState, useEffect } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonTextarea } from '@ionic/react';

import { BoostCMSState } from '../../../boost';
import {
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
} from 'learn-card-base';

const BoostCMSCustomTypeForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const flags = useFlags();
    const [charCount, setCharCount] = useState<number>(0);
    const maxCount = 100;

    useEffect(() => {
        setCharCount(state?.basicInfo?.achievementType?.length ?? 0);
    }, [state?.basicInfo?.achievementType]);

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

    const formattedText = state?.basicInfo?.achievementType
        ? replaceUnderscoresWithWhiteSpace(
              getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
          )
        : '';

    const placeHolder = 'Custom Type';

    const _disabled = disabled;

    return (
        <div className="max-w-[600px] flex flex-col items-start justify-center w-full mt-2">
            <p className="font-medium ml-[5px] mb-[5px]">Custom Type Name</p>
            <IonTextarea
                autocapitalize="on"
                value={formattedText}
                onIonInput={e =>
                    handleStateChange(
                        'achievementType',
                        `ext:LCA_CUSTOM:${state?.basicInfo?.type}:${e?.detail?.value}`
                    )
                }
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

export default BoostCMSCustomTypeForm;
