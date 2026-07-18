import React from 'react';
import * as m from '../../../paraglide/messages.js';

import { IonRow, IonCol } from '@ionic/react';

import Search from 'learn-card-base/svgs/Search';
import X from 'learn-card-base/svgs/X';
import { AddressBookTabsEnum } from '../addressBookHelpers';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';
import { StyleSetEnum } from '../../../theme/styles/index';

const AddressBookTabs: React.FC<{
    activeTab: AddressBookTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<AddressBookTabsEnum>>;
    connectionCount: number;
    search: string;
    clearSearch: () => void;
    handleSearch?: (value: string) => void;
    searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
    blockedCount: number;
    requestCount: number;
}> = ({
    activeTab,
    setActiveTab,
    connectionCount,
    search,
    clearSearch,
    handleSearch,
    searchInputRef,
    blockedCount,
    requestCount,
}) => {
    const { getColorSet, getStyleSet } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);
    const styleSet = getStyleSet(StyleSetEnum.defaults);

    const borderRadius = styleSet.tabs.borderRadius;
    const primaryColor = colorSet.primaryColor;
    const primaryColorShade = colorSet.primaryColorShade;

    return (
        <>
            {search?.length === 0 && (
                <IonRow class="w-full max-w-[600px] px-3 pt-[10px]">
                    <IonCol className="flex w-full items-center justify-start">
                        <button
                            onClick={() => {
                                setActiveTab(AddressBookTabsEnum.Connections);
                                clearSearch();
                            }}
                            className={` pr-4 z-10 pl-[15px] py-[5px] ${
                                activeTab === AddressBookTabsEnum.Connections
                                    ? `font-semibold text-${primaryColor} ${borderRadius} border-solid border-[1px] border-${primaryColorShade}`
                                    : 'text-grayscale-600'
                            }`}
                        >
                            {connectionCount ?? 0} Contact{connectionCount !== 1 ? 's' : ''}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab(AddressBookTabsEnum.Requests);
                                clearSearch();
                            }}
                            className={` pr-4 subpixel-antialiased z-10 pl-[15px] py-[5px] ${
                                activeTab === AddressBookTabsEnum.Requests
                                    ? `font-semibold text-${primaryColor} ${borderRadius} border-solid border-[1px] border-${primaryColorShade}`
                                    : 'text-grayscale-600'
                            }`}
                        >
                            {requestCount ?? 0} Request{requestCount !== 1 ? 's' : ''}
                        </button>
                        {blockedCount > 0 && (
                            <button
                                onClick={() => {
                                    setActiveTab(AddressBookTabsEnum.Blocked);
                                }}
                                className={` pr-4 subpixel-antialiased z-10 pl-[15px] py-[5px] ${
                                    activeTab === AddressBookTabsEnum.Blocked
                                        ? `font-semibold text-${primaryColor} ${borderRadius} border-solid border-[1px] border-${primaryColorShade}`
                                        : 'text-grayscale-600'
                                }`}
                            >
                                {blockedCount ?? 0} Blocked
                            </button>
                        )}
                    </IonCol>
                </IonRow>
            )}
            <IonRow className="w-full max-w-[600px] p-2">
                <IonCol className="p-0">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-grayscale-400 pointer-events-none" />
                        <input
                            autoCapitalize="on"
                            placeholder={m['common.search']()}
                            value={search}
                            onChange={e => handleSearch?.(e.target.value)}
                            ref={searchInputRef}
                            type="text"
                            className="w-full py-3 pl-12 pr-11 rounded-2xl text-base text-grayscale-900 placeholder:text-grayscale-400 bg-grayscale-100 border border-transparent focus:outline-none focus:bg-white focus:border-grayscale-200 focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        />
                        {search?.length > 0 && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Clear search"
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </IonCol>
            </IonRow>
        </>
    );
};
export default AddressBookTabs;
