import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';
import GridIcon from 'learn-card-base/svgs/GridIcon';
import Search from 'learn-card-base/svgs/Search';
import { IonRow, IonCol } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import useTheme from '../../theme/hooks/useTheme';
import { CredentialCategoryEnum } from 'learn-card-base';

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
    className?: string;
    containerClassName?: string;

    viewMode?: BoostPageViewModeType;
    setViewMode?: (viewMode: BoostPageViewModeType) => void;
    showListViewToggle?: boolean;
    viewModeToggleIconOverride?: string; // svg path to be used in img src

    isManagedAvailable?: boolean; // false -> hides earned AND managed buttons, only shows view mode toggle

    showManaged: boolean;
    hideSearch?: boolean;
    lightSearchInput?: boolean;
    showEarnedAndManaged?: boolean;
    category?: CredentialCategoryEnum;
};

export const EarnedAndManagedTabs: React.FC<EarnedAndManagedTabsProps> = ({
    activeTab,
    handleActiveTab,
    className = '',
    containerClassName = '',
    viewMode = BoostPageViewMode.Card,
    setViewMode,
    showListViewToggle = false,
    viewModeToggleIconOverride,
    isManagedAvailable = false,
    showManaged,
    hideSearch = false,
    showEarnedAndManaged,
    category,
}) => {
    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category ?? CredentialCategoryEnum.achievement);

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

    const tabColor = colors?.tabActiveColor;

    const activeLabelClassName = `text-grayscale-900`;
    const inactiveLabelClassName = 'text-grayscale-600';

    let showEarnedManaged = isManagedAvailable && !isSearchActive;
    if (showEarnedAndManaged !== undefined) showEarnedManaged = showEarnedAndManaged; // override the show earned and managed behavior

    return (
        <IonRow
            className={`relative pt-[50px] px-[5px] flex gap-[10px] w-full items-center justify-center max-w-[600px] mx-auto overflow-hidden ${containerClassName}`}
        >
            <IonCol className="flex items-center justify-between w-full p-0 min-w-0">
                <div className="flex pl-6">
                    {!isSearchActive && (
                        <button
                            onClick={() => handleOnChange(CredentialListTabEnum.Earned)}
                            className={`py-[8px] px-[16px] rounded-[5px] text-base ${
                                activeTab === CredentialListTabEnum.Earned
                                    ? `${activeLabelClassName} ${tabColor}`
                                    : inactiveLabelClassName
                            }`}
                        >
                            Earned
                        </button>
                    )}
                    {showEarnedManaged && (
                        <button
                            onClick={() => handleOnChange(CredentialListTabEnum.Managed)}
                            className={`py-[8px] px-[16px] rounded-[5px] text-base ${
                                activeTab === CredentialListTabEnum.Managed
                                    ? `${activeLabelClassName} ${tabColor}`
                                    : inactiveLabelClassName
                            }`}
                        >
                            Managed
                        </button>
                    )}
                </div>

                <div className={`flex items-center ${isSearchActive ? 'flex-1 px-2 min-w-0' : ''}`}>
                    {!hideSearch && (
                        <div
                            className={`flex shrink-0 min-h-[40px] relative ${
                                isSearchActive
                                    ? 'flex-1 transition-[width] duration-300 ease-in-out min-w-0'
                                    : 'w-[40px]'
                            } ${!showManaged && !isSearchActive ? 'top-[3px] left-0' : ''} ${
                                showEarnedAndManaged === false && !isSearchActive ? 'w-full' : ''
                            }`}
                        >
                            {isSearchActive && (
                                <div className="flex-1 relative min-w-0">
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
                                        className={`rounded-[10px] pl-4 w-full h-[44px] pr-[34px] font-notoSans text-[14px] outline-none placeholder:text-grayscale-900 ${tabColor}`}
                                        autoFocus
                                    />
                                    {searchString && (
                                        <button
                                            className="absolute right-[10px] top-[12px] z-10"
                                            onClick={() =>
                                                credentialSearchStore.set.searchStringWithMatch('')
                                            }
                                        >
                                            <X className="h-[20px] w-[20px] text-grayscale-900" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {showListViewToggle && setViewMode && !isSearchActive && showEarnedManaged && (
                        <div
                            className={`fix-ripple p-1 rounded-[5px] flex w-fit items-center ${
                                !showEarnedManaged ? 'mx-auto min-w-[82px]' : ''
                            } ${className} ${tabColor} bg-opacity-25`}
                        >
                            <button
                                className={`py-[8px] rounded-[5px] px-[8px] shrink-0 ${
                                    viewMode === BoostPageViewMode.Card
                                        ? `bg-white ${activeLabelClassName}`
                                        : `${inactiveLabelClassName}`
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
                                className={`py-[8px] rounded-[5px] px-[8px] shrink-0 ${
                                    viewMode === BoostPageViewMode.List
                                        ? `bg-white ${activeLabelClassName}`
                                        : `${inactiveLabelClassName}`
                                }`}
                                onClick={() => setViewMode(BoostPageViewMode.List)}
                            >
                                <ListItemsIcon />
                            </button>
                        </div>
                    )}

                    {isSearchActive && (
                        <button
                            onClick={() => credentialSearchStore.set.toggleIsSearchActive()}
                            className={`flex items-center justify-center w-[40px] h-[40px] rounded-full z-10 text-grayscale-900 shrink-0`}
                        >
                            <X className="h-[20px] w-[20px]" />
                        </button>
                    )}
                    {!isSearchActive && !hideSearch && (
                        <button
                            onClick={() => credentialSearchStore.set.toggleIsSearchActive()}
                            className={`flex items-center justify-center w-[40px] h-[40px] rounded-full z-10 text-grayscale-900 shrink-0`}
                        >
                            <Search className="h-[20px] w-[20px]" />
                        </button>
                    )}
                </div>
            </IonCol>
        </IonRow>
    );
};

export default EarnedAndManagedTabs;
