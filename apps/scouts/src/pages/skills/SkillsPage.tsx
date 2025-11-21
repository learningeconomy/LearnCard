import React, { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

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

enum TabEnum {
    MY_HUB = 'My Hub',
    ADMIN_PANEL = 'Admin Panel',
}

const SkillsPage: React.FC = () => {
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    const [selectedTab, setSelectedTab] = useState<TabEnum>(TabEnum.ADMIN_PANEL);
    const [frameworkToBrowse, setFrameworkToBrowse] = useState<SkillFramework | null>(null);

    // const flags = useFlags();
    // const showAiInsights = flags?.showAiInsights;

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    let isBoostsEmpty = false;
    if ((!allResolvedBoostsLoading && allResolvedCreds?.length === 0) || allResolvedBoostsLoading) {
        isBoostsEmpty = true;
    } else {
        isBoostsEmpty = false;
    }

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    const isHub = selectedTab === TabEnum.MY_HUB;

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
            <GenericErrorBoundary category={CredentialCategoryEnum.skill}>
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

                            <div
                                className={`flex items-center justify-start w-full ${
                                    isHub ? 'mb-[10px]' : 'mb-[15px]'
                                }`}
                            >
                                {Object.values(TabEnum).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setSelectedTab(tab)}
                                        className={`px-[14px] py-[7px] rounded-[5px] font-[500] font-poppins text-[14px] ${
                                            tab === selectedTab
                                                ? 'bg-violet-100 text-grayscale-900'
                                                : 'text-grayscale-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {selectedTab === TabEnum.MY_HUB && <SkillsMyHub />}
                            {selectedTab === TabEnum.ADMIN_PANEL && (
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
