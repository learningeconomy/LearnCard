import React from 'react';

import { useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Checkmark } from '@learncard/react';
import SortIcon from 'learn-card-base/svgs/SortButton';
import BoostTemplateSortFilterOptionsModal from './BoostTemplateSortFilterOptionsModal';

import {
    BOOST_TEMPLATE_FILTER_OPTIONS,
    BOOST_TEMPLATE_SORT_OPTIONS,
    BoostTemplateFilterOptionsEnum,
    BoostTemplateSortOptionsEnum,
} from './boostTemplateSearch.helpers';
import type { SetState } from '@learncard/helpers';

type BoostTemplateSortAndFilterButtonProps = {
    filterBy: BoostTemplateFilterOptionsEnum;
    setFilterBy: SetState<BoostTemplateFilterOptionsEnum>;
    sortBy: BoostTemplateSortOptionsEnum;
    setSortBy: SetState<BoostTemplateSortOptionsEnum>;
};

import useTheme from '../../../theme/hooks/useTheme';

const BoostTemplateSortAndFilterButton: React.FC<BoostTemplateSortAndFilterButtonProps> = ({
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth(true);

    const openSortFilterModal = () => {
        newModal(
            <BoostTemplateSortFilterOptionsModal
                filterBy={filterBy}
                setFilterBy={setFilterBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !overflow-visible',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    // On mobile, show a simple button that opens the modal
    if (isMobile) {
        return (
            <button
                onClick={openSortFilterModal}
                className="bg-white flex items-center justify-center p-[15px] rounded-[15px]"
            >
                <SortIcon className="h-[24px] w-[24px] text-grayscale-900" />
            </button>
        );
    }

    // On desktop, show the Headless UI dropdown
    return (
        <Menu>
            <MenuButton className="bg-white flex items-center justify-center p-[15px] rounded-[15px]">
                {({ open }) => (
                    <SortIcon
                        className={`h-[24px] w-[24px] ${
                            open ? `text-${primaryColor}` : 'text-grayscale-900'
                        }`}
                    />
                )}
            </MenuButton>
            <MenuItems
                anchor="bottom start"
                className="bg-grayscale-50 rounded-[20px] shadow-bottom-2-4 p-[20px] text-grayscale-900 my-[10px]"
            >
                {/* BOOST_TEMPLATE_SORT_OPTIONS.map(option => (
                    <MenuItem key={option.id}>
                        {({ active }) => (
                            <button
                                className={`font-notoSans text-[17px] flex items-center w-full p-[10px] rounded-[15px] ${
                                    option.type === sortBy ? 'bg-grayscale-200' : ''
                                } ${active ? 'bg-blue-50' : ''}`}
                                onClick={() => setSortBy(option.type)}
                            >
                                {option.type === sortBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                {option.title}
                            </button>
                        )}
                    </MenuItem>
                )) */}
                {/* <div className="w-full flex items-center justify-center my-1">
                    <div className="w-[90%] h-[1px] bg-grayscale-100" />
                </div> */}
                {BOOST_TEMPLATE_FILTER_OPTIONS.map(option => (
                    <MenuItem key={option.id}>
                        {({ active }) => (
                            <button
                                className={`font-notoSans text-[17px] flex items-center w-full p-[10px] rounded-[15px] ${
                                    option.type === filterBy ? 'bg-grayscale-200' : ''
                                } ${active ? 'bg-blue-50' : ''}`}
                                onClick={() => setFilterBy(option.type)}
                            >
                                {option.type === filterBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                {option.title}
                            </button>
                        )}
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
};

export default BoostTemplateSortAndFilterButton;
