import React, { useState, useRef } from 'react';

import AiSessionsFilterSortingOptionsModal from './AiSessionsFilterSortingOptionsModal';
import { IonItem, IonList, IonPopover } from '@ionic/react';
import SortIcon from 'learn-card-base/svgs/SortButton';
import { Checkmark } from '@learncard/react';

import { useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';

import {
    AI_SESSIONS_FILTER_OPTIONS,
    AI_SESSIONS_SORT_OPTIONS,
    AiFilteringTypes,
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from './aiSessions-search.helpers';

export const AiSessionsPopOverButton: React.FC<{
    filterBy: AiSessionsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<AiSessionsFilterOptionsEnum>>;
    filteringType: AiFilteringTypes;
    sortBy: AiSessionsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<AiSessionsSortOptionsEnum>>;
    showFilteringOptions?: boolean;
}> = ({ filterBy, setFilterBy, filteringType, sortBy, setSortBy, showFilteringOptions }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const [showSortPopover, setShowSortPopover] = useState<boolean>(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { isMobile } = useDeviceTypeByWidth(true);

    const handleSortMenu = () => {
        if (isMobile) {
            newModal(
                <AiSessionsFilterSortingOptionsModal
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    showFilteringOptions={showFilteringOptions}
                    filteringType={filteringType}
                />,
                {
                    sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
                },
                {}
            );
        } else {
            setShowSortPopover(!showSortPopover);
        }
    };

    return (
        <>
            <button
                id={isMobile ? undefined : `trigger-button`}
                onClick={handleSortMenu}
                type="button"
                ref={isMobile ? null : buttonRef}
                className={`bg-white flex items-center justify-center p-2 rounded-[15px] mr-4 shadow-sm border-solid border-[1px] ${showSortPopover ? 'border-indigo-500' : 'border-grayscale-200'
                    }`}
            >
                <SortIcon
                    className={`h-[32px] w-[32px] ${showSortPopover ? 'text-indigo-500' : 'text-grayscale-900'
                        }`}
                />
            </button>
            <IonPopover
                onDidDismiss={() => setShowSortPopover(false)}
                reference="trigger"
                trigger="trigger-button"
                className="launchpad-popover"
            >
                <IonList>
                    {AI_SESSIONS_SORT_OPTIONS.map(option => {
                        if (filteringType === AiFilteringTypes.sessions) {
                            if (option.type === AiSessionsSortOptionsEnum.mostSessions)
                                return <React.Fragment key={option.id}></React.Fragment>;
                        }

                        return (
                            <IonItem
                                className="font-notoSans text-sm flex items-center justify-start text-left"
                                key={option.id}
                                lines="none"
                                button={true}
                                detail={false}
                                onClick={() => setSortBy(option.type)}
                            >
                                {option.type === sortBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                Sort by {option.title}
                            </IonItem>
                        );
                    })}
                    {showFilteringOptions && (
                        <div className="w-full flex items-center justify-center">
                            <div className="w-[90%] h-[1px] bg-grayscale-100 mt-2 mb-2" />
                        </div>
                    )}
                    {showFilteringOptions &&
                        AI_SESSIONS_FILTER_OPTIONS.map(option => {
                            return (
                                <IonItem
                                    className="font-notoSans text-sm flex items-center justify-start text-left"
                                    key={option.id}
                                    lines="none"
                                    button={true}
                                    detail={false}
                                    onClick={() => setFilterBy(option.type)}
                                >
                                    {option.type === filterBy ? (
                                        <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                    ) : (
                                        <div className="w-[24px] h-[24px] mr-1" />
                                    )}
                                    {option.title}
                                </IonItem>
                            );
                        })}
                </IonList>
            </IonPopover>
        </>
    );
};

export default AiSessionsPopOverButton;
