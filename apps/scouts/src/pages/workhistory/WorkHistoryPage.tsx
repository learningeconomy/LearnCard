import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import BoostManagedCard from '../../components/boost/boost-managed-card/BoostManagedCard';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';

import {
    CurvedBackdropEl,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    useGetBoosts,
    useGetCredentials,
    useIsCurrentUserLCNUser,
    VC_WITH_URI,
    BrandingEnum,
    categoryMetadata,
    CredentialListSkeleton,
} from 'learn-card-base';
import EarnedAndManagedTabs from '../../components/earned-and-managed-tabs/ScoutPassEarnedAndManagedTabs';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import * as m from '../../paraglide/messages.js';
import { usePathQuery } from 'learn-card-base';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

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

    const imgSrc = categoryMetadata[CredentialCategoryEnum.workHistory].defaultImageSrc;

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
            // eslint-disable-next-line preserve-caught-error -- adding { cause } changes the shape of the thrown error
            throw new Error('There was an error, please try again.');
        }
    };

    return (
        <AppPage className="bg-white">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Job}
                    branding={BrandingEnum.scoutPass}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-rose-300"
                        />
                    )}
                </MainHeader>
                <AppContent fullscreen className="job-history-page relative" color={'rose-400'}>
                    <CurvedBackdropEl className="bg-rose-300" />
                    {loading && activeTab === CredentialListTabEnum.Earned && !boostError && (
                        <CredentialListSkeleton cardSize="credential" />
                    )}
                    {!loading &&
                        vcs &&
                        vcs?.length > 0 &&
                        activeTab === CredentialListTabEnum.Earned &&
                        !boostError && (
                            <>
                                <AppCol className="flex m-auto items-center flex-wrap  w-full achievements-list-container">
                                    <AppGrid className="max-w-[600px]">
                                        <AppRow> {credentials}</AppRow>
                                    </AppGrid>
                                    <div className="bg-filler bg-rose-300 absolute h-full top-[0px] left-[0px] w-full mt-[200px]" />
                                </AppCol>
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
                                    alt=""
                                    className="relative w-[250px] h-[250px] m-auto z-[1000]"
                                />
                                <div className="bg-filler bg-rose-300 absolute h-full w-full mt-[200px]" />
                                <strong className="relative">{m['workHistory.noHistory']()}</strong>
                            </section>
                        )}

                    {boostsLoading &&
                        activeTab === CredentialListTabEnum.Managed &&
                        !boostError && <CredentialListSkeleton cardSize="credential" />}
                    {!boostsLoading &&
                        boosts &&
                        !boostError &&
                        boosts?.length > 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <>
                                <AppCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <AppGrid className="max-w-[600px]">
                                        <AppRow>{renderBoostsList}</AppRow>
                                    </AppGrid>
                                    <div className="bg-filler bg-rose-300 absolute h-full top-[0px] left-[0px] w-full mt-[110px]" />
                                </AppCol>
                            </>
                        )}
                    {!boostsLoading &&
                        boosts &&
                        !boostError &&
                        boosts?.length === 0 &&
                        activeTab === CredentialListTabEnum.Managed && (
                            <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <img src={imgSrc} alt="" className="w-[250px] h-[250px] m-auto" />
                                <strong>{m['achievements.noBoosts']()}</strong>
                            </section>
                        )}
                    {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
                </AppContent>
            </ErrorBoundary>
        </AppPage>
    );
};

export default WorkHistoryPage;
