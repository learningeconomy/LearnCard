import React, { useMemo } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

import { useHcpChange } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';
import ConsentScreen from './ConsentScreen';
import { grantRequestFor, parseConsentLink } from './consentLink';
import { HcpHeader } from './HcpPage';
import HcpProfileGate from './HcpProfileGate';

/** `/hcp/connect?...`: an app asks to see some of the person's info. */
const HcpConnectPage: React.FC = () => {
    const location = useLocation();
    const history = useHistory();
    const change = useHcpChange();
    const parsed = useMemo(() => parseConsentLink(location.search), [location.search]);

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="font-poppins mx-auto w-full max-w-[480px] px-5 pt-[max(24px,calc(var(--ion-safe-area-top,0px)+12px))] pb-14">
                    <HcpHeader title={m['hcp.connect.heading']()} />
                    <HcpProfileGate>
                        {parsed.kind === 'bad' ? (
                            <div
                                role="alert"
                                className="p-4 bg-red-50 border border-red-100 rounded-2xl"
                            >
                                <p className="text-sm font-medium text-red-700">
                                    {m['hcp.connect.badTitle']()}
                                </p>
                                <p className="text-sm text-red-700">{m['hcp.connect.badBody']()}</p>
                            </div>
                        ) : (
                            <ConsentScreen
                                request={parsed.request}
                                pending={change.isPending}
                                failed={change.isError}
                                onAllow={() =>
                                    change.mutate(
                                        {
                                            kind: 'allow',
                                            input: grantRequestFor(parsed.request, new Date()),
                                        },
                                        { onSuccess: () => history.replace('/hcp?tab=apps') }
                                    )
                                }
                                onDeny={() => history.replace('/hcp')}
                            />
                        )}
                    </HcpProfileGate>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default HcpConnectPage;
