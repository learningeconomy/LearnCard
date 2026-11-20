import { useCallback, useEffect, useRef } from 'react';
import useCurrentUser from './useGetCurrentUser';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useWallet } from 'learn-card-base';
import { ANONYMOUS_CONTEXT } from '../constants/launchDarkly';
import { useIsCurrentUserLCNUser, useGetDid } from 'learn-card-base';
import { useOnReconnect } from './useConnectivity';

import { getContactEmail } from '../helpers/syntheticEmail';
import { getLogger } from '../logging/logger';
const log = getLogger('use-launch-darkly-identify');

type LDClient = NonNullable<ReturnType<typeof useLDClient>>;
type LDIdentifyContext = Parameters<LDClient['identify']>[0];
type IdentifyCallback = NonNullable<Parameters<LDClient['identify']>[2]>;

export type UseLaunchDarklyOptions = {
    debug?: boolean;
};

export const useLaunchDarklyIdentify = (options: UseLaunchDarklyOptions = {}) => {
    const currentUser = useCurrentUser();
    const { data: isLCN, isLoading: isLCNLoading } = useIsCurrentUserLCNUser();

    const ldClient = useLDClient();
    const { getDID } = useWallet();
    // useWallet() returns a new getDID every render. Read it through a ref so it is not
    // an identify dependency.
    const getDIDRef = useRef(getDID);
    useEffect(() => {
        getDIDRef.current = getDID;
    }, [getDID]);

    // The context LaunchDarkly was last asked to identify. Every identify call cancels
    // the flag request of the one before it, so re-identifying the same context on
    // re-render can leave flags unloaded until renders stop (LC-2433).
    const lastContextKeyRef = useRef<string | null>(null);
    const identifyOnce = useCallback(
        (context: LDIdentifyContext, onDone: IdentifyCallback) => {
            if (!ldClient) return;
            const contextKey = JSON.stringify(context);
            if (lastContextKeyRef.current === contextKey) return;
            lastContextKeyRef.current = contextKey;
            ldClient.identify(context, undefined, onDone);
        },
        [ldClient]
    );

    const { data: webDid, isLoading: webDidLoading } = useGetDid(
        'web',
        Boolean(currentUser && isLCN)
    );
    const { data: keyDid, isLoading: keyDidLoading } = useGetDid('key', Boolean(currentUser));

    const identify = useCallback(async () => {
        if (currentUser && ldClient) {
            if (isLCNLoading) return;

            if (options.debug) log.debug('Identify user! 🎸', currentUser);

            try {
                let did: string | undefined;

                if (isLCN) {
                    if (webDidLoading) return; // wait for web DID to resolve when LCN user
                    if (typeof webDid === 'string' && webDid.startsWith('did:web:')) did = webDid;
                    if (!did) return; // avoid early identify until did:web is ready
                }

                if (!did) {
                    if (keyDidLoading) return; // wait for key DID to resolve
                    if (typeof keyDid === 'string') did = keyDid;
                }

                if (!did) {
                    const fallback = await getDIDRef.current();
                    if (typeof fallback === 'string') did = fallback;
                }

                if (!did) throw new Error('No DID available');

                const context = {
                    kind: 'user',
                    key: did,
                    name: currentUser?.name,
                    // Never identify by a synthetic ClassLink placeholder email.
                    email: getContactEmail(currentUser?.email),
                };

                if (options.debug) log.debug('🔍 LaunchDarkly User Context Identified', context);

                identifyOnce(context, (err, flags) => {
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
        } else {
            identifyOnce(ANONYMOUS_CONTEXT, (err, flags) => {
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
    }, [
        currentUser,
        ldClient,
        isLCNLoading,
        isLCN,
        webDid,
        webDidLoading,
        keyDid,
        keyDidLoading,
        identifyOnce,
        options.debug,
    ]);

    useEffect(() => {
        identify();
    }, [identify]);

    // Re-identify with the CURRENT context (logged-in DID or anonymous) when the
    // connection returns — LaunchDarkly's flag stream can go stale while offline,
    // and re-identifying forces an immediate flag refresh for whoever is active.
    useOnReconnect(() => {
        lastContextKeyRef.current = null;
        identify();
    });
};
