import React, { useState, useRef, useEffect } from 'react';

import {
    useModal,
    useResolveBoost,
    useCountBoostChildren,
    useGetCredentialWithEdits,
    useGetPaginatedBoostChildren,
    CredentialCategoryEnum,
    lazyWithRetry,
} from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import X from '../../components/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
const TroopsCMSWrapper = lazyWithRetry(() => import('../../components/troopsCMS/TroopsCMSWrapper'));
const TroopListItemCard = lazyWithRetry(() => import('./TroopListItemCard'));

import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { IonRow, IonCol, IonInput, IonSpinner } from '@ionic/react';

import { pluralize, ModalTypes } from 'learn-card-base';
import { TroopsCMSViewModeEnum } from '../../components/troopsCMS/troopCMSState';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { TroopParentLevel, troopParentLevelToChildDepth } from './troopConstants';

type TroopsModalProps = {
    credentialType: CredentialCategoryEnum.troops;
    networkName?: string | undefined;
    globalNetworkName?: string;
    uri: string;
    showNetwork?: boolean;
    parentLevel: TroopParentLevel;
};

const TroopsModal: React.FC<TroopsModalProps> = ({
    credentialType,
    networkName,
    uri,
    showNetwork,
    parentLevel = TroopParentLevel.national,
}) => {
    const { closeModal, newModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const [search, setSearch] = useState<string>('');

    const handleOpenTroopsCMSModal = () => {
        newModal(
            <TroopsCMSWrapper
                viewMode={TroopsCMSViewModeEnum.troop}
                handleCloseModal={() => closeModal()}
                parentUri={uri}
            />
        );
    };

    const getCredentialMeta = () => {
        switch (credentialType) {
            case CredentialCategoryEnum.troops:
                return {
                    title: 'Troop',
                    icon: <GreenScoutsPledge2 className="h-[50px] w-[50px]" />,
                    color: 'sp-green-forest',
                };
        }
    };

    const { data: troopsCount } = useCountBoostChildren(uri, 2, {
        type: AchievementTypes.Troop,
    });

    const { data: boostData, isLoading: boostLoading } = useResolveBoost(uri);
    const { credentialWithEdits } = useGetCredentialWithEdits(boostData, uri);

    const _networkName = networkName || credentialWithEdits?.name || boostData?.name;

    const { title, icon, color } = getCredentialMeta();

    return (
        <>
            <header className="flex items-center px-[20px] py-[15px] bg-white gap-[10px] w-full justify-center sticky top-0 z-[1001]">
                <div className="flex w-full max-w-[600px] gap-[10px]">
                    {icon}
                    <div className="flex flex-col">
                        <span className="text-grayscale-900 text-[22px] font-notoSans leading-[130%] tracking-[-0.25px]">
                            <span className="mr-[5px]">{troopsCount}</span>
                            <span className={`font-[600] font-notoSans text-${color}`}>
                                {pluralize(title, troopsCount ?? 0)}
                            </span>
                        </span>
                        <span className="text-grayscale-800 font-notoSans text-[14px] font-[600]">
                            {_networkName}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="w-[30px] absolute top-[15px] right-[20px] z-[20]"
                        onClick={closeModal}
                    >
                        <X className="text-grayscale-900 h-[30px] w-[30px]" />
                    </button>
                </div>
            </header>
            <section className="flex flex-col h-full w-full bg-white items-center shadow-bottom-1-4 ">
                <section className="bg-grayscale-100 grow w-full flex flex-col items-center">
                    <div className="flex items-center justify-between w-full max-w-[600px] px-[15px]">
                        <IonRow class="w-full max-w-[600px] mt-6 ion-no-padding">
                            <IonCol className="flex w-full items-center justify-start ion-no-padding gap-[10px]">
                                <IonInput
                                    autocapitalize="on"
                                    placeholder="Search Troop Titles..."
                                    value={search}
                                    className="bg-white text-grayscale-800 !px-4 !py-1 rounded-[15px] text-[17px] font-notoSans"
                                    onIonInput={e => setSearch(e?.detail?.value)}
                                    type="text"
                                    clearInput
                                />
                                <button
                                    onClick={handleOpenTroopsCMSModal}
                                    className={`p-[10px] rounded-full bg-${color}`}
                                >
                                    <Plus className="h-[25px] w-[25px] text-white" />
                                </button>
                            </IonCol>
                        </IonRow>
                    </div>
                    <div className="w-full max-w-[600px]">
                        <TroopList
                            showNetwork={showNetwork}
                            search={search}
                            uri={uri}
                            parentLevel={parentLevel}
                        />
                    </div>
                </section>
            </section>
        </>
    );
};

export default TroopsModal;

type TroopListProps = {
    uri: string;
    parentLevel?: TroopParentLevel;
    search?: string;
    showNetwork?: boolean;
};

const TroopList: React.FC<TroopListProps> = ({
    uri,
    parentLevel = TroopParentLevel.national,
    search,
    showNetwork,
}) => {
    const {
        data: boostChildren,
        isLoading: boostChildrenLoading,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedBoostChildren(uri, troopParentLevelToChildDepth[parentLevel], {
        type: AchievementTypes.Troop,
        name: { $regex: `/${search}/i` },
    });

    const managedBoostInfiniteScrollRef = useRef<HTMLDivElement>(null);

    const onScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '0px', [
        boostChildren?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (hasNextPage && onScreen) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, onScreen, managedBoostInfiniteScrollRef]);

    if (!boostChildren && boostChildrenLoading) {
        return (
            <div className="w-full px-[20px] flex justify-center">
                <IonSpinner />
            </div>
        );
    }

    const renderTroopList = boostChildren?.pages?.flatMap(
        page =>
            page?.records?.map((record, index) => {
                return (
                    <TroopListItemCard showNetwork={showNetwork} key={record?.uri} boost={record} />
                );
            }) ?? []
    );

    return (
        <div className="w-full px-[20px] pb-[20px]">
            {renderTroopList}
            {isFetching && (
                <div className="w-full flex items-center justify-center">
                    <IonSpinner
                        name="crescent"
                        color="grayscale-900"
                        className="scale-[2] mb-8 mt-6"
                    />
                </div>
            )}
            <div role="presentation" ref={managedBoostInfiniteScrollRef} />
        </div>
    );
};
