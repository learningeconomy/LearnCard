import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner, useIonToast, IonRow, IonGrid } from '@ionic/react';

import { AddressBookHeader } from './addressBook-header/AddressBookHeader';
import AddressBookContactList from './addressBook-contact-list/AddressBookContactList';
import AddressBookFooter from './addressBook-footer/AddressBookFooter';

import { AddressBookTabsEnum } from './addressBookHelpers';
import AddressBookConnections from './addressBookConnections/AddressBookConnections';
import AddressBookPendingConnections from './addressBookPendingConnections/AddressBookPendingConnections';
import AddressBookConnectionRequests from './addressBookConnectionRequests/AddressBookConnectionRequests';
import AddressBookBlockedContacts from './addressBookBlockedContacts/AddressBookBlockedContacts';
import AddressBookContactCard from './addressBookContactCard/AddressBookContactCard';
import AddressBookTabs from './addressBookTabs/AddressBookTabs';
import AddressBookSelectionModal from './addressBook-selection-modal/AddressBookSelectionModal';

import {
    useGetSearchProfiles,
    useBlockProfileMutation,
    BrandingEnum,
    useGetBlockedProfiles,
    useGetConnectionsRequests,
    useModal,
    ModalTypes,
    useGetResolvedCredential,
    useGetIDs,
} from 'learn-card-base';

import CaretDown from '../../components/svgs/CaretDown';
import AllContactsIcon from '../../components/svgs/AllContactsIcon';
import Lottie from 'react-lottie-player';
import Pulpo from '../../assets/lotties/cuteopulpo.json';
import MainHeader from '../../components/main-header/MainHeader';

const getActiveRouteTab = (url: string): AddressBookTabsEnum | undefined => {
    switch (url) {
        case '/contacts':
            return AddressBookTabsEnum.Connections;
        case '/contacts/pending':
            return AddressBookTabsEnum.PendingRequests;
        case '/contacts/requests':
            return AddressBookTabsEnum.Requests;
        case '/contacts/blocked':
            return AddressBookTabsEnum.Blocked;
        case '/contacts/search':
            return AddressBookTabsEnum.Search;
        default:
            return undefined;
    }
};

const AddressBook: React.FC = () => {
    const { url } = useRouteMatch();
    const [presentToast] = useIonToast();
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });
    const searchInputRef = useRef<HTMLIonInputElement>(null);

    // Block profile mutation
    const { mutate: blockProfile } = useBlockProfileMutation();

    // Search state and query
    const [search, setSearch] = useState<string>('');
    const { data: connections, isLoading: loading, refetch } = useGetSearchProfiles(search);
    const { data: records, isLoading: isLoadingRecords } = useGetIDs();
    // Active tab (derived from the route URL) and connection count state
    const initialTab = getActiveRouteTab(url) || AddressBookTabsEnum.Connections;
    const [activeTab, setActiveTab] = useState<AddressBookTabsEnum>(initialTab);
    const [connectionCount, setConnectionCount] = useState<number>(0);
    const [requestCount, setRequestCount] = useState<number>(0);
    const [blockedCount, setBlockedCount] = useState<number>(0);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    const [boostId, setBoostId] = useState<string>();
    const [troopCounts, setTroopCounts] = useState<{ [key: string]: number }>({});
    const troopCount = Object.entries(troopCounts).find(([key]) => key.includes(selectedGroupId));

    // Derived booleans for which tab is showing
    const showConnections = activeTab === AddressBookTabsEnum.Connections;
    const showPendingRequests = activeTab === AddressBookTabsEnum.PendingRequests;
    const showRequests = activeTab === AddressBookTabsEnum.Requests;
    const showBlockedConnections = activeTab === AddressBookTabsEnum.Blocked;
    const showSearch = true; // Always true for now

    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(selectedGroupId);

    // Handler for blocking a profile
    const handleBlockUser = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, profileId: string) => {
            e.stopPropagation();
            try {
                blockProfile(
                    { profileId },
                    {
                        onSuccess: async () => {
                            await refetch();
                        },
                        onError: (error: any) => {
                            refetch();
                            presentToast({
                                message:
                                    error?.message || 'An error occurred, unable to block user',
                                duration: 3000,
                                buttons: [{ text: 'Dismiss', role: 'cancel' }],
                                position: 'top',
                                cssClass: 'login-link-warning-toast',
                            });
                        },
                    }
                );
            } catch (err: any) {
                console.log('blockProfile::error', err);
                presentToast({
                    message: err?.message || 'An error occurred, unable to block user',
                    duration: 3000,
                    buttons: [{ text: 'Dismiss', role: 'cancel' }],
                    position: 'top',
                    cssClass: 'login-link-warning-toast',
                });
            }
        },
        [blockProfile, presentToast, refetch]
    );

    // Search input handlers
    const handleSearch = useCallback((value: string) => setSearch(value), []);
    const handleSearchFocus = useCallback(() => {
        searchInputRef.current?.blur();
        searchInputRef.current?.setFocus();
    }, []);
    const clearSearch = useCallback(() => setSearch(''), []);

    // Derived booleans for search result rendering
    const isSearching = search.length > 0;
    const showLoadingSpinner = loading && isSearching;
    const showSearchResults = !loading && isSearching && connections && connections.length > 0;
    const showNoSearchResults =
        !loading && isSearching && (!connections || connections.length === 0);

    const { data: blockedContacts, isLoading } = useGetBlockedProfiles();

    useEffect(() => {
        if (!isLoading && blockedContacts) {
            setBlockedCount(blockedContacts?.length ?? 0);
        }
    }, [blockedCount, blockedContacts, activeTab, url]);

    const { data: requestContacts, isLoading: requestConnectionsLoading } =
        useGetConnectionsRequests();

    useEffect(() => {
        if (!requestConnectionsLoading && requestContacts)
            setRequestCount(requestContacts?.length ?? 0);
    }, [requestCount, requestContacts, activeTab, url]);

    const handleContactSelection = () => {
        newModal(
            <AddressBookSelectionModal
                selectedGroupId={selectedGroupId}
                onGroupSelect={(groupId: string, boostId?: string) => {
                    setSelectedGroupId(groupId);
                    setBoostId(boostId);
                }}
                setTroopCounts={setTroopCounts}
                records={records}
                isLoadingRecords={isLoadingRecords}
            />,
            {
                sectionClassName: '!max-w-[550px]',
            }
        );
    };

    return (
        <IonPage className="bg-grayscale-100">
            <MainHeader
                customClassName="bg-grayscale-100"
                branding={BrandingEnum.scoutPass}
                customHeaderClass="px-0"
            />

            <IonContent fullscreen style={{ '--background': '#EFF0F5' }}>
                <AddressBookHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    connectionCount={connectionCount}
                    search={search}
                    clearSearch={clearSearch}
                    showSearch
                    handleShowSearch={handleSearchFocus}
                />

                <AddressBookContactCard />

                <div className="w-full max-w-[400px] sm:max-w-[600px] mx-auto my-4 rounded-2xl bg-white shadow-lg">
                    <IonGrid className="flex flex-col items-center justify-center w-full mb-[120px] sm:mb-[0px]">
                        {records?.length > 0 &&
                            (selectedGroupId === 'all' ? (
                                <button
                                    onClick={handleContactSelection}
                                    className="flex border-solid border-grayscale-200 border-[1px] rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px] mt-[15px]"
                                >
                                    <AllContactsIcon />
                                    <div className="flex flex-col items-start ml-2">
                                        <span className="text-sp-purple-base text-[12px] font-bold font-notoSans">
                                            All Contacts
                                        </span>
                                        <span className="text-grayscale-800 text-[17px] font-normal font-notoSans">
                                            {connectionCount} Contacts
                                        </span>
                                    </div>
                                    <CaretDown className="ml-auto mr-[15px] mt-[15px]" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleContactSelection}
                                    className="relative flex bg-white border-solid border-grayscale-200 border-[1px] rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px] mt-[15px]"
                                >
                                    <img
                                        className="w-[40px] h-[40px] rounded-[40px] mr-2"
                                        src={resolvedCredential?.boostCredential?.image}
                                    />
                                    <div className="flex flex-col items-start">
                                        <p>{resolvedCredential?.boostCredential?.name}</p>
                                        <p>
                                            {troopCount && troopCount[1]}{' '}
                                            {troopCount && troopCount[1] === 1
                                                ? 'Contact'
                                                : 'Contacts'}
                                        </p>
                                    </div>
                                    <CaretDown className="ml-auto mr-[15px] mt-[15px]" />
                                </button>
                            ))}
                        <AddressBookTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            connectionCount={connectionCount}
                            search={search}
                            clearSearch={clearSearch}
                            handleSearch={handleSearch}
                            searchInputRef={searchInputRef}
                            blockedCount={blockedCount}
                            requestCount={requestCount}
                        />
                        <IonRow className="flex items-center justify-center w-full max-w-[650px]">
                            {showLoadingSpinner && (
                                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full my-4">
                                    <IonSpinner color="black" />
                                    <p className="mt-2 font-bold text-lg">Loading...</p>
                                </section>
                            )}

                            {showSearchResults && (
                                <AddressBookContactList
                                    showBoostButton
                                    showArrow
                                    showRequestButton
                                    showDeleteButton={false}
                                    showBlockButton
                                    handleBlockUser={handleBlockUser}
                                    search={search}
                                    contacts={connections}
                                />
                            )}

                            {showNoSearchResults && (
                                <section className="relative flex flex-col pt-2 px-5 text-center justify-center">
                                    <div className="max-w-[280px] m-auto">
                                        <Lottie
                                            loop
                                            animationData={Pulpo}
                                            play
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <strong>No Search Results</strong>
                                </section>
                            )}

                            {showConnections && !isSearching && (
                                <AddressBookConnections
                                    setConnectionCount={setConnectionCount}
                                    connectionCount={connectionCount}
                                    activeTab={activeTab}
                                    boostId={boostId}
                                    resolvedCredential={resolvedCredential}
                                />
                            )}
                            {showPendingRequests && !isSearching && (
                                <AddressBookPendingConnections
                                    setConnectionCount={setConnectionCount}
                                    connectionCount={connectionCount}
                                    activeTab={activeTab}
                                />
                            )}
                            {showRequests && !isSearching && (
                                <AddressBookConnectionRequests
                                    setRequestCount={setRequestCount}
                                    activeTab={activeTab}
                                />
                            )}
                            {showBlockedConnections && !isSearching && (
                                <AddressBookBlockedContacts
                                    setBlockedCount={setBlockedCount}
                                    activeTab={activeTab}
                                />
                            )}
                        </IonRow>
                    </IonGrid>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AddressBook;
