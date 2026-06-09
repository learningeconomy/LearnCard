import React, { useState } from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import { ConsentFlowContractDetails } from '@learncard/types';
import { contractCategoryNameToCategoryMetadata, CredentialCategoryEnum } from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';
import { CONTRACT_CATEGORIES } from 'apps/learn-card-app/src/helpers/contract.helpers';

export const AdminToolsConsentFlowCategoryPickerModal: React.FC<{
    selectedCategories: Record<
        CredentialCategoryEnum,
        { required?: boolean; defaultEnabled?: boolean }
    >;
    setContract: SetState<ConsentFlowContractDetails>;
    mode: 'read' | 'write';
    allowedCategories?: CredentialCategoryEnum[];
}> = ({ selectedCategories, setContract, mode, allowedCategories }) => {
    const [_selectedCategories, setSelectedCategories] = useState(Object.keys(selectedCategories));
    const categoryList = allowedCategories ?? CONTRACT_CATEGORIES;

    const handleSetCategory = (category: CredentialCategoryEnum) => {
        setContract(prevState => {
            return {
                ...prevState,
                contract: {
                    ...prevState.contract,
                    [mode]: {
                        ...prevState.contract[mode],
                        credentials: {
                            ...prevState.contract[mode].credentials,
                            categories: {
                                ...prevState.contract[mode].credentials.categories,
                                [category]: {
                                    required: false,
                                    defaultEnabled: true,
                                },
                            },
                        },
                    },
                },
            };
        });
        setSelectedCategories(prevState => [...prevState, category]);
    };

    const handleRemoveCategory = (category: CredentialCategoryEnum) => {
        setContract(prevState => {
            const newCategories = { ...prevState.contract[mode].credentials.categories };
            delete newCategories[category];

            return {
                ...prevState,
                contract: {
                    ...prevState.contract,
                    [mode]: {
                        ...prevState.contract[mode],
                        credentials: {
                            ...prevState.contract[mode].credentials,
                            categories: newCategories,
                        },
                    },
                },
            };
        });
        setSelectedCategories(prevState => prevState.filter(c => c !== category));
    };

    return (
        <div className="flex flex-col items-center gap-[10px] w-full py-4 px-2">
            {categoryList.map(category => {
                const metadata = contractCategoryNameToCategoryMetadata(category);
                const title = metadata?.title ?? category;
                const IconWithShape = metadata?.IconWithShape;

                const isActive = _selectedCategories.includes(category);

                return (
                    <button
                        key={category}
                        className="flex items-center justify-between bg-white text-black px-[18px] py-[6px] font-poppins text-lg font-normal text-center w-full mb-4"
                        onClick={e => {
                            e.stopPropagation();
                            if (!isActive) {
                                handleSetCategory(category);
                                return;
                            } else {
                                handleRemoveCategory(category);
                                return;
                            }
                        }}
                    >
                        {IconWithShape ? (
                            <IconWithShape className="h-[40px] w-[40px]" />
                        ) : (
                            <div className="h-[40px] w-[40px] rounded-full bg-grayscale-200" />
                        )}
                        <p className="text-[17px] text-grayscale-800 flex-1">{title}</p>
                        <div
                            className={`flex items-center justify-center rounded-full transition-colors h-[40px] w-[40px] min-h-[40px] min-w-[40px] overflow-hidden ${
                                isActive ? 'bg-emerald-700' : 'bg-grayscale-200'
                            }`}
                        >
                            {isActive && <Checkmark className="w-[30px] h-[30px] text-white" />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default AdminToolsConsentFlowCategoryPickerModal;
