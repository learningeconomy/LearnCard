import React, { useEffect, useState } from 'react';
import moment from 'moment';

import {
    useIonModal,
    IonInput,
    IonRow,
    IonCol,
    IonGrid,
    IonSpinner,
    IonList,
    IonItem,
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonFooter,
} from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import BoostAddressBookContactOptions from './BoostAddressBookContactOptions';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import Lottie from 'react-lottie-player';
const Pulpo = '/lotties/cuteopulpo.json';

import BoostAddressBookContactList from './BoostAddressBookContactList';

import { ModalTypes, useModal, UserProfilePicture, useWallet } from 'learn-card-base';
import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import { BoostUserTypeEnum } from 'learn-card-base';
import { LCNProfile, BoostRecipientInfo } from '@learncard/types';
import BoostShareableCode from './BoostShareableCode';

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

type BoostAddressBookCollectionPropName = 'issueTo' | 'admins';

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
    // the designated field we will be storing the selected contacts in
    // by default we store them in the issueTo collection
    // IE: issueTo
    // IE: admins
    collectionPropName = 'issueTo',
    title = 'Issue To',
    hideBoostShareableCode = false,
}) => {
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [connections, setConnections] = useState<BoostCMSIssueTo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [issueMode, setIssueMode] = useState<BoostUserTypeEnum>(BoostUserTypeEnum.someone);
    const collectionKey = collectionPropName as BoostAddressBookCollectionPropName;

    const [localIssueTo, setLocalIssueTo] = useState<BoostCMSIssueTo[]>(
        state?.[collectionKey] ?? []
    );

    const issueTo = _issueTo ?? localIssueTo;
    const setIssueTo = _setIssueTo ?? setLocalIssueTo;

    useEffect(() => {
        if (state?.[collectionKey]?.length > 0) {
            setLocalIssueTo(state?.[collectionKey] ?? []);
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
            <p className="font-poppins flex items-center font-medium justify-center text-xl w-full h-full text-grayscale-900">
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
            <p className="font-poppins font-medium flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                Who do you want to boost?
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
        const wallet = await initWallet();

        setLoading(true);
        try {
            const paginated = await wallet.invoke.getPaginatedConnections({ limit: 100 });
            setConnections(paginated?.records ?? []);
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    };

    const handleSaveContacts = () => {
        setState(prevState => {
            return {
                ...prevState,
                [collectionKey]: [...issueTo],
            };
        });
        handleCloseModal?.(true);
        setSearch?.('');
    };

    useEffect(() => {
        loadConnections();
    }, []);

    const handleSearch = async (profileId: string) => setSearch?.(profileId);

    const contactCount =
        (search?.length ?? 0) > 0 && (searchResults?.length ?? 0) > 0
            ? searchResults?.length
            : connections?.length;

    if (viewMode === BoostAddressBookViewMode.full) {
        return (
            <IonPage className="bg-white">
                <IonHeader className="learn-card-header ion-no-border bg-white w-full">
                    <IonToolbar color="white" className="ion-no-border w-full">
                        <IonGrid className="bg-white">
                            <IonRow className="w-full flex items-center justify-center bg-white">
                                <IonRow className="flex flex-col w-full max-w-[600px]">
                                    <IonCol className="flex flex-1 justify-start items-center">
                                        <button
                                            className="text-grayscale-50 p-0 mr-[10px]"
                                            onClick={() => {
                                                handleCloseModal?.(false);
                                                setIssueTo([...(state?.[collectionKey] ?? [])]);
                                                setSearch?.('');
                                            }}
                                        >
                                            <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                        </button>
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins font-medium text-xl">
                                            {contactCount ?? 0} Contacts
                                        </h3>
                                    </IonCol>

                                    <div className="flex items-center justify-start w-full">
                                        <IonInput
                                            autocapitalize="on"
                                            placeholder="Search LearnCard Network..."
                                            value={search}
                                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                                            onIonInput={e => handleSearch(e?.detail?.value ?? '')}
                                            debounce={500}
                                            type="text"
                                        />
                                    </div>
                                </IonRow>
                            </IonRow>
                        </IonGrid>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen>
                    {loading && (
                        <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full">
                            <IonSpinner color="black" />
                            <p className="mt-2 font-bold text-lg">Loading...</p>
                        </section>
                    )}
                    {!loading && connections.length > 0 && search?.length === 0 && (
                        <BoostAddressBookContactList
                            state={state}
                            setState={setState}
                            contacts={connections}
                            mode={mode}
                            _issueTo={issueTo}
                            _setIssueTo={setIssueTo}
                            collectionPropName={collectionKey}
                        />
                    )}
                    {!loading && connections.length === 0 && search?.length === 0 && (
                        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <div className="max-w-[280px] m-auto">
                                <Lottie
                                    loop
                                    path={Pulpo}
                                    play
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <p className="font-bold text-grayscale-800 mt-[20px]">
                                No connections yet
                            </p>
                        </section>
                    )}

                    {isLoading && search?.length > 0 && (
                        <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                            <IonSpinner color="black" />
                            <p className="mt-2 font-bold text-lg">Loading...</p>
                        </section>
                    )}
                    {search?.length > 0 && searchResults?.length > 0 && !isLoading && (
                        <BoostAddressBookContactList
                            state={state}
                            setState={setState}
                            contacts={searchResults}
                            mode={mode}
                            _issueTo={issueTo}
                            _setIssueTo={setIssueTo}
                            collectionPropName={collectionKey}
                        />
                    )}
                    {!isLoading && (search?.length ?? 0) > 0 && (searchResults?.length ?? 0) === 0 && (
                        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <strong>No search results</strong>
                        </section>
                    )}
                </IonContent>
                <IonFooter className="bg-white">
                    <IonToolbar className="w-full ion-no-border bg-white pt-5">
                        <IonRow className="w-full flex items-center justify-center">
                            <div className="w-full max-w-[600px] flex items-center justify-center">
                                <IonCol
                                    size="12"
                                    className="w-full flex items-center justify-between"
                                >
                                    <button
                                        onClick={handleSaveContacts}
                                        className="relative flex flex-1 items-center justify-center bg-emerald-700 rounded-full px-[18px] py-[8px] text-white font-poppins text-xl w-full shadow-lg normal font-medium text-center"
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
                            <h1 className="font-poppins text-black text-xl p-0 m-0">{title}</h1>

                            <button
                                onClick={() => {
                                    if (showContactOptions) {
                                        // bypass showing the contact options modal
                                        presentCenterModal({
                                            cssClass: 'center-modal user-options-modal',
                                            backdropDismiss: false,
                                            showBackdrop: false,
                                        });

                                        // newModal(
                                        //     <BoostAddressBookContactOptions
                                        //         state={state}
                                        //         setState={setState}
                                        //         setIssueMode={setIssueMode}
                                        //         showCloseButton={true}
                                        //         title={
                                        //             <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                                        //                 Select Recipient
                                        //             </p>
                                        //         }
                                        //         search={search}
                                        //         setSearch={setSearch}
                                        //         searchResults={searchResults}
                                        //         isLoading={isLoading}
                                        //         collectionPropName={collectionPropName}
                                        //     />,
                                        //     { sectionClassName: '!max-w-[500px]' },
                                        //     {
                                        //         desktop: ModalTypes.Center,
                                        //         mobile: ModalTypes.Center,
                                        //     }
                                        // );
                                    } else {
                                        presentAddressBook();
                                        // newModal(
                                        //     <BoostAddressBook
                                        //         state={state}
                                        //         setState={setState}
                                        //         viewMode={BoostAddressBookViewMode.full}
                                        //         mode={BoostAddressBookEditMode.edit}
                                        //         handleCloseModal={(
                                        //             closeAddressBookOptionsModal: boolean = false
                                        //         ) => {
                                        //             closeModal();
                                        //             if (closeAddressBookOptionsModal) {
                                        //                 handleCloseModal();
                                        //             }
                                        //         }}
                                        //         _issueTo={localIssueTo}
                                        //         _setIssueTo={setLocalIssueTo}
                                        //         search={search}
                                        //         setSearch={setSearch}
                                        //         searchResults={searchResults}
                                        //         isLoading={isLoading}
                                        //         collectionPropName={collectionPropName}
                                        //     />
                                        // );
                                    }
                                }}
                                // className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl" // new modaling version (+ delete mobile button below)
                                className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-desktop"
                            >
                                <Plus className="w-8 h-auto" />
                            </button>
                            <button
                                onClick={() => {
                                    if (showContactOptions) {
                                        // bypass showing the contact options modal
                                        presentCenterModal({
                                            cssClass: 'center-modal user-options-modal',
                                            backdropDismiss: false,
                                            showBackdrop: false,
                                        });
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
                            <p className="px-[16px] pb-6 font-poppins text-black text-base">
                                Admins are granted permission to send and edit this Boost.
                            </p>
                        )}

                        <BoostAddressBookContactList
                            state={state}
                            setIssueMode={setIssueMode}
                            setState={setState}
                            contacts={state?.[collectionKey] ?? []}
                            mode={mode}
                            _issueTo={issueTo}
                            _setIssueTo={setIssueTo}
                            collectionPropName={collectionKey}
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
                                <h1 className="font-poppins text-black text-xl p-0 m-0">
                                    Issue Log
                                </h1>
                            </div>

                            <IonList
                                lines="none"
                                className="flex flex-col items-center justify-center w-[100%]"
                            >
                                {recipients?.map(recipient => {
                                    return (
                                        <IonItem
                                            lines="none"
                                            className={`w-[95%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item py-[8px]`}
                                        >
                                            <div className="flex items-center justify-start w-full">
                                                <div className="flex items-center justify-start">
                                                    <UserProfilePicture
                                                        customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                                        customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                                                        customSize={120}
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

            {!hideBoostShareableCode && (
                <BoostShareableCode
                    customClassName="mt-4"
                    state={state}
                    boostUri={boostUri}
                    showTitle={false}
                    useIonModalDatePicker={true}
                />
            )}
        </>
    );
};

export default BoostAddressBook;
