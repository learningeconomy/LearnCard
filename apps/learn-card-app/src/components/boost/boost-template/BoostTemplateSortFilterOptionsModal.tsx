import React, { useState } from 'react';
import { useModal } from 'learn-card-base';
import { Checkmark } from '@learncard/react';
import {
    BOOST_TEMPLATE_FILTER_OPTIONS,
    BOOST_TEMPLATE_SORT_OPTIONS,
    BoostTemplateFilterOptionsEnum,
    BoostTemplateSortOptionsEnum,
} from './boostTemplateSearch.helpers';
import type { SetState } from '@learncard/helpers';

import useTheme from '../../../theme/hooks/useTheme';

type BoostTemplateSortFilterOptionsModalProps = {
    filterBy: BoostTemplateFilterOptionsEnum;
    setFilterBy: SetState<BoostTemplateFilterOptionsEnum>;
    sortBy: BoostTemplateSortOptionsEnum;
    setSortBy: SetState<BoostTemplateSortOptionsEnum>;
};

const BoostTemplateSortFilterOptionsModal: React.FC<BoostTemplateSortFilterOptionsModalProps> = ({
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { closeModal } = useModal();

    const [_filterBy, _setFilterBy] = useState<BoostTemplateFilterOptionsEnum>(filterBy);
    const [_sortBy, _setSortBy] = useState<BoostTemplateSortOptionsEnum>(sortBy);

    const handleSetState = () => {
        setFilterBy(_filterBy);
        setSortBy(_sortBy);
        closeModal();
    };

    return (
        <>
            <div className="bg-white p-[20px] rounded-[20px] text-grayscale-900 font-notoSans flex flex-col gap-[10px]">
                {/* <div className="flex flex-col">
                    {BOOST_TEMPLATE_SORT_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            className={`w-full p-[10px] rounded-[15px] flex items-center gap-[10px] ${
                                _sortBy === option.type
                                    ? 'bg-grayscale-200'
                                    : 'hover:bg-grayscale-100'
                            }`}
                            onClick={() => _setSortBy(option.type)}
                        >
                            {_sortBy === option.type ? (
                                <Checkmark className="text-grayscale-700 h-[30px] w-[30px]" />
                            ) : (
                                <div className="w-[30px] h-[30px]" />
                            )}
                            <span className="font-notoSans text-[17px]">{option.title}</span>
                        </button>
                    ))}
                </div> */}

                {/* <div className="w-full flex items-center justify-center my-1">
                    <div className="w-[90%] h-[1px] bg-grayscale-200" />
                </div> */}

                <div className="space-y-2">
                    {BOOST_TEMPLATE_FILTER_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            className={`w-full p-[10px] rounded-[15px] flex items-center gap-[10px] ${
                                _filterBy === option.type
                                    ? 'bg-grayscale-200'
                                    : 'hover:bg-grayscale-100'
                            }`}
                            onClick={() => _setFilterBy(option.type)}
                        >
                            {_filterBy === option.type ? (
                                <Checkmark className="text-grayscale-700 h-[30px] w-[30px]" />
                            ) : (
                                <div className="w-[30px] h-[30px]" />
                            )}
                            <span className="font-notoSans text-[17px]">{option.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleSetState}
                type="button"
                className={`shrink-0 w-full py-[10px] font-poppins flex items-center justify-center text-[17px] bg-${primaryColor} rounded-[30px] text-white font-[600] leading-[130%] tracking-[-0.25px] disabled:opacity-60 mt-[10px] shadow-bottom-4-4`}
                disabled={_filterBy === filterBy && _sortBy === sortBy}
            >
                Set
            </button>
        </>
    );
};

export default BoostTemplateSortFilterOptionsModal;
