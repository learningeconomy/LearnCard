import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonRow, IonCol, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';
import GridIcon from 'learn-card-base/svgs/GridIcon';
import Search from 'learn-card-base/svgs/Search';
import X from 'learn-card-base/svgs/X';

export enum CredentialListTabEnum {
    Earned = 'earned',
    Managed = 'managed',
}

export const BoostPageViewMode = {
    Card: 'card',
    List: 'list',
} as const;
export type BoostPageViewModeType = (typeof BoostPageViewMode)[keyof typeof BoostPageViewMode];

type EarnedAndManagedTabsProps = {
    activeTab: CredentialListTabEnum | string;
    handleActiveTab: (selectedTab: any) => void;
    handlePlusClick?: () => void;
    className?: string;
    containerClassName?: string;
    iconColor?: string;
    dividerLineColor?: string;
    searchInputColor?: string;
    showPlusButton?: boolean;
    inverseColors?: boolean; // white text (when unselected), white background + black text for selected

    viewMode?: BoostPageViewModeType;
    setViewMode?: (viewMode: BoostPageViewModeType) => void;
    showListViewToggle?: boolean;
    viewModeToggleIconOverride?: string; // svg path to be used in img src

    isManagedAvailable?: boolean; // false -> hides earned AND managed buttons, only shows view mode toggle

    showManaged: boolean;
    hideSearch?: boolean;
    lightSearchInput?: boolean;
    showEarnedAndManaged?: boolean;
};

export const EarnedAndManagedTabs: React.FC<EarnedAndManagedTabsProps> = ({
    activeTab,
    handleActiveTab,
    handlePlusClick = () => {},
    className = '',
    containerClassName = '',
    iconColor = '',
    dividerLineColor = '',
    searchInputColor = '',
    showPlusButton,
    inverseColors,
    viewMode = BoostPageViewMode.Card,
    setViewMode,
    showListViewToggle = false,
    viewModeToggleIconOverride,
    isManagedAvailable = true,
    showManaged,
    hideSearch = false,
    lightSearchInput = false,
    showEarnedAndManaged,
}) => {
    const location = useLocation();
    const history = useHistory();

    const { searchString, isSearchActive } = credentialSearchStore.useStore();

    const handleOnChange = (tab: CredentialListTabEnum) => {
        if (tab === CredentialListTabEnum.Managed) {
            history.replace(`${location.pathname}?managed=true`);
            handleActiveTab(tab);
        } else {
            history.replace(`${location.pathname}`);
            handleActiveTab(tab);
        }
    };

    const activeLabelClassName = inverseColors ? 'text-sp-gray-900' : 'text-grayscale-900';
    const inactiveLabelClassName = inverseColors ? 'text-white' : 'text-white';

    let showEarnedManaged = isManagedAvailable && !isSearchActive;
    if (showEarnedAndManaged !== undefined) showEarnedManaged = showEarnedAndManaged; // override the show earned and managed behavior

    return (
        <IonRow
            className={`relative pt-[5px] px-[5px] flex gap-[10px] w-full items-center justify-center max-w-[700px] mx-auto ${containerClassName}`}
        >
            <IonCol className="flex items-center justify-center w-fit p-0 shrink">
                {!hideSearch && (
                    <div
                        className={`flex shrink-0 min-h-[40px] mr-[3px]  ${
                            isSearchActive
                                ? 'grow w-[calc(100%-92px)] transition-[width] duration-300 ease-in-out'
                                : 'w-[40px]'
                        } ${!showManaged && !isSearchActive ? 'top-[3px] left-0' : 'relative'} ${
                            showEarnedAndManaged === false && !isSearchActive ? 'w-full' : ''
                        }`}
                    >
                        <button
                            onClick={() => credentialSearchStore.set.toggleIsSearchActive()}
                            className={`bg-white mr-[6px] shrink-0 flex items-center justify-center w-[40px] h-[40px] rounded-full shadow-bottom-2-3 left-[2px] top-[2px] z-10 ${iconColor} ${
                                isSearchActive
                                    ? 'absolute left-[0px] top-[0px] w-[40px] h-[40px]'
                                    : 'normal'
                            }`}
                        >
                            <Search className="h-[20px] w-[20px]" />
                        </button>
                        {isSearchActive && (
                            <>
                                <input
                                    type="text"
                                    value={searchString}
                                    onChange={e =>
                                        credentialSearchStore.set.searchStringWithMatch(
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Browse ${
                                        activeTab === CredentialListTabEnum.Earned
                                            ? 'earned'
                                            : 'managed'
                                    }...`}
                                    className={`rounded-[40px] w-full h-[44px] pl-[50px] pr-[34px] font-notoSans text-[14px] outline-none placeholder-opacity-100 ${
                                        lightSearchInput
                                            ? 'bg-white bg-opacity-25 text-grayscale-900 placeholder-grayscale-900'
                                            : 'bg-black bg-opacity-25 text-white placeholder-white'
                                    }`}
                                    autoFocus
                                />
                                {searchString && (
                                    <button
                                        className="absolute right-[10px] top-[12px]"
                                        onClick={() =>
                                            credentialSearchStore.set.searchStringWithMatch('')
                                        }
                                    >
                                        <X className="h-[20px] w-[20px] text-white" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
                {showEarnedManaged && (
                    <IonSegment
                        onIonChange={e => {
                            const value = e.detail.value as CredentialListTabEnum;
                            if (Object.values(CredentialListTabEnum).includes(value)) {
                                handleOnChange(value);
                            }
                        }}
                        value={activeTab}
                        className={`w-full py-[2px] pl-[0px] pr-[10px] h-fit overflow-hidden fix-ripple flex items-center grow mx-0 ${
                            inverseColors ? 'inverse-colors' : ''
                        } ${showListViewToggle ? 'rounded-l-full' : ' rounded-full'} ${
                            !showManaged ? 'max-w-[150px]' : ''
                        } ${className} bg-white bg-opacity-25`}
                    >
                        <IonSegmentButton
                            mode="ios"
                            value={CredentialListTabEnum.Earned}
                            className="py-[12px] flex-1 rounded-full h-fit"
                        >
                            <IonLabel
                                className={`font-[700] text-center font-poppins text-[14px] h-[17px] flex items-center ${
                                    activeTab === CredentialListTabEnum.Earned
                                        ? activeLabelClassName
                                        : inactiveLabelClassName
                                }`}
                            >
                                Earned
                            </IonLabel>
                        </IonSegmentButton>
                        {showManaged && (
                            <IonSegmentButton
                                mode="ios"
                                value={CredentialListTabEnum.Managed}
                                className="py-[12px] flex-1 h-fit rounded-full"
                            >
                                <IonLabel
                                    className={`font-[700] text-center font-poppins text-[14px] h-[17px] flex items-center ${
                                        activeTab === CredentialListTabEnum.Managed
                                            ? activeLabelClassName
                                            : inactiveLabelClassName
                                    }`}
                                >
                                    Managed
                                </IonLabel>
                            </IonSegmentButton>
                        )}
                    </IonSegment>
                )}
                {showListViewToggle && setViewMode && (
                    <div
                        className={`rounded-r-full fix-ripple flex w-fit items-center pr-[5px] py-[4.5px] shrink-0 ${
                            !showEarnedManaged ? 'rounded-l-full pl-[5px] mx-auto min-w-[82px]' : ''
                        } ${className} bg-white bg-opacity-25`}
                    >
                        {showEarnedManaged && (
                            <div className={`bg-${dividerLineColor} w-[1px] h-[36px] mr-[10px]`} />
                        )}
                        <button
                            className={`rounded-full py-[8px] px-[8px] shrink-0 ${
                                viewMode === BoostPageViewMode.Card
                                    ? `bg-white ${iconColor}`
                                    : 'text-white'
                            } ${
                                viewMode === BoostPageViewMode.List && !inverseColors
                                    ? 'text-black'
                                    : ''
                            }`}
                            onClick={() => setViewMode(BoostPageViewMode.Card)}
                        >
                            {viewModeToggleIconOverride && (
                                <img
                                    src={viewModeToggleIconOverride}
                                    className="w-[20px] h-[20px]"
                                />
                            )}
                            {!viewModeToggleIconOverride && <GridIcon />}
                        </button>
                        <button
                            className={`rounded-full py-[8px] px-[8px] shrink-0 ${
                                viewMode === BoostPageViewMode.List
                                    ? `bg-white ${iconColor}`
                                    : 'text-white'
                            } ${
                                viewMode === BoostPageViewMode.Card && !inverseColors
                                    ? 'text-black'
                                    : ''
                            }`}
                            onClick={() => setViewMode(BoostPageViewMode.List)}
                        >
                            <ListItemsIcon />
                        </button>
                    </div>
                )}
            </IonCol>
        </IonRow>
    );
};

export default EarnedAndManagedTabs;
