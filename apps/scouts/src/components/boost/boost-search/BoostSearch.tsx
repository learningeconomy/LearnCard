import React, { useState, useEffect } from 'react';
import { IonCol, IonContent, IonRow, IonGrid, IonToolbar, IonHeader, IonInput } from '@ionic/react';

import useTroopMembers from '../../../hooks/useTroopMembers';
import useNetworkMembers from '../../../hooks/useNetworkMembers';
import { useGetSearchProfiles } from 'learn-card-base';

import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostAddressBookContactList from '../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactList';
import {
    BoostAddressBookViewMode,
    BoostAddressBookEditMode,
} from '../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { conditionalPluralize, useWallet } from 'learn-card-base';
import { BoostCMSIssueTo, ShortBoostState } from '../boost';
import { LCNProfile } from '@learncard/types';
import { UnsignedVC, VC } from '@learncard/types';

import Lottie from 'react-lottie-player';
import PurpGhost from '../../../assets/lotties/purpghost.json';
import HourGlass from '../../../assets/lotties/hourglass.json';
import boostSearchStore from '../../../stores/boostSearchStore';
import { ScoutsRoleEnum } from '../../../stores/troopPageStore';
import { MemberTabsEnum } from '../../../pages/troop/TroopPageMembersBox';

type BoostSearchProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    boostCredential: VC | UnsignedVC;
    boostUri: string;
    profileId: string;
    state: ShortBoostState; //parent state storing issued to
    setState: React.Dispatch<React.SetStateAction<ShortBoostState>>; // action for setting parent state
    history: any;

    preserveStateIssueTo?: boolean;
    ignoreBoostSearchRestriction?: boolean;
};

const BoostSearch: React.FC<BoostSearchProps> = ({
    handleCloseModal,
    showCloseButton = true,
    title,
    history,
    boostCredential,
    boostUri,
    profileId,
    state,
    setState,

    preserveStateIssueTo = true,
    ignoreBoostSearchRestriction = false,
}) => {
    const { initWallet } = useWallet();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [connections, setConnections] = useState<LCNProfile[]>([]);
    const [_issueTo, _setIssueTo] = useState<BoostCMSIssueTo[]>(state?.issueTo ?? []);

    const contextCredential = boostSearchStore.use.contextCredential();
    const parentBoostUri = boostSearchStore.use.boostUri();
    const role = boostSearchStore.use.role();
    const isTroopLeader = role === ScoutsRoleEnum.leader;
    const isNetworkAdmin = role === ScoutsRoleEnum.national;

    const { scoutRecipients: rawScouts, isLoading: scoutsLoading } = useTroopMembers(
        contextCredential as any,
        MemberTabsEnum.Scouts,
        parentBoostUri
    );
    const scouts = rawScouts
        ?.map(scout => scout.to)
        .filter(
            scout =>
                !search ||
                scout.displayName.toLowerCase().includes(search.toLowerCase()) ||
                scout.profileId.toLowerCase().includes(search.toLowerCase())
        );

    const { data: networkMembersData, isLoading: networkLoading } = useNetworkMembers(
        parentBoostUri,
        search
    );

    const rawNetworkMembers = networkMembersData?.pages?.flatMap(page => page.records) ?? [];
    const networkMembers = rawNetworkMembers.map(networkMember => networkMember.to);

    const { data: searchResults, isLoading: searchLoading } = useGetSearchProfiles(search ?? '');
    const loadConnections = async () => {
        if (!ignoreBoostSearchRestriction) {
            if (isTroopLeader) {
                setConnections(scouts ?? []);
                return;
            }

            if (isNetworkAdmin) {
                setConnections(networkMembers);
                return;
            }
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

    useEffect(() => {
        loadConnections();
    }, [isTroopLeader, rawScouts]);

    const handleSearch = (value: string) => {
        setSearch(value);
    };

    const handleSaveContacts = () => {
        const selectedContacts = preserveStateIssueTo
            ? [...state.issueTo, ..._issueTo]
            : [..._issueTo];
        const deduped = [
            ...new Map(selectedContacts.map(contact => [contact['profileId'], contact])).values(),
        ];
        setState({ issueTo: deduped });
        _setIssueTo([]);
        setSearch?.('');
        handleCloseModal();
    };

    let contactCount = search && search?.length > 0 ? searchResults?.length : connections?.length;

    let showHourGlassLoading = loading && !searchLoading;
    let showConnectionsList = !loading && connections.length > 0 && !search;
    let showNoSearchEmptyState =
        !loading && connections.length === 0 && search?.length === 0 && !searchLoading;
    let showSearchLoader = searchLoading && search?.length > 0;
    let showSearchResults =
        search?.length > 0 && searchResults && searchResults?.length > 0 && !searchLoading;
    let showNoSearchResults =
        !searchLoading && search?.length > 0 && searchResults && searchResults.length === 0;

    let noConnectionsString = 'No connections yet';
    let headerText = conditionalPluralize(contactCount ?? 0, 'Contact');
    let searchPlaceholder = 'Search ScoutPass Network...';

    let connectionsToShow = connections;

    if (!ignoreBoostSearchRestriction) {
        if (isTroopLeader) {
            contactCount = scouts?.length ?? 0;
            showHourGlassLoading = scoutsLoading;
            showConnectionsList = (scouts?.length ?? 0) > 0;
            showNoSearchEmptyState = !scoutsLoading && scouts?.length === 0 && search?.length === 0;
            showSearchLoader = false; // Uses filter, not network profile search, so always false
            showSearchResults = false; // Again, doesn't use network profile search
            showNoSearchResults = !scoutsLoading && scouts?.length === 0 && search?.length > 0;
            noConnectionsString = 'No troop members';
            headerText = conditionalPluralize(scouts?.length ?? 0, 'Scout');
            searchPlaceholder = `Search ${contextCredential?.name ?? 'Troop'}...`;
            connectionsToShow = scouts ?? [];
        }
        if (isNetworkAdmin) {
            contactCount = networkMembers?.length ?? 0;
            showHourGlassLoading = networkLoading;
            showConnectionsList = (networkMembers?.length ?? 0) > 0;
            showNoSearchEmptyState =
                !networkLoading && networkMembers?.length === 0 && search?.length === 0;
            showSearchLoader = false; // Uses filter, not network profile search, so always false
            showSearchResults = false; // Again, doesn't use network profile search
            showNoSearchResults =
                !networkLoading && networkMembers?.length === 0 && search?.length > 0;
            noConnectionsString = 'No network members';
            headerText = conditionalPluralize(networkMembers?.length ?? 0, 'Network Member');
            searchPlaceholder = `Search ${contextCredential?.name ?? 'Network'}...`;
            connectionsToShow = networkMembers;
        }
    }

    return (
        <section className="bg-white min-h-[700px] h-full text-grayscale-900">
            <IonHeader className="learn-card-header ion-no-border my-[0px]">
                <IonToolbar className="ion-no-border bg-white " color="white">
                    <IonGrid className="bg-white">
                        <IonRow className="w-full flex items-center justify-center pt-[20px]">
                            <IonRow className="flex flex-col w-full max-w-[600px]">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-grayscale-50 p-0 mr-[10px]"
                                        onClick={() => {
                                            handleCloseModal();
                                            // _setIssueTo([...state.issueTo]);
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
                                        debounce={150}
                                        type="text"
                                    />
                                </div>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent className="h-full">
                {showHourGlassLoading && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full mt-[80px]">
                        <div className="max-w-[150px]">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </section>
                )}
                {showConnectionsList && (
                    <BoostAddressBookContactList
                        state={state}
                        setState={setState}
                        contacts={connectionsToShow}
                        mode={BoostAddressBookEditMode.edit}
                        viewMode={BoostAddressBookViewMode.full}
                        _issueTo={_issueTo}
                        _setIssueTo={_setIssueTo}
                    />
                )}
                {showNoSearchEmptyState && (
                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                        <div className="max-w-[200px] m-auto flex justify-center">
                            <Lottie
                                loop
                                animationData={PurpGhost}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <strong>{noConnectionsString}</strong>
                    </section>
                )}
                {showSearchLoader && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full mt-[80px]">
                        <div className="max-w-[150px]">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </section>
                )}
                {showSearchResults && (
                    <BoostAddressBookContactList
                        state={state}
                        setState={setState}
                        contacts={searchResults}
                        mode={BoostAddressBookEditMode.edit}
                        viewMode={BoostAddressBookViewMode.full}
                        _issueTo={_issueTo}
                        _setIssueTo={_setIssueTo}
                    />
                )}
                {showNoSearchResults && (
                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                        <div className="max-w-[200px] m-auto flex justify-center">
                            <Lottie
                                loop
                                animationData={PurpGhost}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <strong>No search results</strong>
                    </section>
                )}
                <footer className="pb-[15px] bg-white fixed bottom-0 w-full" color="white">
                    <IonRow className="w-full flex items-center justify-center">
                        <div className="w-full max-w-[600px] flex items-center justify-center">
                            <IonCol size="12" className="w-full flex items-center justify-between">
                                <button
                                    onClick={handleSaveContacts}
                                    className="relative flex flex-1 items-center justify-center bg-sp-purple-base rounded-full px-[18px] py-[8px] text-white text-2xl w-full shadow-lg text-center"
                                >
                                    Save
                                </button>
                            </IonCol>
                        </div>
                    </IonRow>
                </footer>
            </IonContent>
        </section>
    );
};

export default BoostSearch;
