import React, { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';

import {
    useFeatureConfig,
    useLinksConfig,
    useGetPreferencesForDid,
    useSchoolConnection,
    useClassLinkAuthorizeUrl,
} from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { startClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';
import { TranscriptOptInCard } from '../../components/classlink/TranscriptOptInCard';
import MainHeader from '../../components/main-header/MainHeader';
import { useLocale } from '../../i18n';
import * as m from '../../paraglide/messages.js';
import { SchoolConnectView } from './SchoolConnectView';

const SchoolConnectPage: React.FC = () => {
    const history = useHistory();
    const features = useFeatureConfig();
    const links = useLinksConfig();
    const { state: coordinatorState } = useAppAuth();
    const isReady = coordinatorState.status === 'ready';

    const { data: preferences } = useGetPreferencesForDid();
    const isLocked = preferences?.isMinor === true;

    const { data: connection, isLoading, isError, refetch } = useSchoolConnection(isReady);

    const { mutateAsync: getClassLinkAuthorizeUrl } = useClassLinkAuthorizeUrl();

    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');
    const locale = useLocale();

    if (!features.schoolConnect || !features.classlinkSso) return <Redirect to="/launchpad" />;

    const formatDate = (iso: string): string => {
        const date = new Date(iso);
        return Number.isNaN(date.getTime())
            ? ''
            : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
    };

    const handleConnect = async () => {
        if (connecting) return;
        setConnecting(true);
        setConnectError('');
        const ok = await startClassLinkLogin(
            getClassLinkAuthorizeUrl,
            path => history.push(path),
            '/school-connect',
            'connect'
        );
        if (!ok) {
            setConnectError(m['schoolConnect.connectFailed']());
            setConnecting(false);
        }
    };

    return (
        <IonPage className="bg-grayscale-100 font-poppins">
            <MainHeader showBackButton customClassName="bg-grayscale-100" />
            <IonContent fullscreen className="bg-grayscale-100" color="grayscale-100">
                <div className="animate-fade-in-up pb-10">
                    <SchoolConnectView
                        connection={connection}
                        isLoading={isLoading || !isReady}
                        isError={isError}
                        isLocked={isLocked}
                        supportEmail={links.supportEmail}
                        connecting={connecting}
                        connectError={connectError}
                        onConnect={() => void handleConnect()}
                        onRetry={() => void refetch()}
                        formatDate={formatDate}
                        transcriptSlot={<TranscriptOptInCard />}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SchoolConnectPage;
