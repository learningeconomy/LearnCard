import React from 'react';

import AdminManagedBoostsSection from './AdminManagedBoostsSection';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { Boost } from '@learncard/types';

type ViewAllManagedBoostsProps = {
    actionButtonOverride?: { text: string; onClick: (boost: Boost) => void };

    selectModeOptions?: {
        selectedUris: string[];
        handleAdd: (uri: string) => void;
        handleRemove: (uri: string) => void;
        handleSave: () => void;
        handleClearAll: () => void;
    };
};

const ViewAllManagedBoosts: React.FC<ViewAllManagedBoostsProps> = ({
    actionButtonOverride,
    selectModeOptions,
}) => {
    const selectModeButtons = selectModeOptions ? (
        <div className=" gap-[10px] mx-auto w-full flex justify-center items-center">
            <button
                onClick={selectModeOptions?.handleSave}
                className="py-[5px] px-6 rounded-full bg-emerald-700 text-white text-base font-semibold shadow-box-bottom disabled:opacity-60"
            >
                Save
            </button>
            <button
                onClick={selectModeOptions?.handleClearAll}
                className="py-[5px] px-6 bg-white rounded-[20px] w-fit text-base font-semibold text-grayscale-900 shadow-box-bottom disabled:opacity-60 flex gap-[5px] items-center border-solid border-[1px] border-grayscale-200 hover:bg-grayscale-100 transition-colors"
            >
                Clear All
            </button>
        </div>
    ) : undefined;

    return (
        <section className="flex flex-col gap-[20px] w-full">
            {selectModeButtons}
            {Object.values(BoostCategoryOptionsEnum).map(category => (
                <AdminManagedBoostsSection
                    key={category}
                    category={category}
                    actionButtonOverride={actionButtonOverride}
                    selectModeOptions={selectModeOptions}
                />
            ))}
            {selectModeButtons}
        </section>
    );
};

export default ViewAllManagedBoosts;
