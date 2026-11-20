import React, { useMemo } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

import { useHcpChange, useHcpContractOffer, useHcpOAuthApprove } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';
import ConsentScreen from './ConsentScreen';
import {
    contractGrantRequest,
    grantRequestFor,
    parseConsentLink,
    requestFromOAuth,
    requestFromOffer,
    type OAuthSignIn,
} from './consentLink';
import { HcpHeader } from './HcpPage';
import HcpProfileGate from './HcpProfileGate';
import { HcpLoading } from './HcpStates';

const BadLink: React.FC = () => (
    <div role="alert" className="p-4 bg-red-50 border border-red-100 rounded-2xl">
        <p className="text-sm font-medium text-red-700">{m['hcp.connect.badTitle']()}</p>
        <p className="text-sm text-red-700">{m['hcp.connect.badBody']()}</p>
    </div>
);

/** LC-2421: the brain resolves the contract; Allow grants under the version shown. */
const ContractConsent: React.FC<{ contractUri: string; client: string | null }> = ({
    contractUri,
    client,
}) => {
    const history = useHistory();
    const change = useHcpChange();
    const offer = useHcpContractOffer(contractUri);

    if (offer.isPending) return <HcpLoading />;
    const request = offer.data ? requestFromOffer(offer.data, client) : null;
    if (!offer.data || !request) return <BadLink />;
    const data = offer.data;

    return (
        <ConsentScreen
            request={request}
            pending={change.isPending}
            failed={change.isError}
            onAllow={() =>
                change.mutate(
                    { kind: 'allow', input: contractGrantRequest(data, request.client.id) },
                    {
                        onSuccess: () => history.replace('/hcp?tab=apps'),
                        // The contract may have changed since it loaded: show the current one.
                        onError: () => void offer.refetch(),
                    }
                )
            }
            onDeny={() => history.replace('/hcp')}
        />
    );
};

/**
 * An MCP host (e.g. Claude Code) signing in through the HCP OAuth AS. Allow issues a
 * grant to the host's DID for the scopes shown, then hands the browser back to the AS.
 */
const OAuthConsent: React.FC<{ signIn: OAuthSignIn }> = ({ signIn }) => {
    const history = useHistory();
    const approve = useHcpOAuthApprove();
    const request = requestFromOAuth(
        signIn,
        m['hcp.connect.oauthPurpose']({ app: signIn.clientName })
    );

    return (
        <ConsentScreen
            request={request}
            oauth={{ scopes: signIn.scopes }}
            pending={approve.isPending || approve.isSuccess}
            failed={approve.isError}
            onAllow={() =>
                approve.mutate(
                    { ticket: signIn.ticket },
                    { onSuccess: ({ completeUrl }) => window.location.assign(completeUrl) }
                )
            }
            onDeny={() => history.replace('/hcp')}
        />
    );
};

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
                            <BadLink />
                        ) : parsed.kind === 'oauth' ? (
                            <OAuthConsent signIn={parsed.signIn} />
                        ) : parsed.kind === 'contract' ? (
                            <ContractConsent
                                contractUri={parsed.contractUri}
                                client={parsed.client}
                            />
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
