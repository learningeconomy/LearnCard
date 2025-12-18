import React from 'react';
import {
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
    boostCategoryMetadata,
    useModal,
} from 'learn-card-base';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import { boostVCTypeOptions } from '../../../../components/boost/boost-options/boostOptions';
import { SetState } from 'packages/shared-types/dist';

export const BulkParentSelectorCategoryFilter: React.FC<{
    activeCategory?: BoostCategoryOptionsEnum;
    setActiveCategory?: SetState<BoostCategoryOptionsEnum>;
}> = ({ activeCategory, setActiveCategory }) => {
    const { closeModal } = useModal();

    const getSingular = (word: string) => {
        if (word.endsWith('ies')) {
            return word.slice(0, -3) + 'y';
        } else if (word.endsWith('s')) {
            return word.slice(0, -1);
        }
        return word;
    };

    const boostDropdownCategoryOptions = boostVCTypeOptions[BoostUserTypeEnum.someone].map(
        option => option.type
    );

    return (
        <div className="flex flex-col items-center gap-[10px] w-full py-4 px-2">
            {boostDropdownCategoryOptions.map(category => {
                const { title, IconWithShape } = boostCategoryMetadata[category];

                const isActive = activeCategory === category;

                return (
                    <button
                        key={category}
                        className="flex items-center justify-between bg-white text-black px-[18px] py-[6px] font-poppins text-lg font-normal text-center w-full mb-4"
                        onClick={e => {
                            e.stopPropagation();
                            setActiveCategory?.(category);
                            closeModal();
                        }}
                    >
                        <IconWithShape className="h-[40px] w-[40px]" />
                        <p>{getSingular(title)}</p>
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

export default BulkParentSelectorCategoryFilter;
