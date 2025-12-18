import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ErrorBoundary } from 'react-error-boundary';

import { IonContent, IonPage } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import AiInsightsTopSkills from './AiInsightsTopSkills';
import ChildInsights from './child-insights/ChildInsights';
import AiInsightsTabs from './ai-insight-tabs/AiInsightsTabs';
import MainHeader from '../../components/main-header/MainHeader';
import LearnerInsights from './learner-insights/LearnerInsights';
import ShareInsightsCard from './share-insights/ShareInsightsCard';
import AiInsightsSkillsCardSimple from './AiInsightsSkillsCardSimple';
import AiInsightsLearningSnapshots from './AiInsightsLearningSnapshots';
import RequestInsightsCard from './request-insights/RequestInsightsCard';
import AiInsightsLearningPathwaysCard from './AiInsightsLearningPathwaysCard';
import AiInsightsUserRequestsToast from './toasts/AiInsightsUserRequestsToast';
import ExperimentalFeatureBox from '../../components/generic/ExperimentalFeatureBox';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import {
    CredentialCategoryEnum,
    useAiInsightCredentialMutation,
    useGetCredentialsForSkills,
} from 'learn-card-base';
import { useLoadingLine } from '../../stores/loadingStore';
import {
    aggregateCategorizedEntries,
    getTopSkills,
    mapBoostsToSkills,
    RawCategorizedEntry,
} from '../skills/skills.helpers';

import useTheme from '../../theme/hooks/useTheme';
import { useGetCurrentLCNUser } from 'learn-card-base';
import { useAllContractRequestsForProfile } from 'learn-card-base';
import { AiInsightsTabsEnum } from './ai-insight-tabs/ai-insights-tabs.helpers';

const AiInsights: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const location = useLocation();

    const [selectedTab, setSelectedTab] = useState(AiInsightsTabsEnum.MyInsights);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (
            tab === AiInsightsTabsEnum.MyInsights ||
            tab === AiInsightsTabsEnum.LearnerInsights ||
            tab === AiInsightsTabsEnum.ChildInsights
        ) {
            setSelectedTab(tab);
        }
    }, [location.search]);

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiInsight);
    const { backgroundSecondaryColor } = colors;
    const flags = useFlags();

    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
    } = useGetCredentialsForSkills();

    const { mutate: createAiInsightCredential, isPending: createAiInsightCredentialLoading } =
        useAiInsightCredentialMutation();

    const { data: contractRequests = [] } = useAllContractRequestsForProfile(
        currentLCNUser?.profileId ?? ''
    );

    const pendingRequests =
        contractRequests?.filter(request => request?.status === 'pending') || [];

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching || createAiInsightCredentialLoading);

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    const categorizedSkills: [
        string,
        RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
    ][] = Object.entries(skillsMap);

    const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

    const topSkills = getTopSkills(aggregatedSkills, 3);

    const contractRequest =
        pendingRequests?.length > 0
            ? pendingRequests?.map(request => (
                  <AiInsightsUserRequestsToast
                      contractUri={request?.contract?.uri}
                      options={{
                          className: 'bg-indigo-100 p-4 rounded-[16px] mb-4',
                          isInline: true,
                          useDarkText: true,
                          hideCloseButton: true,
                      }}
                  />
              ))
            : null;

    const myInsights = (
        <>
            {/* <div className="flex items-center justify-center w-full shadow-box-bottom rounded-[10px]">
                                <ExperimentalFeatureBox />
                            </div>
                            <div className="flex items-center justify-center w-full mt-4">
                                {flags?.showGenerateAiInsightsButton && (
                                    <button
                                        className="bg-indigo-600 text-white rounded-[16px] w-full py-2 shadow-button-bottom font-semibold"
                                        type="button"
                                        disabled={createAiInsightCredentialLoading}
                                        onClick={() => createAiInsightCredential()}
                                    >
                                        {createAiInsightCredentialLoading
                                            ? 'Generating...'
                                            : 'Generate AI Insights'}
                                    </button>
                                )}
                            </div> */}

            {contractRequest}
            <ShareInsightsCard />
            <AiInsightsLearningPathwaysCard />
            {topSkills.length > 0 && <AiInsightsTopSkills topSkills={topSkills} />}
            <AiInsightsSkillsCardSimple />
            <AiInsightsLearningSnapshots isLoading={createAiInsightCredentialLoading} />
        </>
    );

    const childInsights = <ChildInsights />;
    const learningInsights = <LearnerInsights />;

    let activeInsights;
    if (selectedTab === AiInsightsTabsEnum.MyInsights) {
        activeInsights = myInsights;
    } else if (selectedTab === AiInsightsTabsEnum.ChildInsights) {
        activeInsights = childInsights;
    } else {
        activeInsights = learningInsights;
    }

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.aiInsight}
                        showBackButton
                        subheaderType={SubheaderTypeEnum.AiInsights}
                        hidePlusBtn={true}
                    />
                    <div className="flex relative justify-center items-center w-full">
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] pb-[100px]">
                            <AiInsightsTabs
                                selectedTab={selectedTab}
                                setSelectedTab={setSelectedTab}
                                className="w-full mb-4"
                            />
                            {activeInsights}
                        </div>
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiInsights;
