import React, { useEffect } from 'react';
import { redirectStore } from 'learn-card-base';
import ClaimLoginPage from '../login/ClaimLoginPage';
import { SomeoneSentYouACredentialRequest } from '../claim-from-request/LoggedOutRequest';

/**
 * Logged-out landing for an OpenID4VP presentation request. Persists the
 * incoming request URL into `redirectStore.lcnRedirect` so the post-login
 * redirect lands the user back on the consent screen, then renders the
 * shared ClaimLoginPage.
 *
 * Stage 1: visually identical to the existing VC-API logged-out flow.
 * Stage 3 will add a verifier-aware splash specific to OID4VP.
 */
const LoggedOutOid4vp: React.FC<{ request?: string | null }> = ({ request }) => {
    useEffect(() => {
        if (!request) return;
        const redirectTo = `/oid4vp?request=${encodeURIComponent(request)}`;
        redirectStore.set.lcnRedirect(redirectTo);
    }, [request]);

    return (
        <ClaimLoginPage
            vc_request_url={request}
            alternateBgComponent={
                <SomeoneSentYouACredentialRequest vc_request_url={request} />
            }
        />
    );
};

export default LoggedOutOid4vp;
