import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner, useIonToast, IonRow, IonGrid } from '@ionic/react';

import MainHeader from '../../components/main-header/MainHeader';
import AddressBookHeader from './addressBook-header/AddressBookHeader';
import AddressBookContactCard from './addressBookContactCard/AddressBookContactCard';
import AddressBookContactList from './addressBook-contact-list/AddressBookContactList';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import { AddressBookTabsEnum } from './addressBookHelpers';
import AddressBookConnections from './addressBookConnections/AddressBookConnections';
import AddressBookPendingConnections from './addressBookPendingConnections/AddressBookPendingConnections';
import AddressBookConnectionRequests from './addressBookConnectionRequests/AddressBookConnectionRequests';
import AddressBookBlockedContacts from './addressBookBlockedContacts/AddressBookBlockedContacts';
import AddressBookTabs from './addressBookTabs/AddressBookTabs';

import {
    useGetSearchProfiles,
    useBlockProfileMutation,
    BrandingEnum,
    useGetBlockedProfiles,
    useGetConnectionsRequests,
} from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons';

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
    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const { url } = useRouteMatch();
    const [presentToast] = useIonToast();
    const searchInputRef = useRef<HTMLIonInputElement>(null);

    // Block profile mutation
    const { mutate: blockProfile } = useBlockProfileMutation();

    // Search state and query
    const [search, setSearch] = useState<string>('');
    const { data: connections, isLoading: loading, refetch } = useGetSearchProfiles(search);

    // Active tab (derived from the route URL) and connection count state
    const initialTab = getActiveRouteTab(url) || AddressBookTabsEnum.Connections;
    const [activeTab, setActiveTab] = useState<AddressBookTabsEnum>(initialTab);
    const [connectionCount, setConnectionCount] = useState<number>(0);
    const [requestCount, setRequestCount] = useState<number>(0);
    const [blockedCount, setBlockedCount] = useState<number>(0);

    // Derived booleans for which tab is showing
    const showConnections = activeTab === AddressBookTabsEnum.Connections;
    const showPendingRequests = activeTab === AddressBookTabsEnum.PendingRequests;
    const showRequests = activeTab === AddressBookTabsEnum.Requests;
    const showBlockedConnections = activeTab === AddressBookTabsEnum.Blocked;
    const showSearch = true; // Always true for now

    // Update the connection count when search results change
    useEffect(() => {
        if (!loading && search.length > 0) {
            setConnectionCount(connections?.length ?? 0);
        }
    }, [loading, search, connections]);

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

    const {
        data: blockedContacts,
        isLoading,
        refetch: refetchBlockedContacts,
    } = useGetBlockedProfiles();

    useEffect(() => {
        if (!isLoading && blockedContacts) {
            setBlockedCount(blockedContacts?.length ?? 0);
        }
    }, [blockedCount, blockedContacts, activeTab, url]);

    const {
        data: requestContacts,
        isLoading: requestConnectionsLoading,
        refetch: refetchRequestContacts,
    } = useGetConnectionsRequests();

    useEffect(() => {
        if (!requestConnectionsLoading && requestContacts)
            setRequestCount(requestContacts?.length ?? 0);
    }, [requestCount, requestContacts, activeTab, url]);

    return (
        <IonPage className="bg-grayscale-100">
            <MainHeader
                customClassName="bg-grayscale-100"
                branding={BrandingEnum.learncard}
                customHeaderClass="px-0"
            />

            <IonContent fullscreen style={{ '--background': '#EFF0F5' }}>
                <GenericErrorBoundary>
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
                        <IonGrid className="flex flex-col items-center justify-center w-full">
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
                                <GenericErrorBoundary>
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
                                            refetch={refetch}
                                            refetchBlockedContacts={refetchBlockedContacts}
                                            refetchRequestContacts={refetchRequestContacts}
                                        />
                                    )}

                                    {showNoSearchResults && (
                                        <section className="flex flex-col items-center justify-center my-[30px]">
                                            <FloatingBottleIcon />
                                            <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                                                No Search Results
                                            </p>
                                        </section>
                                    )}

                                    {showConnections && !isSearching && (
                                        <AddressBookConnections
                                            setConnectionCount={setConnectionCount}
                                            connectionCount={connectionCount}
                                            activeTab={activeTab}
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
                                </GenericErrorBoundary>
                            </IonRow>
                        </IonGrid>
                    </div>
                </GenericErrorBoundary>
            </IonContent>
        </IonPage>
    );
};

export default AddressBook;
