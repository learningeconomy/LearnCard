import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { ConsentFlowTerm, CredentialRecord } from '@learncard/types';
import { TYPE_TO_IMG_SRC } from '@learncard/react';
import { Updater } from 'use-immer';
import { capitalizeFirstLetter } from '@learncard/helpers';
import {
    IonCheckbox,
    IonCol,
    IonContent,
    IonDatetime,
    IonGrid,
    IonHeader,
    useIonModal,
    IonPage,
    IonRow,
    IonToggle,
    IonToolbar,
} from '@ionic/react';

import { CATEGORY_TO_WALLET_SUBTYPE } from 'learn-card-base/helpers/credentialHelpers';
import {
    useGetCredentialList,
    useGetCredentialCount,
    CredentialCategory,
    useModal,
} from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import Calendar from '../../components/svgs/Calendar';
import { getInfoFromContractKey } from '../../helpers/contract.helpers';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import ConsentFlowSelectiveSharingWarning from './ConsentFlowSelectiveSharingWarning';
import { CredentialMetadata } from 'learn-card-base/types/credential-records';

type ConsentFlowReadSharingModalProps = {
    term: ConsentFlowTerm;
    setTerm: Updater<ConsentFlowTerm>;
    category: string;
    required?: boolean;
    contractOwnerDid: string;
};

const ConsentFlowReadSharingModal: React.FC<ConsentFlowReadSharingModalProps> = ({
    term: initialTerm,
    setTerm: saveTerm,
    category,
    required,
    contractOwnerDid,
}) => {
    const { newModal, closeModal } = useModal();
    const infiniteScrollRef = useRef<HTMLDivElement>(null);

    const [term, setTerm] = useState(initialTerm);
    const [onContinue, setOnContinue] = useState(() => () => { });
    const [formerSharedUris, setFormerSharedUris] = useState<string[]>();

    const { IconComponent, plural } = getInfoFromContractKey(category);

    const [presentDatePicker] = useIonModal(
        <div className="w-full h-full transparent flex items-center justify-center">
            <IonDatetime
                onIonChange={e => {
                    setTerm({ ...term, shareUntil: moment(e.detail.value).toISOString() });
                }}
                value={term?.shareUntil ? moment(term?.shareUntil).format('YYYY-MM-DD') : null}
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                showDefaultButtons
                color="indigo-500"
                max="2050-12-31"
                min={moment().format('YYYY-MM-DD')}
            />
        </div>
    );

    const { data: count } = useGetCredentialCount(category as CredentialCategory);

    const {
        data: records,
        hasNextPage,
        fetchNextPage,
    } = useGetCredentialList(category as CredentialCategory);

    const onScreen = useOnScreen(infiniteScrollRef as any, '-300px', [
        records?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    const allCreds = records?.pages.flatMap(page => page?.records);
    const allUris = allCreds?.map(credential => credential?.uri) ?? [];

    const totalCount = typeof count === 'number' ? count : '?';

    const saveAndClose = () => {
        saveTerm(term);
        closeModal();
    };

    const getAlreadySharedUri = (credential: CredentialRecord<CredentialMetadata>) => {
        return credential.sharedUris?.[contractOwnerDid]?.at(-1);
    };

    const getIsSelected = (credential: CredentialRecord<CredentialMetadata>) => {
        const alreadySharedUri = getAlreadySharedUri(credential);
        return term.shared?.some(
            termUri => credential.uri === termUri || alreadySharedUri === termUri
        );
    };

    const toggleCredentialSelected = (credential: CredentialRecord<CredentialMetadata>) => {
        const alreadySharedUri = getAlreadySharedUri(credential);
        const isSelected = getIsSelected(credential);

        if (term.shareAll) {
            newModal(
                <ConsentFlowSelectiveSharingWarning
                    onContinue={() => {
                        setTerm({
                            ...term,
                            shareAll: false,
                            shared: allUris.filter(
                                uri => uri !== credential.uri && uri !== alreadySharedUri
                            ),
                        });
                    }}
                />,
                {
                    sectionClassName: '!max-w-[350px] !shadow-none !bg-transparent',
                    hideButton: true,
                }
            );
            return;
        }

        setTerm({
            ...term,
            shareAll: false,
            shared: isSelected
                ? term?.shared?.filter(uri => uri !== credential.uri && uri !== alreadySharedUri)
                : [...(term.shared ?? []), alreadySharedUri || credential.uri],
        });
    };

    const handleLiveSyncing = () => {
        if (term.shareAll) {
            return;
        }

        if (term.sharing) {
            setFormerSharedUris(term.shared ?? []);
        }

        const allSharedUris = allCreds
            ?.map(cred => {
                if (!cred) return;
                return getAlreadySharedUri(cred) ?? cred.uri;
            })
            .filter(c => !!c);

        setTerm({ ...term, shared: allSharedUris, shareAll: true, sharing: true });
    };

    const handleSelectiveSharing = () => {
        setTerm({
            ...term,
            shared: formerSharedUris ?? (term.shareAll ? [] : term.shared),
            shareAll: false,
            sharing: true,
        });
        setFormerSharedUris(undefined);
    };

    const handleNotSharing = () => {
        setFormerSharedUris(term.shared);
        setTerm({
            ...term,
            shareAll: false,
            sharing: false,
            shared: [],
        });
    };

    return (
        <IonPage className="bg-grayscale-100 text-grayscale-900 pt-5">
            <IonHeader className="ion-no-border flex items-center px-5 gap-3">
                <IonToolbar className="ion-no-border flex items-center gap-3" color="grayscale-100">
                    <IonGrid>
                        <IonRow className="w-full flex items-center gap-3 max-w-[760px] mx-auto">
                            <IonCol size="12" className="flex items-center gap-3">
                                <button type="button" onClick={saveAndClose} className="shrink-0">
                                    <CaretLeft />
                                </button>

                                <IconComponent className="h-[30px] w-[30px] shrink-0" />

                                <h3 className="font-poppins text-xl flex-1">
                                    {capitalizeFirstLetter(plural)}
                                </h3>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>

            <IonContent className="transparent-modal-backdrop" color="transparent">
                <IonGrid className="p-0 h-full w-full flex flex-col items-center gap-3">
                    <IonRow className="px-5 pb-5 w-full max-w-[800px]">
                        <IonCol
                            size="12"
                            className="w-full bg-white rounded-[15px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] py-2 px-5"
                        >
                            <fieldset className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3">
                                <section className="w-full justify-between items-center flex gap-3">
                                    <label
                                        onClick={handleLiveSyncing}
                                        htmlFor={`${category}-share-all`}
                                        className="flex flex-col flex-1 gap-1"
                                    >
                                        <h6 className="text-grayscale-900 text-lg font-poppins">
                                            Live Syncing
                                        </h6>
                                        <span className="text-grayscale-700 text-sm font-poppins">
                                            Continuously share all {plural}.
                                        </span>
                                    </label>

                                    <IonCheckbox
                                        id={`${category}-share-all`}
                                        color="emerald-700"
                                        className="shrink-0 h-8 w-8"
                                        mode="ios"
                                        checked={term.shareAll && term.sharing}
                                        onClick={handleLiveSyncing}
                                    />
                                </section>

                                {term.shareAll && (
                                    <section className="w-full items-center justify-between flex gap-3">
                                        <label
                                            onClick={() =>
                                                setTerm({
                                                    ...term,
                                                    shareAll: term.shareAll || !term.shareUntil,
                                                    shareUntil: term.shareUntil
                                                        ? ''
                                                        : moment().add(30, 'days').toISOString(),
                                                })
                                            }
                                            className="text-sm font-poppins text-grayscale-900"
                                        >
                                            Set an expiration date?
                                        </label>
                                        <IonToggle
                                            color="emerald-700"
                                            className="shrink-0"
                                            mode="ios"
                                            checked={Boolean(term.shareUntil)}
                                            onClick={() =>
                                                setTerm({
                                                    ...term,
                                                    shareAll: term.shareAll || !term.shareUntil,
                                                    shareUntil: term.shareUntil
                                                        ? ''
                                                        : moment().add(30, 'days').toISOString(),
                                                })
                                            }
                                        />
                                    </section>
                                )}

                                {term.shareUntil && (
                                    <button
                                        disabled={!term.shareAll}
                                        className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[16px] py-[12px] font-medium tracking-widest text-base"
                                        onClick={() => {
                                            presentDatePicker({
                                                backdropDismiss: true,
                                                showBackdrop: false,
                                                cssClass: 'flex items-center justify-center',
                                            });
                                        }}
                                    >
                                        {moment(term.shareUntil).format('MMMM Do, YYYY')}
                                        <Calendar className="w-[30px] text-grayscale-700" />
                                    </button>
                                )}
                            </fieldset>

                            <fieldset className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3">
                                <section className="w-full justify-between items-center flex gap-3">
                                    <label
                                        onClick={handleSelectiveSharing}
                                        className="flex flex-col flex-1 gap-1"
                                    >
                                        <h6 className="text-grayscale-900 text-lg font-poppins">
                                            Selective Sharing
                                        </h6>
                                        <span className="text-grayscale-700 text-sm font-poppins">
                                            Only share selected {plural}.
                                        </span>
                                    </label>

                                    <IonCheckbox
                                        color="emerald-700"
                                        className="shrink-0 h-8 w-8"
                                        mode="ios"
                                        checked={!term.shareAll && term.sharing}
                                        onClick={handleSelectiveSharing}
                                    />
                                </section>
                            </fieldset>

                            <fieldset className="w-full flex flex-col gap-3 py-3">
                                <section className="w-full justify-between items-center flex gap-3">
                                    <label
                                        onClick={handleNotSharing}
                                        className="flex flex-col flex-1 gap-1"
                                    >
                                        <h6 className="text-grayscale-900 text-lg font-poppins">
                                            Not Sharing
                                        </h6>
                                        <span className="text-grayscale-700 text-sm font-poppins">
                                            Don't share any {plural}.
                                        </span>
                                    </label>

                                    <IonCheckbox
                                        color="emerald-700"
                                        className="shrink-0 h-8 w-8"
                                        mode="ios"
                                        checked={!term.sharing}
                                        onClick={handleNotSharing}
                                    />
                                </section>
                            </fieldset>
                        </IonCol>
                    </IonRow>

                    {term.sharing && (
                        <IonRow className="flex-1 w-full">
                            <IonCol size="12" className="w-full flex flex-col px-0">
                                <header className="w-full flex justify-center sticky -top-1 z-10 p-5 border-t border-solid border-grayscale-300 bg-grayscale-100">
                                    <section className="flex justify-between w-full max-w-[800px]">
                                        <output className="text-lg font-semibold font-poppins">
                                            Sharing{' '}
                                            {term.shareAll ? totalCount : term.shared?.length ?? 0}/
                                            {totalCount}
                                        </output>

                                        {term.shareAll && (
                                            <output className="rounded-[20px] pl-4 pr-3 py-1 flex items-center gap-1 bg-grayscale-50 text-emerald-800">
                                                <span className="font-poppins text-sm font-semibold">
                                                    Live Syncing All
                                                </span>
                                                <Checkmark className="h-5 w-5" strokeWidth="3" />
                                            </output>
                                        )}
                                    </section>
                                </header>

                                <IonRow className="px-5 pb-5 flex justify-center bg-grayscale-300 relative z-0">
                                    <section className="w-full max-w-[800px] flex flex-wrap">
                                        {records?.pages.flatMap(page => {
                                            return page?.records.map(record => {
                                                const isSelected = getIsSelected(record);

                                                const categoryImgUrl =
                                                    TYPE_TO_IMG_SRC[
                                                    CATEGORY_TO_WALLET_SUBTYPE[record.category]
                                                    ];

                                                return (
                                                    <BoostEarnedCard
                                                        className="[&>button>.check-btn-overlay]:right-[5px] [&>button>.check-btn-overlay]:left-[unset]"
                                                        key={record.uri}
                                                        record={record}
                                                        defaultImg={categoryImgUrl}
                                                        categoryType={record.category}
                                                        verifierState
                                                        onCheckMarkClick={() => {
                                                            toggleCredentialSelected(record);
                                                        }}
                                                        initialCheckmarkState={
                                                            term.shareAll || isSelected
                                                        }
                                                        showChecked
                                                    />
                                                );
                                            });
                                        })}
                                    </section>
                                    <div role="presentation" ref={infiniteScrollRef} />
                                </IonRow>
                            </IonCol>
                        </IonRow>
                    )}
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ConsentFlowReadSharingModal;
