import { tailwindColorWithOpacity } from 'learn-card-base/helpers/colorHelpers';
import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';
import GridIcon from 'learn-card-base/svgs/GridIcon';
import Search from 'learn-card-base/svgs/Search';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';
import X from 'learn-card-base/svgs/X';

import useTheme from '../../theme/hooks/useTheme';
import { CredentialCategoryEnum } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';

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
    handleActiveTab: (selectedTab: CredentialListTabEnum) => void;
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
    hideSearch = false,
    showEarnedAndManaged,
    category,
}) => {
    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category ?? CredentialCategoryEnum.achievement);

    const location = useLocation();
    const history = useHistory();

    const { searchString, isSearchActive } = credentialSearchStore.useStore();
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isSearchActive) searchInputRef.current?.focus();
    }, [isSearchActive]);

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
        <AppRow
            className={`relative pt-[50px] px-[5px] flex gap-[10px] w-full items-center justify-center max-w-[600px] mx-auto ${containerClassName}`}
        >
            <AppCol className="flex flex-wrap items-center justify-between gap-y-2 w-full p-0 min-w-0">
                {!isSearchActive && (
                    <div
                        className="flex shrink-0 sm:pl-6"
                        role="tablist"
                        aria-label={`${m['boost.earnedTab']()} / ${m['boost.managedTab']()}`}
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === CredentialListTabEnum.Earned}
                            onClick={() => handleOnChange(CredentialListTabEnum.Earned)}
                            className={`py-[8px] px-2 sm:px-[16px] rounded-[5px] text-sm sm:text-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                activeTab === CredentialListTabEnum.Earned
                                    ? `${activeLabelClassName} ${tabColor}`
                                    : inactiveLabelClassName
                            }`}
                        >
                            {m['boost.earnedTab']()}
                        </button>
                        {showEarnedManaged && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === CredentialListTabEnum.Managed}
                                onClick={() => handleOnChange(CredentialListTabEnum.Managed)}
                                className={`py-[8px] px-2 sm:px-[16px] rounded-[5px] text-sm sm:text-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                    activeTab === CredentialListTabEnum.Managed
                                        ? `${activeLabelClassName} ${tabColor}`
                                        : inactiveLabelClassName
                                }`}
                            >
                                {m['boost.managedTab']()}
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={`flex items-center ${isSearchActive ? 'flex-1 px-2 min-w-0' : 'shrink-0 ml-auto'}`}
                >
                    {!hideSearch && isSearchActive && (
                        <div className="flex flex-1 shrink-0 min-h-[40px] min-w-0 relative transition-[width] duration-300 ease-in-out">
                            <div className="flex-1 relative min-w-0">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    aria-label={m['wallet.search']()}
                                    value={searchString}
                                    onChange={e =>
                                        credentialSearchStore.set.searchString(e.target.value)
                                    }
                                    placeholder={
                                        activeTab === CredentialListTabEnum.Earned
                                            ? m['boost.browseEarnedPlaceholder']()
                                            : m['boost.browseManagedPlaceholder']()
                                    }
                                    className="rounded-[10px] px-4 w-full h-[44px] bg-white font-notoSans text-[14px] text-grayscale-900 outline-hidden placeholder:text-grayscale-700 placeholder:opacity-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${tailwindColorWithOpacity(tabColor, 100) ?? 'white'} 50%, white)`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Reuse hideSearch to hide toggle when there is nothing to display in the current tab */}
                    {showListViewToggle && setViewMode && !isSearchActive && !hideSearch && (
                        <div
                            role="group"
                            aria-label={m['wallet.viewMode']()}
                            className={`fix-ripple p-1 rounded-[5px] flex w-fit items-center ${
                                !showEarnedManaged ? 'mx-auto min-w-[82px]' : ''
                            } ${className}`}
                            style={{ backgroundColor: tailwindColorWithOpacity(tabColor, 25) }}
                        >
                            <button
                                type="button"
                                aria-label={m['wallet.gridView']()}
                                aria-pressed={viewMode === BoostPageViewMode.Card}
                                className={`py-[8px] rounded-[5px] px-[8px] shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                    viewMode === BoostPageViewMode.Card
                                        ? `bg-white ${activeLabelClassName}`
                                        : `${inactiveLabelClassName}`
                                }`}
                                onClick={() => setViewMode(BoostPageViewMode.Card)}
                            >
                                {viewModeToggleIconOverride && (
                                    <img
                                        src={viewModeToggleIconOverride}
                                        alt=""
                                        className="w-[20px] h-[20px]"
                                    />
                                )}
                                {!viewModeToggleIconOverride && <GridIcon />}
                            </button>
                            <button
                                type="button"
                                aria-label={m['wallet.listView']()}
                                aria-pressed={viewMode === BoostPageViewMode.List}
                                className={`py-[8px] rounded-[5px] px-[8px] shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
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
                            type="button"
                            aria-label={m['common.close']()}
                            onClick={() => credentialSearchStore.set.toggleIsSearchActive()}
                            className="flex items-center justify-center w-[40px] h-[40px] rounded-full z-10 text-grayscale-900 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <X className="h-[20px] w-[20px]" />
                        </button>
                    )}
                    {!isSearchActive && !hideSearch && (
                        <button
                            type="button"
                            aria-label={m['common.search']()}
                            onClick={() => credentialSearchStore.set.toggleIsSearchActive()}
                            className="flex items-center justify-center w-[40px] h-[40px] rounded-full z-10 text-grayscale-900 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <Search className="h-[20px] w-[20px]" />
                        </button>
                    )}
                </div>
            </AppCol>
        </AppRow>
    );
};

export default EarnedAndManagedTabs;
