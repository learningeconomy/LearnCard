import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';
import {
    IonContent,
    IonPage,
    IonSpinner,
    useIonToast,
    IonRow,
    IonGrid,
    IonCol,
    IonInput,
} from '@ionic/react';

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

import { useGetSearchProfiles, useBlockProfileMutation, BrandingEnum, useGetBlockedProfiles, useGetConnectionsRequests } from 'learn-card-base';

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

    const { data: blockedContacts, isLoading } = useGetBlockedProfiles();

    useEffect(() => {
        if (!isLoading && blockedContacts) {
            setBlockedCount(blockedContacts?.length ?? 0);
        };
    }, [blockedCount, blockedContacts, activeTab, url]);

    const { data: requestContacts, isLoading: requestConnectionsLoading} = useGetConnectionsRequests();

    useEffect(() => {
        if (!requestConnectionsLoading && requestContacts) setRequestCount(requestContacts?.length ?? 0);
    }, [requestCount, requestContacts, activeTab, url]);

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
