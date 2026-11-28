import React, { useState, useEffect } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { BoostCMSState } from '../../../boost';
import * as m from '../../../../../paraglide/messages.js';
import {
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
} from 'learn-card-base';
import { AppTextarea } from 'learn-card-base/ui/controls/AppTextarea';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
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
            <p className="font-medium ml-[5px] mb-[5px]">{m['boostCMS.customTypeName']()}</p>
            <AppTextarea
                autocapitalize="on"
                value={formattedText}
                onValueInput={value =>
                    handleStateChange(
                        'achievementType',
                        `ext:LCA_CUSTOM:${state?.basicInfo?.type}:${value}`
                    )
                }
                placeholder={placeHolder}
                className={`relative bg-grayscale-900 text-grayscale-400 rounded-[15px] px-[16px] py-[4px] font-medium text-base ${
                    _disabled ? 'opacity-70!' : ''
                }`}
                disabled={_disabled}
                rows={3}
                maxlength={100}
                end={
                    <p className="absolute right-[10px] bottom-[10px] text-xs">
                        {charCount}/{maxCount}
                    </p>
                }
            />
        </div>
    );
};

export default BoostCMSCustomTypeForm;
