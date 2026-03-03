import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { IonContent, IonPage, IonCol, IonRow, IonGrid } from '@ionic/react';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import MainHeader from '../../components/main-header/MainHeader';
import BoostManagedCard from '../../components/boost/boost-managed-card/BoostManagedCard';

import {
    CurvedBackdropEl,
    EarnedAndManagedTabs,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    useGetCredentials,
    useIsCurrentUserLCNUser,
    VC_WITH_URI,
    BrandingEnum,
    useGetBoosts,
    categoryMetadata,
} from 'learn-card-base';

import { usePathQuery } from 'learn-card-base';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import Lottie from 'react-lottie-player';
import HourGlass from '../../assets/lotties/hourglass.json';

import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

const LearningHistoryPage: React.FC = () => {
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
    } = useGetBoosts(CredentialCategoryEnum.learningHistory);

    const {
        data: vcs,
        isLoading: loading,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentials('Learning History', undefined, true);

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const imgSrc = categoryMetadata[CredentialCategoryEnum.learningHistory].defaultImageSrc;

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
                    categoryType={BoostCategoryOptionsEnum.learningHistory}
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
                categoryType={BoostCategoryOptionsEnum.learningHistory}
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
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Learning}
                    branding={BrandingEnum.scoutPass}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-emerald-300"
                        />
                    )}
                </MainHeader>
                <IonContent fullscreen className="skills-page" color="emerald-700">
                    <CurvedBackdropEl className="bg-emerald-300" />
                    {loading &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !earnedBoostsError && (
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
                        vcs?.length > 0 &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !earnedBoostsError && (
                            <IonCol className="flex m-auto relative items-center flex-wrap w-full achievements-list-container">
                                <IonGrid className="max-w-[600px]">
                                    <IonRow> {credentials}</IonRow>
                                </IonGrid>
                                <div className="bg-filler bg-emerald-300 absolute top-[0px] left-[0px] w-full h-full mt-[180px]" />
                            </IonCol>
                        )}
                    {!loading &&
                        vcs?.length === 0 &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !earnedBoostsError && (
                            <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="learning history"
                                    className="w-[250px] h-[250px] m-auto"
                                />
                                <strong>No learning history yet</strong>
                            </section>
                        )}

                    {boostsLoading &&
                        activeTab === CredentialListTabEnum.Managed &&
                        !managedBoostsError && (
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
                        !managedBoostsError &&
                        boosts?.length > 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <>
                                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <IonGrid className="max-w-[600px]">
                                        <IonRow>{renderBoostsList}</IonRow>
                                    </IonGrid>
                                    <div className="bg-filler bg-emerald-300 absolute h-full top-[0px] left-[0px] w-full mt-[110px]" />
                                </IonCol>
                            </>
                        )}
                    {!boostsLoading &&
                        !managedBoostsError &&
                        boosts?.length === 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="learning history"
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

export default LearningHistoryPage;
