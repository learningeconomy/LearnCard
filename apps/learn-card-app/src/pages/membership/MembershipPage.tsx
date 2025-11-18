import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'react-lottie-player';
import { ErrorBoundary } from 'react-error-boundary';
import BoostErrorsDisplay, {
    ErrorBoundaryFallback,
} from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { IonContent, IonPage } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import HourGlass from '../../assets/lotties/hourglass.json';

import { useGetBoosts, usePathQuery } from 'learn-card-base';
import {
    CurvedBackdropEl,
    CredentialListTabEnum,
    EarnedAndManagedTabs,
    CredentialCategoryEnum,
    useGetResolvedBoostsFromCategory,
    useIsCurrentUserLCNUser,
    useGetCredentialList,
    useGetCredentialCount,
} from 'learn-card-base';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { TYPE_TO_IMG_SRC, WALLET_SUBTYPES } from '@learncard/react';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import BoostEarnedIDCard from '../../components/boost/boost-earned-card/BoostEarnedIDCard';
import BoostManagedIDCard from '../../components/boost/boost-managed-card/BoostManagedIDCard';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

const MembershipPage: React.FC = () => {
    const infiniteScrollRef = useRef<HTMLDivElement>(null);

    const query = usePathQuery();

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    const {
        data: records,
        isLoading: credentialsLoading,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList('Membership');

    const { data: credentialCount, isLoading: countLoading } = useGetCredentialCount('Membership');

    const onScreen = useOnScreen(infiniteScrollRef as any, '-300px', [
        records?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    //Query gets 'managed' boosts
    const {
        data: boosts,
        isLoading: boostsLoading,
        refetch: managedBoostRefetch,
        error: managedBoostsError,
    } = useGetBoosts(CredentialCategoryEnum.membership);

    const managedBoostCount = boosts?.length || 0;

    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.MEMBERSHIP];

    const boostError = managedBoostsError || earnedBoostsError ? true : false;

    const credentials =
        records?.pages?.flatMap(page =>
            page?.records?.map((record, index) => {
                return (
                    <BoostEarnedIDCard
                        key={record?.uri || index}
                        record={record}
                        defaultImg={imgSrc}
                        categoryType={BoostCategoryOptionsEnum.membership}
                    />
                );
            })
        ) ?? [];

    const renderBoostsList = boosts?.map((boost, index) => {
        if (!boost) return <></>;

        return (
            <BoostManagedIDCard
                key={boost.uri || index}
                boost={boost}
                defaultImg={imgSrc}
                categoryType={BoostCategoryOptionsEnum.membership}
            />
        );
    });

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
            await managedBoostRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    return (
        <IonPage className="bg-white">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader showBackButton subheaderType={SubheaderTypeEnum.Membership}>
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            containerClassName="px-[5px]"
                            className="bg-teal-300"
                            earnedCount={(credentialCount as number) || 0}
                            managedCount={managedBoostCount}
                        />
                    )}
                </MainHeader>
                <IonContent fullscreen color={'teal-400'}>
                    <CurvedBackdropEl className="bg-teal-300" />
                    <div className="w-full flex items-center justify-center mt-8">
                        {credentialsLoading &&
                            activeTab === CredentialListTabEnum.Earned &&
                            !boostError && (
                                <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                                    <div className="max-w-[280px] mt-[-40px]">
                                        <Lottie
                                            loop
                                            animationData={HourGlass}
                                            play
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </section>
                            )}
                        {!credentialsLoading &&
                            !boostError &&
                            records &&
                            credentials.length > 0 &&
                            activeTab === CredentialListTabEnum.Earned && (
                                <section className="relative flex flex-wrap text-center justify-center items-center max-w-[800px]">
                                    <div className="bg-filler bg-teal-300 absolute h-full mt-[200px] w-[3000px]" />
                                    {credentials}
                                    <div role="presentation" ref={infiniteScrollRef} />
                                </section>
                            )}
                        {!credentialsLoading &&
                            !boostError &&
                            records &&
                            credentials.length === 0 &&
                            activeTab === CredentialListTabEnum.Earned && (
                                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                    <img src={imgSrc} alt="ids" className="max-w-[250px] m-auto" />
                                    <strong>No Memberships yet.</strong>
                                </section>
                            )}

                        {boostsLoading &&
                            activeTab === CredentialListTabEnum.Managed &&
                            !boostError && (
                                <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                                    <div className="max-w-[280px] mt-[-10px]">
                                        <Lottie
                                            loop
                                            animationData={HourGlass}
                                            play
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </section>
                            )}
                        {!boostsLoading &&
                            !boostError &&
                            boosts &&
                            boosts?.length > 0 &&
                            activeTab === CredentialListTabEnum.Managed && (
                                <section className="relative flex flex-wrap text-center justify-center items-center max-w-[800px]">
                                    <div className="bg-filler bg-teal-300 absolute h-full mt-[200px] w-[3000px]" />
                                    {renderBoostsList}
                                </section>
                            )}
                        {!boostsLoading &&
                            !boostError &&
                            boosts &&
                            boosts?.length === 0 &&
                            activeTab === CredentialListTabEnum.Managed && (
                                <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                    <img src={imgSrc} alt="ids" className="max-w-[250px] m-auto" />
                                    <strong>No boosts to manage yet</strong>
                                </section>
                            )}
                        {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default MembershipPage;
