import * as Sentry from '@sentry/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import {
    useGetPreferencesForDid,
    useWallet,
    configureLoggerContext,
    getLogger,
} from 'learn-card-base';
import { usePrivacyConsent } from 'learn-card-base/hooks/usePrivacyGate';
import {
    isSharePrivateSession,
    useSharePrivateSession,
} from '../components/share-links/sharePrivacy';
import { isTenantAnalyticsEnabled } from '../config/tenantConfigState';
import { useFeedbackReportingEligibility } from '../feedback/reporting/eligibility';
import { setSentryOptionalTelemetryEnabled } from './sentry';
import { canSendCrashReport, setCrashReportingEnabled } from './nativeCrashReporting';

// Kept apart from ./sentry (Sentry.init, imported first by the app entry) because this hook needs the
// wallet, preferences, and privacy hooks, which would otherwise pull the whole wallet stack into the entry.
const log = getLogger('sentry');

export type UseSentryIdentifyOptions = {
    debug?: boolean;
};

export const useSentryIdentify = (options: UseSentryIdentifyOptions = {}) => {
    const { analyticsEnabled, identityKey } = usePrivacyConsent();
    const currentUser = useCurrentUser();
    const { getDID } = useWallet();
    const {
        data: preferences,
        isLoading: preferencesLoading,
        isSuccess: preferencesResolved,
    } = useGetPreferencesForDid();
    const reportingEligibility = useFeedbackReportingEligibility();
    const privateSession = useSharePrivateSession();
    const [crashGateEnabled, setCrashGateEnabled] = useState(canSendCrashReport);
    const canTrustPreferences = Boolean(
        currentUser &&
        reportingEligibility.profileId &&
        !preferencesLoading &&
        (preferencesResolved || preferences !== undefined)
    );
    // Preserve the last resolved choice on logout or while the next account loads.
    const bugReportsEnabled =
        !privateSession &&
        (canTrustPreferences ? (preferences?.bugReportsEnabled ?? true) : crashGateEnabled);

    useEffect(() => {
        if (!canTrustPreferences) return;
        let cancelled = false;
        const pending = setCrashReportingEnabled(preferences?.bugReportsEnabled ?? true);
        setCrashGateEnabled(canSendCrashReport());
        void pending.then(() => {
            if (!cancelled) setCrashGateEnabled(canSendCrashReport());
        });
        return () => {
            cancelled = true;
        };
    }, [
        canTrustPreferences,
        currentUser,
        reportingEligibility.profileId,
        preferences?.bugReportsEnabled,
    ]);

    const optionalTelemetryAllowed =
        analyticsEnabled &&
        bugReportsEnabled &&
        crashGateEnabled &&
        identityKey !== null &&
        isTenantAnalyticsEnabled() &&
        !isSharePrivateSession();
    const activeReplayIdentity = useRef<string | null>(null);
    const stoppingReplay = useRef<Promise<void>>(Promise.resolve());
    const [sampleReplaySession] = useState(() => Math.random() < 0.1);
    // Revoke during render so an already-queued transport/recording callback
    // cannot observe the old permission while layout-effect cleanup is pending.
    if (!optionalTelemetryAllowed || activeReplayIdentity.current !== identityKey) {
        setSentryOptionalTelemetryEnabled(false);
    }

    useLayoutEffect(() => {
        let cancelled = false;
        const replay = Sentry.getReplay();
        if (optionalTelemetryAllowed) {
            // A previous session's stop flush must finish while transport is
            // blocked before a newly authorized identity can start recording.
            void stoppingReplay.current.then(() => {
                if (cancelled || !canSendCrashReport() || isSharePrivateSession()) return;
                activeReplayIdentity.current = identityKey;
                setSentryOptionalTelemetryEnabled(true);
                if (sampleReplaySession) replay?.start();
                else replay?.startBuffering();
            });
        }
        return () => {
            cancelled = true;
            activeReplayIdentity.current = null;
            setSentryOptionalTelemetryEnabled(false);
            stoppingReplay.current = Promise.all([
                stoppingReplay.current,
                replay?.stop().catch(() => {}) ?? Promise.resolve(),
            ]).then(() => undefined);
        };
    }, [optionalTelemetryAllowed, identityKey, sampleReplaySession]);

    useEffect(() => {
        let cancelled = false;
        // Keep logger privacy gate in sync with user preferences
        configureLoggerContext({
            bugReportsEnabled,
            diagnosticLogCollectionEnabled: reportingEligibility.bug,
            diagnosticIdentity: reportingEligibility.profileId ?? null,
        });

        if (Sentry.getClient()) {
            if (currentUser && bugReportsEnabled) {
                if (options.debug) log.debug('Identify user! 🎸', { uid: currentUser.uid });
                getDID()
                    .then(did => {
                        if (
                            cancelled ||
                            !canSendCrashReport() ||
                            isSharePrivateSession() ||
                            typeof did !== 'string' ||
                            did.trim() === ''
                        ) {
                            return;
                        }

                        const user = {
                            id: did,
                        };
                        if (options.debug) log.debug('🔍 Sentry User Context Identified', user);

                        Sentry.setUser(user);
                        Sentry.setTag('packageVersion', __PACKAGE_VERSION__);
                    })
                    .catch(e => {
                        if (options.debug) {
                            log.error(
                                '❌ Unable to identify Sentry User because DID could not be generated.',
                                e
                            );
                        }
                    });
            } else {
                Sentry.setUser(null);
                Sentry.setTag('packageVersion', __PACKAGE_VERSION__);
            }
        }
        return () => {
            cancelled = true;
            Sentry.setUser(null);
        };
    }, [
        currentUser,
        bugReportsEnabled,
        crashGateEnabled,
        reportingEligibility.bug,
        reportingEligibility.profileId,
    ]);
};
