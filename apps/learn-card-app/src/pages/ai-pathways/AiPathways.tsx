import React, { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';

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
                    <div className="flex relative justify-center items-center w-full">
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] pb-[100px]"></div>
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
