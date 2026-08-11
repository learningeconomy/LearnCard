import React, { useEffect, useState } from 'react';

import TotalSkillsCount from './TotalSkillsCount';
import { IonContent, IonPage } from '@ionic/react';
import SkillsInsightCard from './SkillsInsightCard';
import SkillsCategoryList from './SkillsCategoryList';
import MainHeader from '../../components/main-header/MainHeader';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { useLoadingLine } from '../../stores/loadingStore';
import { CredentialCategoryEnum, useGetCredentialsForSkills } from 'learn-card-base';

import {
    aggregateCategorizedEntries,
    mapBoostsToSkills,
    RawCategorizedEntry,
} from './skills.helpers';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import SkillsMyHub from './SkillsMyHub';
import SkillsAdminPanel from './SkillsAdminPanel';
import BrowseFrameworkPage from '../SkillFrameworks/BrowseFrameworkPage';
import { SkillFramework } from '../../components/boost/boost';
import { useIsCurrentUserLCNUser } from 'learn-card-base';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';
import SkillsTabs, { SkillsTab } from './SkillsTabs';

const SkillsPage: React.FC = () => {
    const { data: isNetworkUser } = useIsCurrentUserLCNUser();
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    const [selectedTab, setSelectedTab] = useState<SkillsTab>(SkillsTab.MyHub);
    const [frameworkToBrowse, setFrameworkToBrowse] = useState<ApiFrameworkInfo | null>(null);

    // const flags = useFlags();
    // const showAiInsights = flags?.showAiInsights;

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const resolvedCreds = Array.isArray(allResolvedCreds) ? allResolvedCreds : [];

    let isBoostsEmpty = false;
    if ((!allResolvedBoostsLoading && resolvedCreds.length === 0) || allResolvedBoostsLoading) {
        isBoostsEmpty = true;
    } else {
        isBoostsEmpty = false;
    }

    const skillsMap = mapBoostsToSkills(resolvedCreds as any) as Record<
        string,
        { length?: number; totalSubskills?: number }
    >;

    // Calculate total count of skills and subskills
    const skillCategories = Object.values(skillsMap) as Array<{
        length?: number;
        totalSubskills?: number;
    }>;

    const totalSkills = skillCategories.reduce(
        (total: number, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = skillCategories.reduce(
        (total: number, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    const canShowAdminPanel = isNetworkUser === true;

    useEffect(() => {
        if (!canShowAdminPanel && selectedTab === SkillsTab.AdminPanel) {
            setSelectedTab(SkillsTab.MyHub);
        }
    }, [canShowAdminPanel, selectedTab]);

    if (frameworkToBrowse) {
        // could remove this if we want to use the modal instead (which we're currently doing)
        return (
            <BrowseFrameworkPage
                frameworkInfo={frameworkToBrowse}
                handleClose={() => setFrameworkToBrowse(null)}
            />
        );
    }

    return (
        <IonPage className="bg-violet-200">
            <GenericErrorBoundary>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Skill}
                    hidePlusBtn={true}
                />
                <IonContent fullscreen className="skills-page" color="violet-200">
                    <div className="flex relative justify-center items-center w-full pb-[30px]">
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] px-[20px]">
                            {/* {showAiInsights && <SkillsInsightCard />} */}
                            {/* <TotalSkillsCount total={total} /> */}

                            <SkillsTabs
                                selectedTab={selectedTab}
                                onSelect={setSelectedTab}
                                showAdminPanel={canShowAdminPanel}
                            />

                            {selectedTab === SkillsTab.MyHub && <SkillsMyHub />}
                            {selectedTab === SkillsTab.AdminPanel && canShowAdminPanel && (
                                <SkillsAdminPanel setFrameworkToBrowse={setFrameworkToBrowse} />
                            )}
                        </div>
                    </div>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default SkillsPage;
