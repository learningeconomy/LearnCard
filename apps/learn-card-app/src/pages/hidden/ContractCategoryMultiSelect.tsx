import React from 'react';
import { produce } from 'immer';

import Settings from 'learn-card-base/svgs/Settings';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';
import AdminToolsConsentFlowCategoryPickerModal from '../adminToolsPage/AdminToolsConsentFlow/AdminToolsConsentFlowCategoryPickerModal';
import AdminToolsConsentFlowCategorySettings from '../adminToolsPage/AdminToolsConsentFlow/AdminToolsConsentFlowCategorySettings';

import {
    useModal,
    ModalTypes,
    CredentialCategoryEnum,
    contractCategoryNameToCategoryMetadata,
} from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';
import { SetState } from 'packages/shared-types/dist';
import {
    CONTRACT_CATEGORIES,
    isVerifiableDataContractCategory,
} from '../../helpers/contract.helpers';

type ContractCategoryMultiSelectProps = {
    values: Record<CredentialCategoryEnum, { required?: boolean; defaultEnabled?: boolean }>;
    onChange: (
        value: Record<CredentialCategoryEnum, { required?: boolean; defaultEnabled?: boolean }>
    ) => void;
    label?: string;
    className?: string;
    setContract?: SetState<ConsentFlowContractDetails>;
    mode?: 'read' | 'write';
    hideVerifiableDataOnWrite?: boolean;
    categoryTitleOverrides?: Partial<Record<CredentialCategoryEnum, string>>;
};

const ContractCategoryMultiSelect: React.FC<ContractCategoryMultiSelectProps> = ({
    values,
    onChange,
    label = '',
    className = '',
    setContract = () => {},
    mode = 'read',
    hideVerifiableDataOnWrite = false,
    categoryTitleOverrides = {},
}) => {
    const { newModal } = useModal();

    const shouldHideVerifiableDataCategories = mode === 'write' && hideVerifiableDataOnWrite;
    const selectedCategories = Object.keys(values) as CredentialCategoryEnum[];

    const visibleCategories = selectedCategories.filter(category => {
        if (shouldHideVerifiableDataCategories && isVerifiableDataContractCategory(category)) {
            return false;
        }

        return true;
    });

    const allowedCategories = CONTRACT_CATEGORIES.filter(category => {
        if (shouldHideVerifiableDataCategories && isVerifiableDataContractCategory(category)) {
            return false;
        }

        return true;
    }) as CredentialCategoryEnum[];

    React.useEffect(() => {
        if (!shouldHideVerifiableDataCategories) return;

        const hiddenCategories = selectedCategories.filter(category =>
            isVerifiableDataContractCategory(category)
        );

        if (hiddenCategories.length === 0) return;

        onChange(
            produce(values, draft => {
                hiddenCategories.forEach(category => {
                    delete draft[category as CredentialCategoryEnum];
                });
            })
        );
    }, [onChange, selectedCategories, shouldHideVerifiableDataCategories, values]);

    const handleOpenCategoryPickerModal = () => {
        newModal(
            <AdminToolsConsentFlowCategoryPickerModal
                selectedCategories={values}
                setContract={setContract}
                mode={mode}
                allowedCategories={allowedCategories}
                titleOverrides={categoryTitleOverrides}
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
                titleOverride={categoryTitleOverrides[category as CredentialCategoryEnum]}
            />,
            {
                sectionClassName: '!max-w-[500px]',
            },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const inputs = visibleCategories.map((category, index) => {
        const metadata = contractCategoryNameToCategoryMetadata(category);
        const { title, IconWithShape } = metadata || {};
        const displayTitle = categoryTitleOverrides[category as CredentialCategoryEnum] ?? title;

        const settings = values[category];

        const settingsDisplayText = settings.required
            ? 'Required'
            : settings.defaultEnabled
            ? 'Opt-out'
            : 'Opt-in';

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
                    {displayTitle}
                    <span className="ml-2 text-xs bg-emerald-700 text-white px-2 py-1 rounded-full">
                        {settingsDisplayText}
                    </span>
                </p>

                <div className="flex flex-1 items-center gap-2">
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

                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            handleOpenCategorySettings(category);
                        }}
                    >
                        <Settings className="w-[24px] h-[24px]" />
                    </button>
                </div>
            </div>
        );
    });

    return (
        <section className={`flex flex-col gap-[8px] ${className}`}>
            <p>{label}</p>
            {inputs.length > 0 && <ul className="w-full flex flex-col gap-2">{inputs}</ul>}
            <button
                onClick={() => handleOpenCategoryPickerModal()}
                className="w-full rounded-full pl-1 pr-4 flex items-center justify-between border-[1px] border-solid border-grayscale-300 py-1"
                type="button"
            >
                <div className="flex items-center justify-start w-full">
                    <BulkImportWithPlusIcon className="mr-2 h-[40px] w-[40px]" />
                    <div className="flex flex-col items-start justify-center">
                        <p className="text-xs text-emerald-700 font-semibold">Select Category</p>
                    </div>
                </div>
            </button>
        </section>
    );
};

export default ContractCategoryMultiSelect;
