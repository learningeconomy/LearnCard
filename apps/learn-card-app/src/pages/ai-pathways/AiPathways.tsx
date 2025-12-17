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

const DUMMY_COURSES = [
    {
        id: 1,
        title: 'Exploratory Data Analysis',
        provider: 'John Hopkins University',
        durationAvg: '4-8 hrs/week',
        durationTotal: '12 weeks',
        topics: ['Data Analysis', 'Machine Learning'],
        rating: 3.8,
        source: 'edX',
    },
    {
        id: 2,
        title: 'Robotics: Vision Intelligence and Machine Learning',
        provider: 'University of Pennsylvania',
        durationAvg: '8 hrs/week',
        durationTotal: '12 weeks',
        topics: ['Machine Learning'],
        rating: 4.2,
        source: 'edX',
    },
    {
        id: 3,
        title: 'Python Data Structures',
        provider: 'University of Michigan',
        durationAvg: '3-4 hrs/week',
        durationTotal: '2 weeks',
        topics: ['Python'],
        rating: 4.7,
        source: 'edX',
    },
];

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
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] pb-[100px]">
                            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                                <div className="w-full flex items-center justify-start">
                                    <h2 className="text-xl text-grayscale-800 font-notoSans ml-[10px]">
                                        Explore Courses
                                    </h2>
                                </div>

                                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                                    {DUMMY_COURSES.map(course => (
                                        <div
                                            key={course.id}
                                            className="w-full flex flex-col items-start justify-start p-2 gap-1 border-solid border-[1px] border-gray-200 rounded-xl"
                                        >
                                            <p className="text-indigo-500 font-normal text-sm line-clamp-1 font-notoSans uppercase">
                                                {course.topics.join(', ')}
                                            </p>
                                            <div className="w-full flex items-center justify-between">
                                                <h2 className="text-lg text-left font-semibold text-gray-800 line-clamp-2">
                                                    {course.title}
                                                </h2>
                                            </div>

                                            <p className="text-sm text-gray-600">
                                                {course.provider}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {course.durationAvg} • {course.durationTotal}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
