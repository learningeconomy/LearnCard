import React, { useState } from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import {
    BoostUserTypeEnum,
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../../../components/boost/boost-options/boostOptions';
import { ConsentFlowContractDetails } from '@learncard/types';

export const AdminToolsConsentFlowCategoryPickerModal: React.FC<{
    selectedCategories: Record<string, { required?: boolean; defaultEnabled?: boolean }>;
    setContract: React.Dispatch<React.SetStateAction<ConsentFlowContractDetails>>;
    mode: 'read' | 'write';
}> = ({ selectedCategories, setContract, mode }) => {
    const [_selectedCategories, setSelectedCategories] = useState(Object.keys(selectedCategories));

    const getSingular = (word: string) => {
        if (word.endsWith('ies')) {
            return word.slice(0, -3) + 'y';
        } else if (word.endsWith('s')) {
            return word.slice(0, -1);
        }
        return word;
    };

    const boostDropdownCategoryOptions = boostVCTypeOptions[BoostUserTypeEnum.someone];

    const handleSetCategory = (category: BoostCategoryOptionsEnum) => {
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

    const handleRemoveCategory = (category: BoostCategoryOptionsEnum) => {
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
            {boostDropdownCategoryOptions.map(category => {
                const { type } = category;
                const { title, IconWithShape } = boostCategoryOptions[type];

                const isActive = _selectedCategories.includes(type);

                if (type === BoostCategoryOptionsEnum.all) return null;

                return (
                    <button
                        key={type}
                        className="flex items-center justify-between bg-white text-black px-[18px] py-[6px] font-poppins text-lg font-normal text-center w-full mb-4"
                        onClick={e => {
                            e.stopPropagation();
                            if (!isActive) {
                                handleSetCategory(type as unknown as BoostCategoryOptionsEnum);
                                return;
                            } else {
                                handleRemoveCategory(type as unknown as BoostCategoryOptionsEnum);
                                return;
                            }
                        }}
                    >
                        <IconWithShape className="h-[40px] w-[40px]" />
                        <p className="text-[17px] text-grayscale-800 flex-1">
                            {getSingular(title)}
                        </p>
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
