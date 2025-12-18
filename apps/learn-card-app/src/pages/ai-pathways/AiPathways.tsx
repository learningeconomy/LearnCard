import React, { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import AiPathwayCourses from './ai-pathway-courses/AiPathwayCourses';
import AiPathwaySessions from './ai-pathway-sessions/AiPathwaySessions';

import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { CredentialCategoryEnum } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { useGetCurrentLCNUser } from 'learn-card-base';

const AiPathways: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiPathway);
    const { backgroundSecondaryColor } = colors;
    const flags = useFlags();

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.aiPathway}
                        showBackButton
                        subheaderType={SubheaderTypeEnum.AiPathways}
                        hidePlusBtn={true}
                    />
                    <div className="flex flex-col relative w-full pb-[50px]">
                        <AiPathwayCourses />
                        <AiPathwaySessions />
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
