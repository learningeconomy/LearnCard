import React from 'react';
import { produce } from 'immer';

import { IonCheckbox } from '@ionic/react';
import Settings from 'learn-card-base/svgs/Settings';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';
import AdminToolsConsentFlowCategoryPickerModal from '../adminToolsPage/AdminToolsConsentFlow/AdminToolsConsentFlowCategoryPickerModal';
import AdminToolsConsentFlowCategorySettings from '../adminToolsPage/AdminToolsConsentFlow/AdminToolsConsentFlowCategorySettings';

import { ModalTypes, useModal } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';
import { boostCategoryOptions } from '../../components/boost/boost-options/boostOptions';

type MultiSelectInputProps = {
    values: Record<string, { required?: boolean; defaultEnabled?: boolean }>;
    options: string[];
    onChange: (value: Record<string, { required?: boolean; defaultEnabled?: boolean }>) => void;
    label?: string;
    className?: string;
    setContract?: React.Dispatch<React.SetStateAction<ConsentFlowContractDetails>>;
    mode?: 'read' | 'write';
    enableCategoryPickerModal?: boolean;
    enableCategorySettingsModal?: boolean;
};

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    values,
    options,
    onChange,
    label = '',
    className = '',
    setContract = () => {},
    mode = 'read',
    enableCategoryPickerModal = false,
    enableCategorySettingsModal = false,
}) => {
    const { newModal } = useModal();
    const usedOptions = Object.keys(values);
    const unusedOptions = options.filter(o => !usedOptions.includes(o));

    const handleOpenCategoryPickerModal = () => {
        newModal(
            <AdminToolsConsentFlowCategoryPickerModal
                selectedCategories={values}
                setContract={setContract}
                mode={mode}
            />,
            {
                sectionClassName: '!max-w-[500px]',
            },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const handleOpenCategorySettings = (category: string) => {
        newModal(
            <AdminToolsConsentFlowCategorySettings
                category={category}
                setContract={setContract}
                values={values}
                mode={mode}
            />,
            {
                sectionClassName: '!max-w-[500px]',
            },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const inputs = Object.entries(values).map(([category, value], index) => {
        const { title, IconWithShape } = boostCategoryOptions?.[category] ?? {};

        const settings = values[category];

        let settingsDisplayText = null;

        if (settings.required && settings.defaultEnabled) {
            settingsDisplayText = 'Required';
        }

        if (!settings.required && !settings.defaultEnabled) {
            settingsDisplayText = 'Opt-in';
        }

        if (!settings.required && settings.defaultEnabled) {
            settingsDisplayText = 'Opt-out';
        }

        return (
            <div
                onClick={() => handleOpenCategorySettings(category)}
                className="flex gap-2 items-center w-full border-solid border-grayscale-200 border-b-[1px] py-2 last:border-b-0 last:mb-4"
                key={index}
            >
                <p className="w-full flex items-center text-sm text-grayscale-800">
                    {' '}
                    {IconWithShape && (
                        <IconWithShape className="w-[24px] h-[24px] min-w-[24px] min-h-[24px] mr-2" />
                    )}
                    {title}
                    {enableCategorySettingsModal && (
                        <span className="ml-2 text-xs bg-emerald-700 text-white px-2 py-1 rounded-full">
                            {settingsDisplayText}
                        </span>
                    )}
                </p>

                <div className="flex flex-1 items-center gap-2">
                    {!enableCategorySettingsModal && (
                        <>
                            <label className="flex items-center gap-2 justify-end rounded-full text-xs text-grayscale-800">
                                Required
                                <IonCheckbox
                                    checked={value.required}
                                    onChange={e =>
                                        onChange(
                                            produce(values, draft => {
                                                draft[category] = {
                                                    required: e.target.checked,
                                                    defaultEnabled:
                                                        draft[category]?.defaultEnabled ?? false,
                                                };
                                            })
                                        )
                                    }
                                    className="bg-white"
                                    color="emerald-700"
                                />
                            </label>

                            <label className="flex items-center gap-2 justify-end rounded-full text-xs text-grayscale-800">
                                Default enabled
                                <IonCheckbox
                                    checked={value.defaultEnabled}
                                    onChange={e =>
                                        onChange(
                                            produce(values, draft => {
                                                draft[category] = {
                                                    required: draft[category]?.required ?? false,
                                                    defaultEnabled: e.target.checked,
                                                };
                                            })
                                        )
                                    }
                                    className="bg-white"
                                    color="emerald-700"
                                    title="When enabled, this field will be selected by default for users, even if not required"
                                />
                            </label>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onChange(
                                produce(values, draft => {
                                    delete draft[category];
                                })
                            );
                        }}
                    >
                        <TrashBin version="thin" className="w-[24px] h-[24px]" />
                    </button>

                    {enableCategorySettingsModal && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                handleOpenCategorySettings(category);
                            }}
                        >
                            <Settings className="w-[24px] h-[24px]" />
                        </button>
                    )}
                </div>
            </div>
        );
    });

    return (
        <section className={`flex flex-col gap-[8px] ${className}`}>
            <p>{label}</p>
            {inputs.length > 0 && <ul className="w-full flex flex-col gap-2">{inputs}</ul>}
            {enableCategoryPickerModal && (
                <button
                    onClick={() => handleOpenCategoryPickerModal()}
                    className="w-full rounded-full pl-1 pr-4 flex items-center justify-between border-[1px] border-solid border-grayscale-300 py-1"
                    type="button"
                >
                    <div className="flex items-center justify-start w-full">
                        <BulkImportWithPlusIcon className="mr-2 h-[40px] w-[40px]" />
                        <div className="flex flex-col items-start justify-center">
                            <p className="text-xs text-emerald-700 font-semibold">
                                Select Category
                            </p>
                        </div>
                    </div>
                </button>
            )}
            {!enableCategoryPickerModal && unusedOptions.length > 0 && (
                <select
                    className="bg-white border px-[5px]"
                    onChange={e => {
                        const selectedCategory = e.target.value;
                        onChange(
                            produce(values, draft => {
                                draft[selectedCategory] = {
                                    required: false,
                                    defaultEnabled: false,
                                };
                            })
                        );
                        e.target.value = ''; // reset this text box
                    }}
                >
                    <option value="">-- Select a Category --</option>
                    {unusedOptions.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            )}
        </section>
    );
};

export default MultiSelectInput;
