import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { IonContent, IonPage, IonCol, IonGrid, IonRow } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import BoostManagedCard from '../../components/boost/boost-managed-card/BoostManagedCard';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import { TYPE_TO_IMG_SRC, WALLET_SUBTYPES } from '@learncard/react';

import {
    CurvedBackdropEl,
    EarnedAndManagedTabs,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    useGetBoosts,
    useGetCredentials,
    useIsCurrentUserLCNUser,
    VC_WITH_URI,
    BrandingEnum,
} from 'learn-card-base';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { usePathQuery } from 'learn-card-base';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import Lottie from 'react-lottie-player';
import HourGlass from '../../assets/lotties/hourglass.json';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

const WorkHistoryPage: React.FC = () => {
    const query = usePathQuery();

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    //Query gets 'managed' boosts
    const {
        data: boosts,
        isLoading: boostsLoading,
        refetch: managedBoostRefetch,
        error: managedBoostsError,
    } = useGetBoosts(CredentialCategoryEnum.workHistory);
    const {
        data: vcs,
        isLoading: loading,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentials('Work History', undefined, true);

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.JOB_HISTORY];

    // Upon initially loading component, read wallet contents
    /* the filtering step is to handle old wallets that may have different VCs on their index that have the same uri */
    const credentials = vcs
        ?.filter(
            (v: VC_WITH_URI, i: number, a: VC_WITH_URI[]) =>
                a?.findIndex((v2: VC_WITH_URI) => v2?.uri === v?.uri) === i
        )
        ?.map((vcWithUri: VC_WITH_URI, index: number) => {
            return (
                <BoostEarnedCard
                    key={vcWithUri?.uri || index}
                    credential={vcWithUri?.vc}
                    uri={vcWithUri?.uri}
                    defaultImg={imgSrc}
                    categoryType={BoostCategoryOptionsEnum.workHistory}
                />
            );
        });

    const renderBoostsList = boosts?.map((boost, index: number) => {
        if (!boost) return <></>;

        return (
            <BoostManagedCard
                key={boost?.uri || index}
                boost={boost}
                defaultImg={imgSrc}
                categoryType={BoostCategoryOptionsEnum.workHistory}
            />
        );
    });

    const boostError = managedBoostsError || earnedBoostsError ? true : false;

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
                <MainHeader showBackButton subheaderType={SubheaderTypeEnum.Job} branding={BrandingEnum.scoutPass}>
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-rose-300"
                        />
                    )}
                </MainHeader>
                <IonContent fullscreen className="job-history-page relative" color={'rose-400'}>
                    <CurvedBackdropEl className="bg-rose-300" />
                    {loading && activeTab === CredentialListTabEnum.Earned && !boostError && (
                        <section className="relative loading-spinner-container flex items-center justify-center h-[80%] w-full ">
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
                    {!loading &&
                        vcs &&
                        vcs?.length > 0 &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !boostError && (
                            <>
                                <IonCol className="flex m-auto items-center flex-wrap  w-full achievements-list-container">
                                    <IonGrid className="max-w-[600px]">
                                        <IonRow> {credentials}</IonRow>
                                    </IonGrid>
                                    <div className="bg-filler bg-rose-300 absolute h-full top-[0px] left-[0px] w-full mt-[200px]" />
                                </IonCol>
                            </>
                        )}
                    {!loading &&
                        vcs &&
                        vcs?.length === 0 &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !boostError && (
                            <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="Work History"
                                    className="relative w-[250px] h-[250px] m-auto z-[1000]"
                                />
                                <div className="bg-filler bg-rose-300 absolute h-full w-full mt-[200px]" />
                                <strong className="relative">No work history yet</strong>
                            </section>
                        )}

                    {boostsLoading && activeTab === CredentialListTabEnum.Managed && !boostError && (
                        <section className="relative loading-spinner-container flex items-center justify-center h-[80%] w-full ">
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
                    {!boostsLoading &&
                        boosts &&
                        !boostError &&
                        boosts?.length > 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <>
                                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <IonGrid className="max-w-[600px]">
                                        <IonRow>{renderBoostsList}</IonRow>
                                    </IonGrid>
                                    <div className="bg-filler bg-rose-300 absolute h-full top-[0px] left-[0px] w-full mt-[110px]" />
                                </IonCol>
                            </>
                        )}
                    {!boostsLoading &&
                        boosts &&
                        !boostError &&
                        boosts?.length === 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="work history"
                                    className="w-[250px] h-[250px] m-auto"
                                />
                                <strong>No boosts to manage yet</strong>
                            </section>
                        )}
                    {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default WorkHistoryPage;
