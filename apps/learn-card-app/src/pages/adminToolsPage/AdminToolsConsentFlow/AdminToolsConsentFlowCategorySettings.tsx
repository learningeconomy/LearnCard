import React from 'react';

import { IonCol } from '@ionic/react';

import type { ConsentFlowContract } from '@learncard/types';
import {
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
    contractCategoryNameToCategoryMetadata,
    getBoostMetadata,
} from 'learn-card-base';

export type ConsentFlowCategorySettingOption = {
    label: string;
    description: string;
    values: {
        required: boolean;
        defaultEnabled: boolean;
    };
    type: ConsentFlowCategorySettingTypesEnum;
};

export enum ConsentFlowCategorySettingTypesEnum {
    Required = 'required',
    OptIn = 'opt-in',
    OptOut = 'opt-out',
}

const consentFlowCategorySettingOptions: ConsentFlowCategorySettingOption[] = [
    {
        label: 'Required',
        description:
            'Always enabled. The user must share this data in order to consent to the contract.',
        values: {
            required: true,
            defaultEnabled: true,
        },
        type: ConsentFlowCategorySettingTypesEnum.Required,
    },
    {
        label: 'Opt-in',
        description:
            'Disabled by default. The user can choose to enable this to share additional data.',
        values: {
            required: false,
            defaultEnabled: false,
        },
        type: ConsentFlowCategorySettingTypesEnum.OptIn,
    },
    {
        label: 'Opt-out',
        description:
            'Enabled by default. The user can choose to disable this to withhold this data.',
        values: {
            required: false,
            defaultEnabled: true,
        },
        type: ConsentFlowCategorySettingTypesEnum.OptOut,
    },
];

const AdminToolsConsentFlowCategorySettings: React.FC<{
    values: ConsentFlowContract['read']['credentials']['categories'];
    category: string;
    onChange: (categories: ConsentFlowContract['read']['credentials']['categories']) => void;
    titleOverride?: string;
}> = ({ values, category, onChange, titleOverride }) => {
    const { plural, IconWithShape } = contractCategoryNameToCategoryMetadata(category) || {};
    const inputId = React.useId();

    const value = values[category];

    const isRequired = value?.required ?? false;
    const isDefaultEnabled = isRequired || Boolean(value?.defaultEnabled);

    const [settings, setSettings] = React.useState<{
        required: boolean;
        defaultEnabled: boolean;
    }>({
        required: isRequired,
        defaultEnabled: isDefaultEnabled,
    });

    const getSelectedOption = (settingType: ConsentFlowCategorySettingTypesEnum): boolean => {
        if (settingType === ConsentFlowCategorySettingTypesEnum.Required) {
            if (settings.required && settings.defaultEnabled) {
                return true;
            }
        }

        if (settingType === ConsentFlowCategorySettingTypesEnum.OptIn) {
            if (!settings.required && !settings.defaultEnabled) {
                return true;
            }
        }

        if (settingType === ConsentFlowCategorySettingTypesEnum.OptOut) {
            if (!settings.required && settings.defaultEnabled) {
                return true;
            }
        }

        return false;
    };

    return (
        <div className="w-full flex flex-col items-center justify-center ion-padding">
            <div className="w-full flex items-center justify-start pl-4 pt-2">
                {IconWithShape && <IconWithShape className="w-6 h-6 mr-2" />}
                <h6 className="text-grayscale-900 text-lg font-poppins capitalize">
                    {titleOverride ?? plural ?? 'All'}
                </h6>
            </div>

            <IonCol size="12" className="w-full bg-white rounded-[15px] py-2 px-5">
                {consentFlowCategorySettingOptions.map((option, index) => {
                    const isSelected = getSelectedOption(option.type);

                    return (
                        <fieldset
                            className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3 last:border-b-0"
                            key={index}
                        >
                            <section className="w-full justify-between items-center flex gap-3">
                                <label
                                    htmlFor={`${inputId}-${option.type}`}
                                    className="flex flex-col flex-1 gap-1"
                                >
                                    <h6 className="text-grayscale-900 text-lg font-poppins">
                                        {option.label}
                                    </h6>
                                    <span className="text-grayscale-700 text-sm font-poppins">
                                        {option.description}
                                    </span>
                                </label>

                                <input
                                    id={`${inputId}-${option.type}`}
                                    type="radio"
                                    name={inputId}
                                    className="h-5 w-5 shrink-0 accent-emerald-600"
                                    checked={isSelected}
                                    onChange={() => {
                                        setSettings(option.values);
                                        onChange({
                                            ...values,
                                            [category]: { ...values[category], ...option.values },
                                        });
                                    }}
                                />
                            </section>
                        </fieldset>
                    );
                })}
            </IonCol>
        </div>
    );
};

export default AdminToolsConsentFlowCategorySettings;
