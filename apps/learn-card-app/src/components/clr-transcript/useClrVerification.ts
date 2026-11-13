import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { VC } from '@learncard/types';
import type { ClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import {
    boundedVerification,
    createClrVerificationSnapshot,
    createUnavailableClrVerificationSnapshot,
    createVerificationBudget,
    hasSignedClrCredentials,
    verifyClrCredentialTree,
} from 'learn-card-base/helpers/credentials/clr/verification';
import type { ClrVerificationSnapshot } from 'learn-card-base/helpers/credentials/clr/verification.types';

export interface ClrVerificationSession {
    getSnapshot: () => ClrVerificationSnapshot;
    subscribe: (listener: () => void) => () => void;
    update: (snapshot: ClrVerificationSnapshot) => void;
}

const createSession = (initial: ClrVerificationSnapshot): ClrVerificationSession => {
    let snapshot = initial;
    const listeners = new Set<() => void>();
    return {
        getSnapshot: () => snapshot,
        subscribe: listener => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        update: next => {
            snapshot = next;
            listeners.forEach(listener => listener());
        },
    };
};

export const useClrVerification = (
    model: ClrTranscriptDisplayModel,
    supplied?: ClrVerificationSnapshot,
    sharedSession?: ClrVerificationSession
) => {
    const localSession = useMemo(
        () => createSession(supplied ?? createClrVerificationSnapshot(model.canonical)),
        [model.canonical]
    );
    const session = sharedSession ?? localSession;
    const snapshot = useSyncExternalStore(
        session.subscribe,
        session.getSnapshot,
        session.getSnapshot
    );
    const [pass, setPass] = useState(0);
    const retry = useCallback(() => setPass(value => value + 1), []);

    useEffect(() => {
        if (sharedSession) return;
        if (supplied) {
            localSession.update(supplied);
            return;
        }
        let current = true;
        const budget = createVerificationBudget();
        const initial = createClrVerificationSnapshot(model.canonical);
        localSession.update(initial);
        if (!hasSignedClrCredentials(initial)) {
            localSession.update({ ...initial, complete: true });
            return () => {
                current = false;
                budget.cancel();
            };
        }
        // Verification needs issuer public keys, not the learner's account/session.
        // Reuse the anonymous share-link client; never trigger account recovery.
        void boundedVerification(getBespokeLearnCard('a'), budget)
            .then(async wallet => {
                if (!current) return;
                if (!wallet?.invoke?.verifyCredential)
                    throw new Error('Wallet credential verifier unavailable');
                const result = await verifyClrCredentialTree(
                    model.canonical,
                    credential => wallet.invoke.verifyCredential(credential as VC, {}, false),
                    budget,
                    next => {
                        if (current) localSession.update(next);
                    }
                );
                if (current) localSession.update(result);
            })
            .catch(() => {
                if (current)
                    localSession.update(createUnavailableClrVerificationSnapshot(model.canonical));
            });
        return () => {
            current = false;
            budget.cancel();
        };
    }, [model.canonical, supplied, sharedSession, localSession, pass]);

    return { snapshot: sharedSession ? snapshot : (supplied ?? snapshot), retry, session };
};
