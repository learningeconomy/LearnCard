import React, { useState } from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import type { ConsentFlowContract } from '@learncard/types';
import { contractCategoryNameToCategoryMetadata } from 'learn-card-base';
import { CONTRACT_CATEGORIES } from 'apps/learn-card-app/src/helpers/contract.helpers';

export const AdminToolsConsentFlowCategoryPickerModal: React.FC<{
    selectedCategories: ConsentFlowContract['read']['credentials']['categories'];
    onChange: (categories: ConsentFlowContract['read']['credentials']['categories']) => void;
    allowedCategories?: readonly string[];
    titleOverrides?: Partial<Record<string, string>>;
}> = ({ selectedCategories, onChange, allowedCategories, titleOverrides }) => {
    const [categories, setCategories] = useState(selectedCategories);
    const _selectedCategories = Object.keys(categories);
    const categoryList = allowedCategories ?? CONTRACT_CATEGORIES;

    const handleSetCategory = (category: string) => {
        const next = { ...categories, [category]: { required: false, defaultEnabled: true } };
        setCategories(next);
        onChange(next);
    };

    const handleRemoveCategory = (category: string) => {
        const next = { ...categories };
        delete next[category];
        setCategories(next);
        onChange(next);
    };

    return (
        <div className="flex flex-col items-center gap-[10px] w-full py-4 px-2">
            {categoryList.map(category => {
                const metadata = contractCategoryNameToCategoryMetadata(category);
                const title = titleOverrides?.[category] ?? metadata?.title ?? category;
                const IconWithShape = metadata?.IconWithShape;

                const isActive = _selectedCategories.includes(category);

                return (
                    <button
                        key={category}
                        type="button"
                        aria-pressed={isActive}
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
