import React, { useState, useEffect } from 'react';
import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonToolbar,
    IonHeader,
    IonPage,
    IonFooter,
    IonSpinner,
    useIonModal,
    IonInput,
} from '@ionic/react';

import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostAddressBookContactList from '../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactList';
import {
    BoostAddressBookViewMode,
    BoostAddressBookEditMode,
} from '../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { UserProfilePicture, useWallet } from 'learn-card-base';
import { BoostCMSIssueTo, ShortBoostState, BoostCMSState } from '../boost';
import { LCNProfile, BoostRecipientInfo } from '@learncard/types';
import { UnsignedVC, VC } from '@learncard/types';
import { useGetSearchProfiles, useGetBoostRecipients } from 'learn-card-base';

import Lottie from 'react-lottie-player';
import Pulpo from '../../../assets/lotties/cuteopulpo.json';
import HourGlass from '../../../assets/lotties/hourglass.json';

type BoostSearchProps = {
    handleCloseModal: () => void;
    buttonText?: string;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    boostCredential: VC | UnsignedVC;
    boostUri: string;
    profileId: string;
    state: ShortBoostState; //parent state storing issued to
    setState: React.Dispatch<React.SetStateAction<ShortBoostState>>; // action for setting parent state
    history: any;
    onSave?: () => void;
};

const BoostSearch: React.FC<BoostSearchProps> = ({
    handleCloseModal,
    buttonText = 'Save',
    showCloseButton = true,
    title,
    history,
    boostCredential,
    boostUri,
    profileId,
    state,
    setState,
    onSave,
}) => {
    const { initWallet } = useWallet();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [connections, setConnections] = useState<LCNProfile[]>([]);
    const [_issueTo, _setIssueTo] = useState<BoostCMSIssueTo[]>(state?.issueTo ?? []);

    const { data: searchResults, isLoading: searchLoading } = useGetSearchProfiles(search ?? '');
    const loadConnections = async () => {
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
    }, []);

    const handleSearch = (value: string) => {
        setSearch(value);
    };

    const handleSaveContacts = () => {
        const selectedContacts = [...state.issueTo, ..._issueTo];
        const deduped = [
            ...new Map(selectedContacts.map(contact => [contact['profileId'], contact])).values(),
        ];
        setState({ issueTo: deduped });
        _setIssueTo([]);
        setSearch?.('');

        handleCloseModal();
        onSave?.();
    };

    const contactCount =
        search && search?.length > 0 && searchResults && searchResults?.length > 0
            ? searchResults?.length
            : connections?.length;

    return (
        <IonPage className="bg-white">
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
                                    <h3 className="text-grayscale-900 flex items-center justify-start font-poppins font-medium text-xl">
                                        {contactCount ?? 0} Contacts
                                    </h3>
                                </IonCol>

                                <div className="flex items-center justify-start w-full">
                                    <IonInput
                                        autocapitalize="on"
                                        placeholder="Search LearnCard Network..."
                                        value={search}
                                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base"
                                        onIonInput={e => handleSearch(e?.detail?.value)}
                                        debounce={500}
                                        type="text"
                                    />
                                </div>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {loading && !searchLoading && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
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
                {!loading && connections.length > 0 && search?.length === 0 && (
                    <BoostAddressBookContactList
                        state={state}
                        setState={setState}
                        contacts={connections}
                        mode={BoostAddressBookEditMode.edit}
                        viewMode={BoostAddressBookViewMode.full}
                        _issueTo={_issueTo}
                        _setIssueTo={_setIssueTo}
                    />
                )}
                {!loading && connections.length === 0 && search?.length === 0 && !searchLoading && (
                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                        <div className="max-w-[200px] m-auto flex justify-center">
                            <Lottie
                                loop
                                animationData={Pulpo}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <strong>No connections yet</strong>
                    </section>
                )}

                {searchLoading && search?.length > 0 && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
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
                {search?.length > 0 &&
                    searchResults &&
                    searchResults?.length > 0 &&
                    !searchLoading && (
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
                {!searchLoading &&
                    search?.length > 0 &&
                    searchResults &&
                    searchResults.length === 0 && (
                        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <div className="max-w-[200px] m-auto flex justify-center">
                                <Lottie
                                    loop
                                    animationData={Pulpo}
                                    play
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <strong>No search results</strong>
                        </section>
                    )}
            </IonContent>
            <IonFooter className="ion-no-border pb-[15px] bg-white" color="white">
                <IonToolbar color="white" className="ion-no-border pt-5 bg-white">
                    <IonRow className="w-full flex items-center justify-center">
                        <div className="w-full max-w-[600px] flex items-center justify-center px-4">
                            <IonCol size="12" className="w-full flex items-center justify-between">
                                <button
                                    onClick={handleSaveContacts}
                                    className="relative flex flex-1 items-center justify-center bg-emerald-700 rounded-full px-[18px] py-[8px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide text-center"
                                >
                                    {buttonText}
                                </button>
                            </IonCol>
                        </div>
                    </IonRow>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default BoostSearch;
