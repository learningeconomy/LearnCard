import React, { useState, useRef, useEffect } from 'react';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { useModal, useGetPaginatedBoostChildren, ModalTypes } from 'learn-card-base';

import X from '../../components/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import TroopsCMSWrapper from '../../components/troopsCMS/TroopsCMSWrapper';
import TroopListItemCard from './TroopListItemCard';

import { OrangeScoutsNetworkTent } from 'learn-card-base/svgs/ScoutsNetworkTent';
import { IonRow, IonCol, IonInput, useIonModal, IonSpinner } from '@ionic/react';

import { pluralize } from 'learn-card-base';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { TroopsCMSViewModeEnum } from '../../components/troopsCMS/troopCMSState';

export enum TroopParentLevel {
    global,
    national,
}

const troopParentLevelToChildDepth = {
    [TroopParentLevel.global]: 2,
    [TroopParentLevel.national]: 1,
};

type NetworkListDisplayProps = {
    count: number | undefined;
    networkName: string;
    globalNetworkName?: string;
    uri: string;
    parentLevel: TroopParentLevel;
};

const NetworkListDisplay: React.FC<NetworkListDisplayProps> = ({
    count,
    networkName,
    uri,
    parentLevel = TroopParentLevel.national,
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const presentTroopsCMS = () => {
        newModal(
            <TroopsCMSWrapper
                handleCloseModal={() => closeModal()}
                viewMode={TroopsCMSViewModeEnum.network}
                parentUri={uri}
            />
        );
    };

    const [search, setSearch] = useState<string>('');

    const getCredentialMeta = () => {
        return {
            title: 'National Network',
            icon: <OrangeScoutsNetworkTent className="h-[50px] w-[50px]" />,
            color: 'sp-fire-red',
        };
    };

    const { title, icon, color } = getCredentialMeta();

    return (
        <>
            <header className="flex items-center px-[20px] py-[15px] bg-white gap-[10px] w-full justify-center sticky top-0 z-[1001]">
                <div className="flex w-full max-w-[600px] gap-[10px]">
                    {icon}
                    <div className="flex flex-col">
                        <span className="text-grayscale-900 text-[22px] font-notoSans leading-[130%] tracking-[-0.25px]">
                            <span className="mr-[5px]">{count}</span>
                            <span className={`font-[600] font-notoSans text-${color}`}>
                                {pluralize(title, count ?? 0)}
                            </span>
                        </span>
                        <span className="text-grayscale-800 font-notoSans text-[14px] font-[600]">
                            {networkName}
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
                                    placeholder="Search network titles..."
                                    value={search}
                                    className="bg-white text-grayscale-800 !px-4 !py-1 rounded-[15px] text-[17px] font-notoSans"
                                    onIonInput={e => setSearch(e?.detail?.value)}
                                    type="text"
                                    clearInput
                                />
                                <button
                                    onClick={() => presentTroopsCMS()}
                                    className={`p-[10px] rounded-full bg-${color}`}
                                >
                                    <Plus className="h-[25px] w-[25px] text-white" />
                                </button>
                            </IonCol>
                        </IonRow>
                    </div>
                    <div className="w-full max-w-[600px]">
                        <NetworkList search={search} uri={uri} parentLevel={parentLevel} />
                    </div>
                </section>
            </section>
        </>
    );
};

export default NetworkListDisplay;

type TroopListProps = {
    uri: string;
    parentLevel?: TroopParentLevel;
    search?: string;
};

const NetworkList: React.FC<TroopListProps> = ({
    uri,
    parentLevel = TroopParentLevel.national,
    search,
}) => {
    const {
        data: boostChildren,
        isLoading: boostChildrenLoading,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedBoostChildren(uri, troopParentLevelToChildDepth[parentLevel], {
        type: AchievementTypes.Network,
        name: { $regex: `/${search}/i` },
    });

    const managedBoostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const renderTroopsList =
        boostChildren?.pages?.flatMap(page =>
            page?.records?.map((record, index) => {
                return (
                    <TroopListItemCard
                        customMemberName={'Admin'}
                        key={record?.uri}
                        boost={record}
                    />
                );
            })
        ) ?? [];

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

    return (
        <div className="w-full px-[20px] pb-8">
            {renderTroopsList}
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
