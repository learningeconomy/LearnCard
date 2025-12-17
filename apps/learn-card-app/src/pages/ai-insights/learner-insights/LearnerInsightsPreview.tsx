import React from 'react';

import { IonPage, IonContent } from '@ionic/react';
import AiInsightsTopSkills from '../AiInsightsTopSkills';
import AiInsightsLearningSnapshots from '../AiInsightsLearningSnapshots';
import LearnerInsightsPreviewHeader from './LearnerInsightsPreviewHeader';

import {
    useModal,
    CredentialCategoryEnum,
    useConsentFlowDataForDidByCategory,
    useResolvedConsentFlowDataForDid,
} from 'learn-card-base';
import useTheme from '../../../theme/hooks/useTheme';

import {
    aggregateCategorizedEntries,
    getTopSkills,
    mapBoostsToSkills,
    RawCategorizedEntry,
} from '../../skills/skills.helpers';

import { LCNProfile } from '@learncard/types';

export const LearnerInsightsPreview: React.FC<{
    profile: LCNProfile;
    readStatus?: 'unseen' | 'seen' | null | undefined;
    status?: 'pending' | 'accepted' | 'denied' | null | undefined;
}> = ({ profile, readStatus, status }) => {
    const { closeModal } = useModal();
    const { getThemedCategoryColors } = useTheme();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiInsight);
    const { backgroundSecondaryColor } = colors;

    const { data: allResolvedCreds, isLoading: isLoadingResolved } =
        useResolvedConsentFlowDataForDid(profile.did, {
            limit: 100,
        });

    const { data: byCategory, isLoading: isLoadingByCategory } = useConsentFlowDataForDidByCategory(
        profile.did,
        {
            limit: 100,
        }
    );

    const aiInsightsCredential = byCategory?.[CredentialCategoryEnum.aiInsight]?.[0];

    const skillsMap = mapBoostsToSkills(allResolvedCreds);
    const categorizedSkills: [
        string,
        RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
    ][] = Object.entries(skillsMap);
    const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);
    const topSkills = getTopSkills(aggregatedSkills, 3);

    const isLoading = isLoadingResolved || isLoadingByCategory;

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <LearnerInsightsPreviewHeader
                profile={profile}
                readStatus={readStatus}
                status={status}
            />
            <IonContent fullscreen color={backgroundSecondaryColor}>
                <div className="flex relative justify-center items-center w-full">
                    <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding pb-[100px] gap-4">
                        {topSkills.length > 0 && <AiInsightsTopSkills topSkills={topSkills} />}
                        <AiInsightsLearningSnapshots
                            isLoading={isLoading}
                            aiInsightCredential={aiInsightsCredential}
                        />
                    </div>
                </div>
            </IonContent>
            <footer className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white p-[20px] backdrop-blur-[10px] z-50">
                <div className="max-w-[600px] flex gap-[10px] items-center mx-auto">
                    <button
                        type="button"
                        className={`bg-white p-3 h-[45px] rounded-full  flex items-center justify-center shadow-button-bottom text-grayscale-900 w-full`}
                        onClick={closeModal}
                    >
                        Back
                    </button>
                </div>
            </footer>
        </IonPage>
    );
};

export default LearnerInsightsPreview;
