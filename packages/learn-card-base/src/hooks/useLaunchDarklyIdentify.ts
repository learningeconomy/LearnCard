import { useEffect } from 'react';
import useCurrentUser from './useGetCurrentUser';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useWallet } from 'learn-card-base';
import { ANONYMOUS_CONTEXT } from '../constants/launchDarkly';
import { useIsCurrentUserLCNUser, useGetDid } from 'learn-card-base';

import { getLogger } from '../logging/logger';
const log = getLogger('use-launch-darkly-identify');

export type UseLaunchDarklyOptions = {
    debug?: boolean;
};

export const useLaunchDarklyIdentify = (options: UseLaunchDarklyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { data: isLCN, isLoading: isLCNLoading } = useIsCurrentUserLCNUser();

    const ldClient = useLDClient();
    const { getDID } = useWallet();

    const { data: webDid, isLoading: webDidLoading } = useGetDid(
        'web',
        Boolean(currentUser && isLCN)
    );
    const { data: keyDid, isLoading: keyDidLoading } = useGetDid('key', Boolean(currentUser));

    useEffect(() => {
        if (currentUser && ldClient) {
            if (isLCNLoading) return;

            if (options.debug) log.debug('Identify user! 🎸', currentUser);

            (async () => {
                try {
                    let did: string | undefined;

                    if (isLCN) {
                        if (webDidLoading) return; // wait for web DID to resolve when LCN user
                        if (typeof webDid === 'string' && webDid.startsWith('did:web:'))
                            did = webDid;
                        if (!did) return; // avoid early identify until did:web is ready
                    }

                    if (!did) {
                        if (keyDidLoading) return; // wait for key DID to resolve
                        if (typeof keyDid === 'string') did = keyDid;
                    }

                    if (!did) {
                        const fallback = await getDID();
                        if (typeof fallback === 'string') did = fallback;
                    }

                    if (!did) throw new Error('No DID available');

                    const context = {
                        kind: 'user',
                        key: did,
                        name: currentUser?.name,
                        email: currentUser?.email,
                    };

                    if (options.debug)
                        log.debug('🔍 LaunchDarkly User Context Identified', context);

                    ldClient.identify(context, undefined, (err, flags) => {
                        if (err) {
                            log.error('❌ Error Updating LaunchDarkly Context', err);
                        } else if (options.debug) {
                            log.debug('✅ New LaunchDarkly Context Set', context, flags);
                        }
                    });
                } catch (e) {
                    log.error(
                        '❌ Unable to identify LaunchDarkly User because DID could not be generated.',
                        e
                    );
                }
            })();
        } else {
            ldClient?.identify(ANONYMOUS_CONTEXT, undefined, (err, flags) => {
                if (err) {
                    log.error('❌ Error Revoking LaunchDarkly Context', err);
                } else if (options.debug) {
                    log.debug(
                        '✅ LaunchDarkly Context Revoked On Logout',
                        ANONYMOUS_CONTEXT,
                        flags
                    );
                }
            });
        }
    }, [currentUser, ldClient, isLCNLoading, isLCN, webDid, webDidLoading, keyDid, keyDidLoading]);
};
