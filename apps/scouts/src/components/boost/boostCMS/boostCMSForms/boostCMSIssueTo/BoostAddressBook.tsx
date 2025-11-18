import React, { useEffect, useState } from 'react';
import moment from 'moment';

import useTroopMembers from '../../../../../hooks/useTroopMembers';
import useNetworkMembers from '../../../../../hooks/useNetworkMembers';
import boostSearchStore from '../../../../../stores/boostSearchStore';

import {
    IonInput,
    IonRow,
    IonCol,
    useIonModal,
    IonPage,
    IonHeader,
    IonToolbar,
    IonGrid,
    IonContent,
    IonSpinner,
    IonFooter,
    IonList,
    IonItem,
} from '@ionic/react';

import {
    useWallet,
    useResolveBoost,
    useGetBoostParents,
    UserProfilePicture,
    conditionalPluralize,
    BoostUserTypeEnum,
} from 'learn-card-base';

import Plus from 'learn-card-base/svgs/Plus';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostShareableCode from './BoostShareableCode';
import BoostAddressBookContactList from './BoostAddressBookContactList';
import BoostAddressBookContactOptions from './BoostAddressBookContactOptions';

import Lottie from 'react-lottie-player';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import PurpGhost from '../../../../../assets/lotties/purpghost.json';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import { LCNProfile, BoostRecipientInfo } from '@learncard/types';
import { ScoutsRoleEnum } from '../../../../../stores/troopPageStore';
import { MemberTabsEnum } from '../../../../../pages/troop/TroopPageMembersBox';

export enum BoostAddressBookEditMode {
    edit = 'edit',
    delete = 'delete',
}

export enum BoostAddressBookViewMode {
    full = 'full',
    list = 'list',
}

type BoostAddressBookProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleCloseModal?: (closeAddressBookOptionsModal?: boolean) => void;
    viewMode: BoostAddressBookViewMode;
    mode: BoostAddressBookEditMode;
    _issueTo?: BoostCMSIssueTo[];
    _setIssueTo?: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;

    search?: string;
    setSearch?: React.Dispatch<React.SetStateAction<string>>;
    searchResults?: LCNProfile[];
    isLoading?: boolean;

    recipients: BoostRecipientInfo[];
    recipientsLoading: boolean;

    boostUri: string;

    showContactOptions?: boolean;
    collectionPropName?: string;
    title?: string;
    hideBoostShareableCode?: boolean;
};

export const BoostAddressBook: React.FC<BoostAddressBookProps> = ({
    state,
    setState,
    handleCloseModal = () => {},
    mode,
    viewMode = BoostAddressBookViewMode.list,
    _issueTo,
    _setIssueTo,

    search,
    setSearch,
    searchResults,
    isLoading,

    recipients,
    recipientsLoading,

    boostUri,

    showContactOptions = true,
    collectionPropName = 'issueTo',
    title = 'Send To',
    hideBoostShareableCode = false,
}) => {
    const { initWallet } = useWallet();

    const [connections, setConnections] = useState<BoostCMSIssueTo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [issueMode, setIssueMode] = useState<BoostUserTypeEnum>(BoostUserTypeEnum.someone);
    const [localIssueTo, setLocalIssueTo] = useState<BoostCMSIssueTo[]>(
        state?.[collectionPropName]
    );

    // --- Limit Search Scope for Troop Leaders / Admins ---
    //   (should really refactor since so much of this code is from BoostSearch)
    const { data: parentBoosts } = useGetBoostParents(boostUri, 1);
    const parentBoost = parentBoosts?.records?.[0]; // just default to the first one, guess we're just assuming there's only one
    const parentBoostUri = parentBoost?.uri;
    const { data: resolvedCredential } = useResolveBoost(parentBoostUri);

    const contextCredential = boostSearchStore.use.contextCredential();
    const searchBoostUri = boostSearchStore.use.boostUri();
    const role = boostSearchStore.use.role();
    const isTroopLeader = role === ScoutsRoleEnum.leader;
    const isNetworkAdmin = role === ScoutsRoleEnum.national;

    const { scoutRecipients: rawScouts, isLoading: scoutsLoading } = useTroopMembers(
        contextCredential as any,
        MemberTabsEnum.Scouts,
        searchBoostUri ?? parentBoostUri
    );

    const { data: networkMembersData, isLoading: networkLoading } = useNetworkMembers(
        searchBoostUri ?? parentBoostUri,
        search
    );
    const rawNetworkMembers = networkMembersData?.pages?.flatMap(page => page.records) ?? [];
    const networkMembers = rawNetworkMembers.map(networkMember => networkMember.to);

    const scouts = rawScouts
        ?.map(scout => scout.to)
        .filter(
            scout =>
                !search ||
                scout.displayName.toLowerCase().includes(search.toLowerCase()) ||
                scout.profileId.toLowerCase().includes(search.toLowerCase())
        );
    // --- End Limit Search Scope ---

    useEffect(() => {
        if (state?.[collectionPropName].length > 0) {
            setLocalIssueTo(state?.[collectionPropName]);
        } else {
            return;
        }
    }, [state]);

    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostAddressBookContactOptions, {
        state: state,
        setState: setState,
        setIssueMode,
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: true,
        title: (
            <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900">
                Select Recipient
            </p>
        ),
        search,
        setSearch,
        searchResults,
        isLoading,
        collectionPropName,
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostAddressBookContactOptions, {
        state: state,
        setState: setState,
        setIssueMode,
        handleCloseModal: () => dismissSheetModal(),
        showCloseButton: false,
        title: (
            <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900">
                Select Recipient
            </p>
        ),
        search,
        setSearch,
        searchResults,
        isLoading,
        collectionPropName,
    });

    // modal call for directly accessing the addressbook
    const [presentAddressBook, dismissAddressbook] = useIonModal(BoostAddressBook, {
        state: state,
        setState: setState,
        viewMode: BoostAddressBookViewMode.full,
        mode: BoostAddressBookEditMode.edit,
        handleCloseModal: (closeAddressBookOptionsModal: boolean = false) => {
            dismissAddressbook();
            if (closeAddressBookOptionsModal) {
                handleCloseModal();
            }
        },
        _issueTo: localIssueTo,
        _setIssueTo: setLocalIssueTo,

        search,
        setSearch,
        searchResults,
        isLoading,
        collectionPropName,
    });

    const loadConnections = async () => {
        if (isTroopLeader) {
            if (scouts) {
                setConnections(scouts);
            }
            return;
        }
        if (isNetworkAdmin) {
            setConnections(networkMembers);
            return;
        }

        const wallet = await initWallet();

        setLoading(true);
        try {
            const connections = await wallet.invoke.getConnections();
            setConnections(connections);
            setLoading(false);
        } catch (e) {
            console.log('getConnections::error', e);
            setLoading(false);
        }
    };

    const handleSaveContacts = () => {
        setState(prevState => {
            return {
                ...prevState,
                [collectionPropName]: [..._issueTo],
            };
        });
        handleCloseModal?.(true);
        setSearch?.('');
    };

    useEffect(() => {
        loadConnections();
    }, [isTroopLeader, rawScouts]);

    const handleSearch = async (profileId: string) => setSearch?.(profileId);

    let contactCount =
        (search?.length ?? 0) > 0 && (searchResults?.length ?? 0) > 0
            ? searchResults?.length
            : connections?.length;
    if (isTroopLeader) {
        contactCount = scouts?.length ?? 0;
    }
    if (isNetworkAdmin) {
        contactCount = networkMembers?.length ?? 0;
    }

    let noConnectionsString = 'No connections yet';
    let headerText = conditionalPluralize(contactCount ?? 0, 'Contact');
    let searchPlaceholder = 'Search ScoutPass Network...';
    let connectionsToShow = connections;

    if (viewMode === BoostAddressBookViewMode.full) {
        // TODO so much of this is duplicated in BoostSearch.tsx
        let showLoadingSpinner = loading || (isLoading && (search?.length ?? 0) > 0);
        let showConnectionsList = !loading && connections.length > 0 && search?.length === 0;
        let showNoSearchEmptyState = !loading && connections.length === 0 && search?.length === 0;
        let showSearchResults =
            (search?.length ?? 0) > 0 && searchResults && searchResults?.length > 0 && !isLoading;
        let showNoSearchResults =
            !isLoading && (search?.length ?? 0) > 0 && searchResults?.length === 0;

        if (isTroopLeader) {
            showLoadingSpinner = scoutsLoading;
            showConnectionsList = (scouts?.length ?? 0) > 0;
            showNoSearchEmptyState =
                !scoutsLoading && scouts?.length === 0 && (search?.length ?? 0) === 0;
            showSearchResults = false; // Again, doesn't use network profile search
            showNoSearchResults =
                !scoutsLoading && scouts?.length === 0 && (search?.length ?? 0) > 0;
            noConnectionsString = 'No troop members';
            headerText = conditionalPluralize(scouts?.length ?? 0, 'Scout');
            searchPlaceholder = `Search ${contextCredential?.name ?? 'Troop'}...`;
            connectionsToShow = scouts ?? [];
        }
        if (isNetworkAdmin) {
            showLoadingSpinner = networkLoading;
            showConnectionsList = (networkMembers?.length ?? 0) > 0;
            showNoSearchEmptyState =
                !networkLoading && networkMembers?.length === 0 && (search?.length ?? 0) === 0;
            showSearchResults = false; // Again, doesn't use network profile search
            showNoSearchResults =
                !networkLoading && networkMembers?.length === 0 && (search?.length ?? 0) > 0;
            noConnectionsString = 'No network members';
            headerText = conditionalPluralize(networkMembers?.length ?? 0, 'Network Member');
            searchPlaceholder = `Search ${contextCredential?.name ?? 'Network'}...`;
            connectionsToShow = networkMembers;
        }
        return (
            <IonPage className="bg-white w-full">
                <IonHeader className="learn-card-header ion-no-border bg-white w-full">
                    <IonToolbar className="ion-no-border" color="white">
                        <IonGrid>
                            <IonRow className="w-full flex items-center justify-center">
                                <IonRow className="flex flex-col w-full max-w-[600px]">
                                    <IonCol className="flex flex-1 justify-start items-center">
                                        <button
                                            className="text-grayscale-50 p-0 mr-[10px]"
                                            onClick={() => {
                                                handleCloseModal?.(false);
                                                _setIssueTo([...state?.[collectionPropName]]);
                                                setSearch?.('');
                                            }}
                                        >
                                            <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                        </button>
                                        <h3 className="text-grayscale-900 flex items-center justify-start text-2xl">
                                            {headerText}
                                        </h3>
                                    </IonCol>

                                    <div className="flex items-center justify-start w-full">
                                        <IonInput
                                            autocapitalize="on"
                                            placeholder={searchPlaceholder}
                                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                                            onIonInput={e => handleSearch(e?.detail?.value)}
                                            debounce={100}
                                            type="text"
                                        />
                                    </div>
                                </IonRow>
                            </IonRow>
                        </IonGrid>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen>
                    {showLoadingSpinner && (
                        <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                            <IonSpinner color="black" />
                            <p className="mt-2 font-bold text-lg">Loading...</p>
                        </section>
                    )}
                    {showConnectionsList && (
                        <BoostAddressBookContactList
                            state={state}
                            setState={setState}
                            contacts={connectionsToShow}
                            mode={mode}
                            _issueTo={_issueTo}
                            _setIssueTo={_setIssueTo}
                            collectionPropName={collectionPropName}
                        />
                    )}
                    {showNoSearchEmptyState && (
                        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <div className="max-w-[280px] m-auto">
                                <Lottie
                                    loop
                                    animationData={PurpGhost}
                                    play
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <p className="font-bold text-grayscale-800 mt-[20px]">
                                {noConnectionsString}
                            </p>
                        </section>
                    )}
                    {showSearchResults && (
                        <BoostAddressBookContactList
                            state={state}
                            setState={setState}
                            contacts={searchResults}
                            mode={mode}
                            _issueTo={_issueTo}
                            _setIssueTo={_setIssueTo}
                            collectionPropName={collectionPropName}
                        />
                    )}
                    {showNoSearchResults && (
                        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <img src={MiniGhost} alt="ghost" className="max-w-[250px] m-auto" />
                            <strong>No search results</strong>
                        </section>
                    )}
                </IonContent>
                <IonFooter className="bg-white">
                    <IonToolbar color="white" className="ion-no-border pt-5 bg-white">
                        <IonRow className="w-full flex items-center justify-center">
                            <div className="w-full max-w-[600px] flex items-center justify-center">
                                <IonCol
                                    size="12"
                                    className="w-full flex items-center justify-between"
                                >
                                    <button
                                        onClick={handleSaveContacts}
                                        className="relative flex flex-1 items-center justify-center bg-emerald-700 rounded-full px-[18px] py-[8px] text-white text-2xl w-full shadow-lg text-center"
                                    >
                                        Save
                                    </button>
                                </IonCol>
                            </div>
                        </IonRow>
                    </IonToolbar>
                </IonFooter>
            </IonPage>
        );
    }

    return (
        <>
            <IonGrid className="w-full flex items-center justify-center flex-col">
                <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                    <IonCol size="12" className="w-full bg-white rounded-[20px]">
                        <div className="flex items-center justify-between w-full ion-padding">
                            <h1 className="text-black text-xl p-0 m-0 font-notoSans">{title}</h1>
                            <button
                                onClick={() => {
                                    boostSearchStore.set.boostUri(parentBoostUri);
                                    boostSearchStore.set.contextCredential(resolvedCredential);

                                    if (showContactOptions) {
                                        presentCenterModal({
                                            cssClass: 'center-modal user-options-modal',
                                            backdropDismiss: false,
                                            showBackdrop: false,
                                        });
                                        // bypass showing the contact options modal
                                    } else {
                                        presentAddressBook();
                                    }
                                }}
                                className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-desktop"
                            >
                                <Plus className="w-8 h-auto" />
                            </button>

                            <button
                                onClick={() => {
                                    if (showContactOptions) {
                                        boostSearchStore.set.boostUri(parentBoostUri);
                                        boostSearchStore.set.contextCredential(resolvedCredential);

                                        presentCenterModal({
                                            cssClass: 'center-modal user-options-modal',
                                            backdropDismiss: false,
                                            showBackdrop: false,
                                        });
                                        // bypass showing the contact options modal
                                    } else {
                                        presentAddressBook();
                                    }
                                }}
                                className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-mobile"
                            >
                                <Plus className="w-8 h-auto" />
                            </button>
                        </div>
                        {collectionPropName === 'admins' && (
                            <p className="px-[16px] pb-6 text-black text-base font-notoSans">
                                Admins are granted permission to send and edit this Boost.
                            </p>
                        )}

                        <BoostAddressBookContactList
                            state={state}
                            setIssueMode={setIssueMode}
                            setState={setState}
                            contacts={state?.[collectionPropName]}
                            mode={mode}
                            _issueTo={_issueTo}
                            _setIssueTo={_setIssueTo}
                            collectionPropName={collectionPropName}
                        />
                    </IonCol>
                </IonRow>

                {recipientsLoading && recipients?.length === 0 && (
                    <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-8 rounded-[20px]">
                        <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                            <IonSpinner color="light" />
                        </section>
                    </IonRow>
                )}
                {!recipientsLoading && recipients?.length > 0 && (
                    <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
                        <IonCol size="12" className="w-full bg-white rounded-[20px]">
                            <div className="flex items-center justify-between w-full ion-padding">
                                <h1 className="text-black text-2xl p-0 m-0 font-medium">
                                    Issue Log
                                </h1>
                            </div>

                            <IonList
                                lines="none"
                                className="flex flex-col items-center justify-center w-[100%]"
                            >
                                {recipients?.map((recipient, index) => {
                                    return (
                                        <IonItem
                                            key={index}
                                            lines="none"
                                            className={`w-[95%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item py-[8px]`}
                                        >
                                            <div className="flex items-center justify-start w-full">
                                                <div className="flex items-center justify-start">
                                                    <UserProfilePicture
                                                        customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                                        customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                                                        customSize={500}
                                                        user={recipient?.to}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start justify-center pt-1 pr-1 pb-1">
                                                    <p className="text-grayscale-900 font-semibold capitalize">
                                                        {recipient?.to?.displayName ||
                                                            recipient?.to?.profileId}
                                                    </p>
                                                    <p className="text-grayscale-600 font-normal">
                                                        {moment(recipient?.received).format(
                                                            'DD MMMM YYYY'
                                                        )}{' '}
                                                        &bull;{' '}
                                                        {moment(recipient?.received).format(
                                                            'h:mm A'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </IonItem>
                                    );
                                })}
                            </IonList>
                        </IonCol>
                    </IonRow>
                )}
            </IonGrid>

            {!hideBoostShareableCode && <BoostShareableCode state={state} boostUri={boostUri} />}
        </>
    );
};

export default BoostAddressBook;
