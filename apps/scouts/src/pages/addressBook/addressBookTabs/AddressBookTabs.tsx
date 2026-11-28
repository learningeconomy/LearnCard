import React from 'react';

import Search from 'learn-card-base/svgs/Search';
import { AddressBookTabsEnum } from '../addressBookHelpers';
import * as m from '../../../paraglide/messages.js';
import { AppInput, type AppInputHandle } from 'learn-card-base/ui/controls/AppInput';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const AddressBookTabs: React.FC<{
    activeTab: AddressBookTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<AddressBookTabsEnum>>;
    connectionCount: number;
    search: string;
    clearSearch: () => void;
    handleSearch?: (value: string) => void;
    searchInputRef: React.MutableRefObject<AppInputHandle | null>;
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
    return (
        <>
            {search?.length === 0 && (
                <AppRow className="w-full max-w-[600px] px-3 pt-[10px]">
                    <AppCol className="flex w-full items-center justify-start">
                        <button
                            onClick={() => {
                                setActiveTab(AddressBookTabsEnum.Connections);
                                clearSearch();
                            }}
                            className={`text-grayscale-600 pr-4 z-10 pl-[15px] py-[5px] ${
                                activeTab === AddressBookTabsEnum.Connections
                                    ? 'font-semibold text-indigo-600 rounded-[50px] border-solid border border-[rgba(99,102,241,0.4)]'
                                    : ''
                            }`}
                        >
                            {m['addressBook.contactsCount']({ count: connectionCount ?? 0 })}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab(AddressBookTabsEnum.Requests);
                                clearSearch();
                            }}
                            className={`text-grayscale-600 pr-4 subpixel-antialiased z-10 pl-[15px] py-[5px] ${
                                activeTab === AddressBookTabsEnum.Requests
                                    ? 'font-semibold text-indigo-600 rounded-[50px] border-solid border border-[rgba(99,102,241,0.4)]'
                                    : ''
                            }`}
                        >
                            {m['addressBook.requestsCount']({ count: requestCount ?? 0 })}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab(AddressBookTabsEnum.Blocked);
                            }}
                            className={`text-grayscale-600 pr-4 subpixel-antialiased z-10 pl-[15px] py-[5px] ${
                                activeTab === AddressBookTabsEnum.Blocked
                                    ? 'font-semibold text-indigo-600 rounded-[50px] border-solid border border-[rgba(99,102,241,0.4)]'
                                    : ''
                            }`}
                        >
                            {m['addressBook.blockedCount']({ count: blockedCount ?? 0 })}
                        </button>
                    </AppCol>
                </AppRow>
            )}
            <AppRow className="w-full max-w-[600px] p-2">
                <AppCol className="flex w-full items-center justify-start">
                    <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <AppInput
                        autocapitalize="on"
                        placeholder={m['common.search']()}
                        value={search}
                        className="bg-grayscale-100 text-grayscale-800 ion-padding rounded-[15px] text-base font-medium tracking-wider subpixel-antialiased pl-[40px]!"
                        onValueInput={value => handleSearch(value)}
                        debounce={500}
                        type="text"
                        clearInput
                        ref={searchInputRef}
                    />
                </AppCol>
            </AppRow>
        </>
    );
};
export default AddressBookTabs;
