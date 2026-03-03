import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { IonContent, IonPage, IonRow, IonCol, IonGrid } from '@ionic/react';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import MainHeader from '../../components/main-header/MainHeader';
import BoostManagedCard from '../../components/boost/boost-managed-card/BoostManagedCard';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';

import {
    CurvedBackdropEl,
    EarnedAndManagedTabs,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    BrandingEnum,
    categoryMetadata,
} from 'learn-card-base';

import { usePathQuery } from 'learn-card-base';
import {
    useGetBoosts,
    useGetCredentials,
    VC_WITH_URI,
    useIsCurrentUserLCNUser,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import Lottie from 'react-lottie-player';
import HourGlass from '../../assets/lotties/hourglass.json';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

const AchievementsPage: React.FC = () => {
    //Query gets 'earned' credentials
    const {
        data: credentials,
        isLoading: credentialsLoading,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentials('Achievement', undefined, true);
    //Query gets 'managed' boosts
    //Query gets 'managed' boosts
    const {
        data: boosts,
        isLoading: boostsLoading,
        refetch: managedBoostRefetch,
        error: managedBoostsError,
    } = useGetBoosts(CredentialCategoryEnum.achievement);

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const query = usePathQuery();

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const imgSrc = categoryMetadata[CredentialCategoryEnum.achievement].defaultImageSrc;

    const boostError = managedBoostsError || earnedBoostsError ? true : false;
    // Upon initially loading component, read wallet contents
    /* the filtering step is to handle old wallets that may have different VCs on their index that have the same uri */
    const renderCredentialList = credentials
        ?.filter(
            (v: VC_WITH_URI, i: number, a: VC_WITH_URI[]) =>
                a?.findIndex((v2: VC_WITH_URI) => v2?.uri === v?.uri) === i
        )
        ?.map((vcWithUri: VC_WITH_URI, index) => {
            return (
                <BoostEarnedCard
                    key={vcWithUri?.uri}
                    credential={vcWithUri?.vc}
                    uri={vcWithUri?.uri}
                    defaultImg={imgSrc}
                    categoryType={BoostCategoryOptionsEnum.achievement}
                />
            );
        });

    const renderBoostsList = boosts?.map((boost, index) => {
        if (!boost) return <></>;

        return (
            <BoostManagedCard
                key={boost?.uri || index}
                boost={boost}
                defaultImg={imgSrc}
                categoryType={BoostCategoryOptionsEnum.achievement}
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
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Achievement}
                    branding={BrandingEnum.scoutPass}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-spice-300"
                        />
                    )}
                </MainHeader>
                <IonContent fullscreen className="achievements-page relative">
                    <CurvedBackdropEl className="bg-spice-300" />
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
                        credentials &&
                        credentials?.length > 0 &&
                        activeTab === CredentialListTabEnum.Earned && (
                            <>
                                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <IonGrid className="max-w-[600px]">
                                        <IonRow>{renderCredentialList}</IonRow>
                                    </IonGrid>
                                    <div className="bg-filler bg-spice-300 absolute h-full top-[0px] left-[0px] w-full mt-[110px]" />
                                </IonCol>
                            </>
                        )}
                    {!credentialsLoading &&
                        !boostError &&
                        credentials &&
                        credentials?.length === 0 &&
                        activeTab === CredentialListTabEnum.Earned && (
                            <section className="flex relative  min-h-[200px]  flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="Achievements"
                                    className="w-[250px] h-[250px] m-auto"
                                />
                                <strong>No achievements yet</strong>
                            </section>
                        )}

                    {boostsLoading &&
                        activeTab === CredentialListTabEnum.Managed &&
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
                    {!boostsLoading &&
                        !boostError &&
                        boosts &&
                        boosts?.length > 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <>
                                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <IonGrid className="max-w-[600px]">
                                        <IonRow>{renderBoostsList}</IonRow>
                                    </IonGrid>
                                    <div className="bg-filler bg-spice-300 absolute h-full top-[0px] left-[0px] w-full mt-[110px]" />
                                </IonCol>
                            </>
                        )}
                    {!boostsLoading &&
                        !boostError &&
                        boosts &&
                        boosts?.length === 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <section className="flex relative min-h-[200px] flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <img
                                    src={imgSrc}
                                    alt="Achievements"
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

export default AchievementsPage;
