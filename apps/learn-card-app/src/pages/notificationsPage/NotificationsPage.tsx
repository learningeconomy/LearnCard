import React, { useEffect, useRef, useState } from 'react';

import { IonContent, IonPage, IonCol } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { getLogger, useWallet } from 'learn-card-base';
import MainHeader from '../../components/main-header/MainHeader';
import NotificationsListView from '../../components/notifications/NotificationsListView';
import NotificationsSubHeader from '../../components/notifications/notifications-subheader/NotificationsSubheader';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import useHeaderScrollSync from '../../hooks/useHeaderScrollSync';
import { useForceRefreshLearnCloudCredential } from '../../components/credential-refresh-listener/CredentialRefreshListener';
import { locateCredentialRefreshRecord } from '../../components/notifications/notificationsV2/NotificationCredentialRefreshedCard';

const log = getLogger('notifications-page');

const NotificationsPage: React.FC = () => {
    const [isEmptyState, setIsEmptyState] = useState<boolean>(false);
    const [tab, setTab] = useState('active');

    const onHeaderScroll = useHeaderScrollSync();
    const history = useHistory();
    const location = useLocation();
    const { initWallet } = useWallet();
    const { forceRefresh } = useForceRefreshLearnCloudCredential();
    const consumedRefreshRequest = useRef<string>();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const refreshId = params.get('refreshId');

        if (params.get('refresh') !== 'true' || !refreshId) return;

        const requestKey = `${location.key ?? ''}:${location.search}`;

        if (consumedRefreshRequest.current === requestKey) return;

        consumedRefreshRequest.current = requestKey;
        params.delete('refresh');
        params.delete('refreshId');

        history.replace({
            ...location,
            search: params.toString() ? `?${params.toString()}` : '',
        });

        void (async () => {
            try {
                const wallet = await initWallet();
                const record = await locateCredentialRefreshRecord(wallet, refreshId);

                if (record) await forceRefresh(record, wallet);
            } catch (error) {
                log.error('refresh.deep-link.failed', error);
            }
        })();
    }, [forceRefresh, history, initWallet, location]);

    return (
        <IonPage className="bg-white h-full">
            <MainHeader
                showBackButton={false}
                customClassName="bg-gradient-to-b from-white to-white/70 border-b border-white backdrop-blur-[5px] md:bg-white md:border-none md:bg-none md:backdrop-blur-none"
            >
                <NotificationsSubHeader isEmptyState={isEmptyState} tab={tab} setTab={setTab} />
            </MainHeader>
            <GenericErrorBoundary>
                <IonContent
                    fullscreen
                    className="bg-white h-full w-full"
                    scrollEvents
                    onIonScroll={onHeaderScroll}
                >
                    <IonCol className="flex mx-auto relative items-start flex-wrap w-full h-auto min-h-[100%] notifications-list-container bg-white px-[20px]">
                        <NotificationsListView
                            isEmptyState={isEmptyState}
                            setIsEmptyState={setIsEmptyState}
                            tab={tab}
                        />
                    </IonCol>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default NotificationsPage;
