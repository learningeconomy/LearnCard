import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useLocation } from 'react-router-dom';

import TotalSkillsCount from './TotalSkillsCount';
import { IonContent, IonPage } from '@ionic/react';
import SkillsInsightCard from './SkillsInsightCard';
import SkillsCategoryList from './SkillsCategoryList';
import MainHeader from '../../components/main-header/MainHeader';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import SkillsMyHub from './SkillsMyHub';
import SkillsAdminPanel from './SkillsAdminPanel';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';

import { useLoadingLine } from '../../stores/loadingStore';
import {
    conditionalPluralize,
    CredentialCategoryEnum,
    useGetCredentialsForSkills,
    useGetProfile,
    useListMySkillFrameworks,
} from 'learn-card-base';

import {
    aggregateCategorizedEntries,
    mapBoostsToSkills,
    RawCategorizedEntry,
} from './skills.helpers';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

import useTheme from '../../theme/hooks/useTheme';
import useAlignments from '../../hooks/useAlignments';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import { LearnCardRolesEnum } from '../../components/onboarding/onboarding.helpers';

enum TabEnum {
    MY_HUB = 'My Hub',
    ADMIN_PANEL = 'Admin Panel',
}

const SkillsPage: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const location = useLocation();
    const { data: lcNetworkProfile } = useGetProfile();
    const { data: frameworks = [] } = useListMySkillFrameworks();

    const { alignments } = useAlignments();

    const managedFrameworksExist = frameworks?.length > 0;

    const [selectedTab, setSelectedTab] = useState<TabEnum>(TabEnum.MY_HUB);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');

        if (tab === 'admin-panel') setSelectedTab(TabEnum.ADMIN_PANEL);
        if (tab === 'my-hub') setSelectedTab(TabEnum.MY_HUB);
    }, [location.search]);

    const colors = getThemedCategoryColors(CredentialCategoryEnum.skill);
    const { backgroundSecondaryColor } = colors;

    const flags = useFlags();
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    const showAiInsights = flags?.showAiInsights;
    const showAdminPanel =
        flags?.enableAdminTools ||
        lcNetworkProfile?.role === LearnCardRolesEnum.admin ||
        lcNetworkProfile?.role === LearnCardRolesEnum.teacher ||
        managedFrameworksExist;

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = allResolvedCredsError ? true : false;

    let isBoostsEmpty = false;
    if ((!allResolvedBoostsLoading && allResolvedCreds?.length === 0) || allResolvedBoostsLoading) {
        isBoostsEmpty = true;
    } else {
        isBoostsEmpty = false;
    }

    const skillsMap = mapBoostsToSkills(allResolvedCreds);
    const categorizedSkills: [
        string,
        RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
    ][] = Object.entries(skillsMap);
    const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0) + (alignments?.length || 0);

    const isHub = selectedTab === TabEnum.MY_HUB;

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <GenericErrorBoundary category={CredentialCategoryEnum.skill}>
                <MainHeader
                    category={CredentialCategoryEnum.skill}
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Skill}
                    isBoostsEmpty={isBoostsEmpty}
                    hidePlusBtn={true}
                />
                <IonContent fullscreen className="skills-page" color={backgroundSecondaryColor}>
                    <div className="flex relative justify-center items-center w-full pb-[30px]">
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] px-[20px]">
                            {/* {showAiInsights && <SkillsInsightCard />} */}
                            {/* <TotalSkillsCount total={total} /> */}
                            {showAdminPanel && (
                                <div
                                    className={`flex items-center justify-start w-full ${
                                        isHub ? 'mb-[10px]' : 'mb-[15px]'
                                    }`}
                                >
                                    {Object.values(TabEnum).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setSelectedTab(tab)}
                                            className={`px-[14px] py-[7px] rounded-[5px] font-[600] font-poppins text-[14px] ${
                                                tab === selectedTab
                                                    ? 'bg-grayscale-200 text-grayscale-900'
                                                    : 'text-grayscale-600'
                                            }`}
                                        >
                                            {tab === TabEnum.MY_HUB ? (
                                                <div className="flex items-center gap-[5px]">
                                                    <PuzzlePiece
                                                        className="w-[15px] h-[15px]"
                                                        version="filled"
                                                    />
                                                    {conditionalPluralize(total, 'Skill')}
                                                </div>
                                            ) : (
                                                tab
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedTab === TabEnum.MY_HUB && <SkillsMyHub />}
                            {selectedTab === TabEnum.ADMIN_PANEL && <SkillsAdminPanel />}
                        </div>
                    </div>

                    {/* <div className="flex relative justify-center items-center w-full pb-[30px]">
                        <div className="w-full max-w-[800px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px]">
                            {showAiInsights && <SkillsInsightCard />}
                            <TotalSkillsCount total={total} />
                            <SkillsCategoryList
                                allResolvedCreds={allResolvedCreds!}
                                categorizedSkills={aggregatedSkills!}
                                isLoading={allResolvedBoostsLoading}
                            />

                            {((!allResolvedBoostsLoading && aggregatedSkills?.length === 0) ||
                                allResolvedBoostsLoading) &&
                                !boostError && (
                                    <SkillsPageEmptyPlaceholder
                                        isLoading={allResolvedBoostsLoading}
                                    />
                                )}
                        </div>
                    </div> */}

                    {/* {(boostError as Boolean) && <BoostErrorsDisplay refetch={refetch} />} */}
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default SkillsPage;
