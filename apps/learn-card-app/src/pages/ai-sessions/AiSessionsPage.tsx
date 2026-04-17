import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { IonContent, IonPage } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { CredentialCategoryEnum } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';

const AiSessionsPage: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiTopic);
    const { backgroundSecondaryColor } = colors;

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.aiTopic}
                        showBackButton
                        subheaderType={SubheaderTypeEnum.AiSessions}
                        hidePlusBtn={true}
                        customClassName="bg-gradient-to-b from-white to-white/70 border-b border-white backdrop-blur-[5px] md:bg-white md:border-none md:bg-none md:backdrop-blur-none"
                    />
                    <AiFeatureGate>
                        <div className="flex relative justify-center items-center w-full">
                            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] pb-[100px]"></div>
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiSessionsPage;
