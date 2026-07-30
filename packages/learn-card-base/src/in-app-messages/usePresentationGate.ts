import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useIsLoggedIn } from '../stores/currentUserStore';
import { useIsOnboardingOpen } from '../stores/redirectStore';
import { useAuthStatus } from '../auth-status/useAuthStatus';
import { isAuthSettled } from '../auth-status/authStatus';

import { DEFAULT_SUPPRESSED_ROUTE_PREFIXES, isRouteSuppressed } from './routeSuppression';

export interface PresentationGateOptions {
    enabled?: boolean;
    requireAuth?: boolean;
    suppressed?: boolean;
    suppressedRoutePrefixes?: string[];
    settleDelayMs?: number;
}

export interface PresentationGateResult {
    canPresent: boolean;
    reason:
        | 'ok'
        | 'disabled'
        | 'app-suppressed'
        | 'onboarding-open'
        | 'auth-resolving'
        | 'not-logged-in'
        | 'suppressed-route'
        | 'settling';
}

export const useInAppMessagePresentationGate = (
    options: PresentationGateOptions = {}
): PresentationGateResult => {
    const {
        enabled = true,
        requireAuth = true,
        suppressed = false,
        suppressedRoutePrefixes = DEFAULT_SUPPRESSED_ROUTE_PREFIXES,
        settleDelayMs = 1200,
    } = options;

    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const isOnboardingOpen = useIsOnboardingOpen();
    const authStatus = useAuthStatus();

    const settledAuth = isAuthSettled(authStatus);
    const routeBlocked = isRouteSuppressed(location.pathname, suppressedRoutePrefixes);

    let reason: PresentationGateResult['reason'] = 'ok';

    if (!enabled) reason = 'disabled';
    else if (suppressed) reason = 'app-suppressed';
    else if (isOnboardingOpen) reason = 'onboarding-open';
    else if (!settledAuth) reason = 'auth-resolving';
    else if (requireAuth && !isLoggedIn) reason = 'not-logged-in';
    else if (routeBlocked) reason = 'suppressed-route';

    const eligible = reason === 'ok';

    const [settled, setSettled] = useState(false);

    useEffect(() => {
        if (!eligible) {
            setSettled(false);

            return;
        }

        const timer = setTimeout(() => setSettled(true), settleDelayMs);

        return () => clearTimeout(timer);
    }, [eligible, settleDelayMs, location.pathname]);

    if (eligible && !settled) return { canPresent: false, reason: 'settling' };

    return { canPresent: eligible && settled, reason };
};
