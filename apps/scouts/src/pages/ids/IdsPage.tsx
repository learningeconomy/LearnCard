import React, { useState } from 'react';
import Lottie from 'react-lottie-player';
import { ErrorBoundary } from 'react-error-boundary';
import BoostErrorsDisplay, {
    ErrorBoundaryFallback,
} from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import HourGlass from '../../assets/lotties/hourglass.json';

import { BrandingEnum, usePathQuery } from 'learn-card-base';
import { useGetCredentials } from 'learn-card-base';
import {
    CurvedBackdropEl,
    CredentialListTabEnum,
    EarnedAndManagedTabs,
    CredentialCategoryEnum,
    useGetBoosts,
    useIsCurrentUserLCNUser,
    VC_WITH_URI,
} from 'learn-card-base';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { TYPE_TO_IMG_SRC, WALLET_SUBTYPES } from '@learncard/react';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import BoostEarnedIDCard from '../../components/boost/boost-earned-card/BoostEarnedIDCard';
import BoostManagedIDCard from '../../components/boost/boost-managed-card/BoostManagedIDCard';

const IdsPage: React.FC = () => {
    const query = usePathQuery();

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    //Query gets 'earned' credentials
    const {
        data: credentials,
        isLoading: credentialsLoading,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentials('ID', undefined, true);
    //Query gets 'managed' boosts
    const {
        data: boosts,
        isLoading: boostsLoading,
        refetch: managedBoostRefetch,
        error: managedBoostsError,
    } = useGetBoosts(CredentialCategoryEnum.id);

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.IDS];

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
                <BoostEarnedIDCard
                    key={vcWithUri?.uri}
                    credential={vcWithUri?.vc}
                    uri={vcWithUri?.uri}
                    defaultImg={imgSrc}
                    categoryType={BoostCategoryOptionsEnum.id}
                />
            );
        });

    const renderBoostsList = boosts?.map((boost, index) => {
        if (!boost) return <></>;

        return (
            <BoostManagedIDCard
                key={boost?.uri || index}
                boost={boost}
                defaultImg={imgSrc}
                categoryType={BoostCategoryOptionsEnum.id}
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
        <IonPage>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.ID}
                    branding={BrandingEnum.scoutPass}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-sp-green-dark"
                        />
                    )}
                </MainHeader>
                <IonContent fullscreen className="wallet-ids-page" color={'sp-green-base'}>
                    <CurvedBackdropEl className="bg-sp-green-light" />
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
                            credentials &&
                            credentials?.length > 0 &&
                            activeTab === CredentialListTabEnum.Earned && (
                                <section className="relative flex flex-wrap text-center justify-center items-center max-w-[800px]">
                                    <div className="bg-filler bg-sp-green-light absolute h-full mt-[200px] w-[3000px]" />
                                    {renderCredentialList}
                                </section>
                            )}
                        {!credentialsLoading &&
                            !boostError &&
                            credentials &&
                            credentials?.length === 0 &&
                            activeTab === CredentialListTabEnum.Earned && (
                                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                    <img src={imgSrc} alt="ids" className="max-w-[250px] m-auto" />
                                    <strong>No troops yet</strong>
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
                                    <div className="bg-filler bg-sp-green-light absolute h-full mt-[200px] w-[3000px]" />
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
                                    <strong>No troops to manage yet</strong>
                                </section>
                            )}
                        {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default IdsPage;
