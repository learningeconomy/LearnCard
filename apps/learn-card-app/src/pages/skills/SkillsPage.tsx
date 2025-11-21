import React from 'react';
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
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

import useTheme from '../../theme/hooks/useTheme';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

const SkillsPage: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();

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

    const total = (totalSkills || 0) + (totalSubskills || 0);

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <GenericErrorBoundary category={CredentialCategoryEnum.skill}>
                <IonContent fullscreen className="skills-page" color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.skill}
                        showBackButton
                        subheaderType={SubheaderTypeEnum.Skill}
                        isBoostsEmpty={isBoostsEmpty}
                        hidePlusBtn={true}
                    />
                    <div className="flex relative justify-center items-center w-full pb-[30px]">
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
                    </div>

                    {(boostError as Boolean) && <BoostErrorsDisplay refetch={refetch} />}
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default SkillsPage;
