import { isSharePrivateSession } from '../components/share-links/sharePrivacy';
import userflow from 'userflow.js';
import { getLogger } from 'learn-card-base';
const log = getLogger('userflow');

import { useLayoutEffect, useRef } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useWallet } from 'learn-card-base';
import { getResolvedTenantConfig, isTenantAnalyticsEnabled } from '../config/tenantConfigState';
import { usePrivacyConsent } from 'learn-card-base/hooks/usePrivacyGate';

export type UseUserflowIdentifyOptions = {
    debug?: boolean;
};

// Userflow reset() retains its internal startup queue. Once a configured
// runtime is retired, only a fresh document can safely identify another session.
let retiredRuntime = false;

const getUserflowToken = (): string => {
    try {
        return getResolvedTenantConfig().observability.userflowToken;
    } catch {
        // Fail closed: an unresolved tenant must never use another project's token.
        return '';
    }
};

export const useUserflowIdentify = (options: UseUserflowIdentifyOptions = {}) => {
    const consent = usePrivacyConsent();
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    const currentUserRef = useRef(currentUser);
    const getDIDRef = useRef(getDID);
    currentUserRef.current = currentUser;
    getDIDRef.current = getDID;
    const initializedRef = useRef(false);
    const debugRef = useRef(options.debug);
    debugRef.current = options.debug;
    const permitted =
        consent.analyticsEnabled &&
        consent.identityKey !== null &&
        isTenantAnalyticsEnabled() &&
        !isSharePrivateSession();
    useLayoutEffect(() => {
        let cancelled = false;
        if (!permitted) return;
        const token = getUserflowToken();
        if (!token) return;
        if (retiredRuntime) {
            window.location.reload();
            return;
        }
        void userflow
            .load()
            .then(() => {
                if (cancelled || isSharePrivateSession()) return;
                initializedRef.current = true;
                userflow.setPageTrackingDisabled(false);
                userflow.init(token);
                if (currentUserRef.current) {
                    getDIDRef
                        .current()
                        .then(did => {
                            if (cancelled || isSharePrivateSession()) return;
                            if (debugRef.current)
                                log.debug('Userflow Identify user!', {
                                    uid: currentUserRef.current?.uid,
                                });
                            userflow.identify(did, {
                                device_type: window.innerWidth > 800 ? 'desktop' : 'mobile',
                            });
                        })
                        .catch(error => {
                            if (!cancelled && debugRef.current)
                                log.error('Unable to identify Userflow user.', error);
                        });
                } else {
                    userflow.reset();
                }
            })
            .catch(error => {
                if (!cancelled && debugRef.current) log.error('Unable to load Userflow.', error);
            });
        return () => {
            cancelled = true;
            if (!initializedRef.current) return;
            initializedRef.current = false;
            retiredRuntime = true;
            userflow.setPageTrackingDisabled(true);
            userflow.reset();
        };
    }, [consent.identityKey, permitted]);
};
export const UserflowConsentLifecycle = (): null => {
    useUserflowIdentify();
    return null;
};
