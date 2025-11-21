import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ErrorBoundary } from 'react-error-boundary';

import AiInsightsCard from './AiInsightsCard';
import { IonContent, IonPage } from '@ionic/react';
import AiInsightsTopSkills from './AiInsightsTopSkills';
import MainHeader from '../../components/main-header/MainHeader';
import AiInsightsLearningPathways from './AiInsightsLearningPathways';
import AiInsightsLearningSnapshots from './AiInsightsLearningSnapshots';
import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';
import CategoryEmptyPlaceholder from '../../components/empty-placeholder/CategoryEmptyPlaceHolder';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import {
    CredentialCategoryEnum,
    useAiInsightCredential,
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
import ExperimentalFeatureBox from '../../components/generic/ExperimentalFeatureBox';

const AiInsights: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();

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

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching || createAiInsightCredentialLoading);

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    const categorizedSkills: [
        string,
        RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
    ][] = Object.entries(skillsMap);

    const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

    const topSkills = getTopSkills(aggregatedSkills, 3);

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
                            <div className="flex items-center justify-center w-full shadow-box-bottom rounded-[10px]">
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
                            </div>
                            {topSkills.length > 0 && <AiInsightsTopSkills topSkills={topSkills} />}
                            <AiInsightsLearningSnapshots
                                isLoading={createAiInsightCredentialLoading}
                            />
                            <AiInsightsCard />
                            <AiInsightsLearningPathways
                                isLoading={createAiInsightCredentialLoading}
                            />

                            {/* <CategoryEmptyPlaceholder
                                category={CredentialCategoryEnum.aiInsight}
                                iconClassName="w-[200px] h-[200px]"
                            />
                            <div className="flex flex-col gap-[10px] mt-[6px]">
                                <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                                    No Insights yet.
                                </span>
                            </div> */}
                        </div>
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiInsights;
