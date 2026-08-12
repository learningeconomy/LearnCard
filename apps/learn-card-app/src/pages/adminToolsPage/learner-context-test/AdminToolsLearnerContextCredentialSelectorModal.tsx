import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import { IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonToolbar } from '@ionic/react';
import type { CredentialRecord } from '@learncard/types';

import {
    categoryMetadata,
    useGetCredentialCount,
    useGetCredentialList,
    useModal,
} from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base';
import useOnScreen from '../../../../../../packages/learn-card-base/src/hooks/useOnScreen';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import CaretLeft from '../../../components/svgs/CaretLeft';
import { getInfoFromContractKey } from '../../../helpers/contract.helpers';

type AdminToolsLearnerContextCredentialSelectorModalProps = {
    category: string;
    selectedUris: string[];
    onSave: (uris: string[]) => void;
};

type LearnerContextCredentialRecord = CredentialRecord<{
    category: CredentialCategory;
    title?: string;
    imgUrl?: string;
}>;

const AdminToolsLearnerContextCredentialSelectorModal: FC<
    AdminToolsLearnerContextCredentialSelectorModalProps
> = ({ category, selectedUris, onSave }) => {
    const { closeModal } = useModal();
    const infiniteScrollRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
    const [workingSelection, setWorkingSelection] = useState<string[]>(selectedUris);

    const { IconComponent, title, plural } = getInfoFromContractKey(category);
    const { data: count } = useGetCredentialCount(category as CredentialCategory);
    const {
        data: records,
        hasNextPage,
        fetchNextPage,
    } = useGetCredentialList(category as CredentialCategory);

    const allCreds = records?.pages.flatMap(page => page?.records ?? []) ?? [];
    const totalCount = typeof count === 'number' ? count : 0;

    const onScreen = useOnScreen(infiniteScrollRef, '200px', [allCreds.length]);

    useEffect(() => {
        setWorkingSelection(selectedUris);
    }, [selectedUris]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    const saveAndClose = () => {
        onSave(workingSelection);
        closeModal();
    };

    const toggleCredentialSelected = (credential: LearnerContextCredentialRecord) => {
        setWorkingSelection(current => {
            if (current.includes(credential.uri)) {
                return current.filter(uri => uri !== credential.uri);
            }

            return [...current, credential.uri];
        });
    };

    const handleSelectAllLoaded = () => {
        setWorkingSelection(Array.from(new Set(allCreds.map(record => record.uri))));
    };

    const handleSelectAll = async () => {
        let currentHasNextPage = hasNextPage;
        while (currentHasNextPage) {
            const { hasNextPage: newHasNextPage } = await fetchNextPage();
            currentHasNextPage = newHasNextPage;
        }
        const allLoadedUris = allCreds.map(record => record.uri);
        setWorkingSelection(Array.from(new Set(allLoadedUris)));
    };

    const handleClear = () => {
        setWorkingSelection([]);
    };

    return (
        <IonPage className="bg-grayscale-100 text-grayscale-900 pt-5">
            <IonHeader className="ion-no-border flex items-center px-5 gap-3">
                <IonToolbar className="ion-no-border flex items-center gap-3" color="grayscale-100">
                    <IonGrid>
                        <IonRow className="w-full flex items-center gap-3 max-w-[860px] mx-auto">
                            <IonCol size="12" className="flex items-center gap-3">
                                <button type="button" onClick={saveAndClose} className="shrink-0">
                                    <CaretLeft />
                                </button>

                                <IconComponent className="h-[30px] w-[30px] shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-poppins text-xl line-clamp-1">{title}</h3>
                                    <p className="text-sm text-grayscale-600 font-notoSans">
                                        Choose which {plural.toLowerCase()} to include in the
                                        learner context request.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={saveAndClose}
                                    className="rounded-full bg-emerald-700 text-white px-4 py-2 text-sm font-[600] font-notoSans"
                                >
                                    Save
                                </button>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>

            <IonContent className="transparent-modal-backdrop" color="transparent">
                <IonGrid className="p-0 h-full w-full flex flex-col items-center gap-3">
                    <IonRow className="px-5 pb-5 w-full max-w-[860px]">
                        <IonCol
                            size="12"
                            className="w-full bg-white rounded-[15px] shadow-box-bottom py-4 px-5"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h4 className="text-grayscale-900 text-lg font-[600] font-notoSans">
                                        Selected {workingSelection.length}/{totalCount}
                                    </h4>
                                    <p className="text-grayscale-600 text-sm font-notoSans">
                                        These credentials will be resolved locally and sent to the
                                        backend as raw verifiable credentials.
                                    </p>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        disabled={totalCount === 0}
                                        className="rounded-full bg-emerald-700 text-white px-4 py-2 text-sm font-[600] font-notoSans disabled:opacity-50"
                                    >
                                        Select All ({totalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        disabled={workingSelection.length === 0}
                                        className="rounded-full border border-grayscale-200 bg-white px-4 py-2 text-sm font-[600] font-notoSans disabled:opacity-50"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </IonCol>
                    </IonRow>

                    {allCreds.length > 0 && (
                        <IonRow className="px-5 pb-10 flex justify-center items-start bg-grayscale-300 relative z-0 h-full w-full">
                            <section className="w-full max-w-[860px] flex flex-wrap gap-4 justify-center py-[10px]">
                                {allCreds.map((record, index) => {
                                    const isSelected = workingSelection.includes(record.uri);
                                    const categoryImgUrl =
                                        categoryMetadata[record.category as CredentialCategory]
                                            ?.defaultImageSrc;
                                    const isLastCredential = index === allCreds.length - 1;

                                    return (
                                        <div
                                            className="flex justify-center items-center"
                                            key={record.uri}
                                            ref={isLastCredential ? infiniteScrollRef : undefined}
                                        >
                                            <BoostEarnedCard
                                                className="[&>button>.check-btn-overlay]:right-[5px] [&>button>.check-btn-overlay]:left-[unset] shrink-0"
                                                record={record}
                                                defaultImg={categoryImgUrl}
                                                categoryType={record.category}
                                                verifierState
                                                onCheckMarkClick={() => {
                                                    toggleCredentialSelected(record);
                                                }}
                                                initialCheckmarkState={isSelected}
                                                showChecked
                                            />
                                        </div>
                                    );
                                })}
                            </section>
                        </IonRow>
                    )}

                    {allCreds.length === 0 && (
                        <IonRow className="px-5 pb-10 w-full max-w-[860px]">
                            <IonCol
                                size="12"
                                className="w-full bg-white rounded-[15px] shadow-box-bottom py-8 px-5 text-center"
                            >
                                <p className="text-grayscale-600 font-notoSans">
                                    No credentials found in this category yet.
                                </p>
                            </IonCol>
                        </IonRow>
                    )}
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default AdminToolsLearnerContextCredentialSelectorModal;
