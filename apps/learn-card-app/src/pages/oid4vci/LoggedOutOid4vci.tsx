import React, { useEffect } from 'react';
import { redirectStore } from 'learn-card-base';
import ClaimLoginPage from '../login/ClaimLoginPage';
import { SomeoneSentYouACredentialRequest } from '../claim-from-request/LoggedOutRequest';

/**
 * Logged-out landing for an OpenID4VCI credential offer. Persists the
 * incoming offer URL into `redirectStore.lcnRedirect` so the post-login
 * redirect lands the user back on the consent screen, then renders the
 * shared ClaimLoginPage.
 *
 * Stage 1: visually identical to the existing VC-API logged-out flow.
 * Stage 2 will add an issuer-aware splash specific to OID4VCI.
 */
const LoggedOutOid4vci: React.FC<{ offer?: string | null }> = ({ offer }) => {
    useEffect(() => {
        if (!offer) return;
        const redirectTo = `/oid4vci?offer=${encodeURIComponent(offer)}`;
        redirectStore.set.lcnRedirect(redirectTo);
    }, [offer]);

    return (
        <ClaimLoginPage
            vc_request_url={offer}
            alternateBgComponent={
                <SomeoneSentYouACredentialRequest vc_request_url={offer} />
            }
        />
    );
};

export default LoggedOutOid4vci;
