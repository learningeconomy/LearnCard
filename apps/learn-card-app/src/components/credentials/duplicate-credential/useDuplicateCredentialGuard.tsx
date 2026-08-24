import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { VC } from '@learncard/types';
import { useQueryClient } from '@tanstack/react-query';
import { getLogger, ToastTypeEnum, useToast, useWallet } from 'learn-card-base';
import { getOrFetchResolvedCredential } from 'learn-card-base/react-query/queries/vcQueries';
import * as m from '../../../paraglide/messages.js';

import {
    DuplicateCredentialPrompt,
    type DuplicateCredentialAction,
} from './DuplicateCredentialPrompt';
import {
    findDuplicateCredential,
    type DuplicateCredentialLookup,
    type ExistingCredentialMatch,
} from './findDuplicateCredential';

const log = getLogger('duplicate-credential-guard');

export type DuplicateCredentialResolution = {
    action: DuplicateCredentialAction;
    isDuplicate: boolean;
};

const CONTINUE_WITH_NEW_CREDENTIAL: DuplicateCredentialResolution = {
    action: 'save',
    isDuplicate: false,
};

export const useDuplicateCredentialGuard = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const [existing, setExisting] = useState<ExistingCredentialMatch | null>(null);
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
    const mountedRef = useRef(true);
    const choiceResolverRef = useRef<((resolution: DuplicateCredentialResolution) => void) | null>(
        null
    );
    const activeRequestRef = useRef<Promise<DuplicateCredentialResolution> | null>(null);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            choiceResolverRef.current?.({ action: 'cancel', isDuplicate: true });
            choiceResolverRef.current = null;
        };
    }, []);

    const choose = useCallback((action: DuplicateCredentialAction) => {
        choiceResolverRef.current?.({ action, isDuplicate: true });
        choiceResolverRef.current = null;
        setExisting(null);
    }, []);

    const requestDuplicateResolution = useCallback(
        (
            credential: VC,
            lookup?: DuplicateCredentialLookup
        ): Promise<DuplicateCredentialResolution> => {
            if (activeRequestRef.current) {
                return Promise.resolve({ action: 'cancel', isDuplicate: false });
            }

            setIsCheckingDuplicate(true);
            const request = (async () => {
                try {
                    const wallet = await initWallet();
                    const match = await findDuplicateCredential(wallet, credential, lookup, uri =>
                        getOrFetchResolvedCredential(uri, initWallet, queryClient)
                    );
                    if (!mountedRef.current) {
                        return { action: 'cancel' as const, isDuplicate: Boolean(match) };
                    }

                    setIsCheckingDuplicate(false);
                    if (!match) return CONTINUE_WITH_NEW_CREDENTIAL;

                    setExisting(match);
                    return await new Promise<DuplicateCredentialResolution>(resolve => {
                        choiceResolverRef.current = resolve;
                    });
                } catch (error) {
                    if (mountedRef.current) setIsCheckingDuplicate(false);
                    if (
                        error instanceof Error &&
                        error.name === 'DuplicateCredentialScanIncompleteError'
                    ) {
                        log.warn('Duplicate credential scan incomplete; continuing claim', error);
                        return CONTINUE_WITH_NEW_CREDENTIAL;
                    }

                    if (
                        error instanceof Error &&
                        error.name === 'DuplicateCredentialScanSafetyError'
                    ) {
                        log.warn('Duplicate credential scan stopped at its safety boundary', error);
                        if (mountedRef.current) {
                            presentToast(m['toasts.claimOops'](), {
                                duration: 4000,
                                type: ToastTypeEnum.Error,
                            });
                        }
                        return { action: 'cancel', isDuplicate: false };
                    }

                    // Duplicate detection must never block a legitimate claim when the wallet index
                    // is temporarily unavailable. The underlying claim still reports real failures.
                    log.warn('Unable to check for an existing credential', error);
                    return CONTINUE_WITH_NEW_CREDENTIAL;
                }
            })();

            activeRequestRef.current = request;
            void request.finally(() => {
                if (activeRequestRef.current === request) activeRequestRef.current = null;
            });

            return request;
        },
        [initWallet, presentToast, queryClient]
    );

    return {
        isCheckingDuplicate,
        requestDuplicateResolution,
        duplicateCredentialPrompt: existing ? (
            <DuplicateCredentialPrompt existing={existing} onChoose={choose} />
        ) : null,
    };
};
