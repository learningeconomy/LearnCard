import { useEffect, useRef } from 'react';

import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';
import { switchedProfileStore } from '../stores/walletStore';
import { calculateAgeFromISODate } from '@learncard/helpers';
import { getMinorAgeThreshold } from '../constants/gdprAgeLimits';
import { useGetPreferencesForDid } from '../react-query/queries/preferences';
import { useUpdatePreferences } from '../react-query/mutations/preferences';

/**
 * Read-only consent for the active identity. Missing/error states never authorize
 * optional collection, and profile edits revoke authorization before persistence.
 */
export function usePrivacyConsent() {
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const query = useGetPreferencesForDid();
    const { data: preferences } = query;
    // Public-profile declarations omit private age fields; validate the
    // authenticated self-profile values before applying the shared policy.
    const dob: unknown = Reflect.get(currentLCNUser ?? {}, 'dob');
    const country: unknown = Reflect.get(currentLCNUser ?? {}, 'country');
    const age =
        dob == null || dob === ''
            ? null
            : typeof dob === 'string'
              ? calculateAgeFromISODate(dob)
              : Number.NaN;
    const isMinor =
        preferences?.isMinor === true ||
        profileType === 'child' ||
        currentLCNUser?.type === 'child' ||
        (age !== null &&
            (Number.isNaN(age) ||
                age < getMinorAgeThreshold(typeof country === 'string' ? country : undefined)));
    const isLoading = currentLCNUserLoading || query.isLoading;
    const identityKey =
        query.identityKey && currentLCNUser?.profileId
            ? `${query.identityKey}:${currentLCNUser.profileId}`
            : null;
    const isResolved = Boolean(
        identityKey &&
        !isLoading &&
        query.consentResolved &&
        !query.isError &&
        preferences &&
        // Missing server-owned age metadata means authority was unavailable.
        // Do not initialize defaults from its transient analytics-off projection.
        typeof preferences.isMinor === 'boolean'
    );

    return {
        preferences,
        identityKey,
        isMinor,
        isLoading,
        isResolved,
        analyticsEnabled:
            isResolved &&
            !isMinor &&
            preferences?.isMinor !== true &&
            preferences?.analyticsEnabled === true,
    };
}

/**
 * Apply the existing first-login defaults only after the profile and preferences
 * resolve. Re-evaluate restrictions on every profile change, including accounts
 * that already have incorrectly enabled saved preferences.
 */
export function usePrivacyGate() {
    const consent = usePrivacyConsent();
    const { preferences, identityKey, isResolved, isMinor } = consent;
    const { mutate: updatePreferences } = useUpdatePreferences();
    const lastAttempt = useRef<string | null>(null);

    useEffect(() => {
        if (!isResolved || !preferences) return;
        const needsRestriction =
            isMinor &&
            (preferences.analyticsEnabled !== false ||
                preferences.analyticsAutoDisabled !== true ||
                preferences.isMinor !== true ||
                preferences.aiAutoDisabled !== true ||
                preferences.bugReportsEnabled !== false);
        const needsInitialization =
            !isMinor &&
            preferences.aiAutoDisabled === undefined &&
            preferences.analyticsAutoDisabled === undefined;
        if (!needsRestriction && !needsInitialization) return;

        const attempt = JSON.stringify([identityKey, isMinor, preferences]);
        if (lastAttempt.current === attempt) return;
        lastAttempt.current = attempt;

        if (isMinor) {
            updatePreferences({
                aiEnabled: false,
                aiAutoDisabled: true,
                analyticsEnabled: false,
                analyticsAutoDisabled: true,
                bugReportsEnabled: false,
                isMinor: true,
            });
        } else {
            updatePreferences({
                aiEnabled: preferences.aiEnabled ?? true,
                aiAutoDisabled: false,
                analyticsEnabled: preferences.analyticsEnabled ?? true,
                analyticsAutoDisabled: false,
                bugReportsEnabled: preferences.bugReportsEnabled ?? true,
                isMinor: false,
            });
        }
    }, [preferences, identityKey, isResolved, isMinor, updatePreferences]);

    return consent;
}

export default usePrivacyGate;
