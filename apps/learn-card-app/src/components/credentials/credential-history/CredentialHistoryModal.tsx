import React, { useState } from 'react';
import moment from 'moment';

import { getLogger, useModal, ModalTypes, useWallet } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import type { VC } from '@learncard/types';
import type { CredentialRefreshHistoryEntry, LCR } from 'learn-card-base/types/credential-records';

import BoostClaimCard from '../../boost/claim-boost-card/BoostClaimCard';

import * as m from '../../../paraglide/messages.js';

const log = getLogger('credential-history');

const timestampOf = (entry: CredentialRefreshHistoryEntry): number => {
    const parsed = Date.parse(entry.effectiveAt ?? entry.capturedAt);

    // Unparseable dates sort last when ordering newest first.
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

/**
 * Orders locally retained refresh history newest to oldest. The index record stores
 * entries in capture order (oldest first), so display always re-sorts.
 */
export const sortCredentialHistoryNewestFirst = (
    history: CredentialRefreshHistoryEntry[]
): CredentialRefreshHistoryEntry[] => [...history].sort((a, b) => timestampOf(b) - timestampOf(a));

type CredentialHistoryModalProps = {
    /** The credential's current LearnCloud index record; history comes from its encrypted metadata */
    record: LCR;
    handleCloseModal: () => void;
};

type EntryState = 'loading' | 'unavailable';

/**
 * Previous-version history sheet for refreshed credentials (LC-2117, LC-2135,
 * LC-2136). Presented through the shared modal surface (useModal/AppModal) — no raw
 * IonModal and no safe-area handling here.
 *
 * Entries come from the holder's locally retained encrypted URIs, so the sheet works
 * offline and keeps rendering even when the managed service is revoked or
 * unreachable; a version whose blob can no longer be resolved shows friendly copy
 * inline. Historical versions open read-only — Phase 1 adds no restore or re-share
 * actions.
 */
const CredentialHistoryModal: React.FC<CredentialHistoryModalProps> = ({
    record,
    handleCloseModal,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { initWallet } = useWallet();

    const [entryStates, setEntryStates] = useState<Record<string, EntryState>>({});

    const history = sortCredentialHistoryNewestFirst(record.refresh?.history ?? []);

    const setEntryState = (uri: string, state?: EntryState) =>
        setEntryStates(previous => {
            const next = { ...previous };

            if (state) next[uri] = state;
            else delete next[uri];

            return next;
        });

    const openHistoricalVersion = async (entry: CredentialRefreshHistoryEntry) => {
        if (entryStates[entry.uri] === 'loading') return;

        setEntryState(entry.uri, 'loading');

        try {
            const wallet = await initWallet();
            const resolved = (await wallet.read.get(entry.uri)) as VC | undefined;

            const unwrapped = resolved && unwrapBoostCredential(resolved);
            const historical = (Array.isArray(unwrapped) ? unwrapped[0] : unwrapped) as
                | VC
                | undefined;

            if (!historical) throw new Error('historical credential unavailable');

            setEntryState(entry.uri, undefined);

            // Read-only detail: no claim footer, restore, or share affordances.
            newModal(
                <BoostClaimCard
                    credential={historical}
                    credentialUri={entry.uri}
                    showFooter={false}
                    showBoostFooter
                    acceptCredentialCompleted
                    onDismiss={() => closeModal()}
                    hideEndorsementRequestCard
                    lifecycleStatus="active"
                />
            );
        } catch (error) {
            log.warn('refresh.history.unavailable', error, { uri: entry.uri });
            setEntryState(entry.uri, 'unavailable');
        }
    };

    return (
        <div className="w-full ion-padding" data-testid="credential-history-modal">
            <h2 className="text-xl font-semibold text-grayscale-900 text-center font-poppins">
                {m['credentialHistory.title']()}
            </h2>

            {history.length === 0 ? (
                <p className="mt-4 text-sm text-grayscale-600 text-center leading-relaxed">
                    {m['credentialHistory.empty']()}
                </p>
            ) : (
                <ul className="mt-4 w-full flex flex-col">
                    {history.map(entry => {
                        const state = entryStates[entry.uri];
                        const date = moment(entry.effectiveAt ?? entry.capturedAt).format(
                            'MMM D, YYYY'
                        );

                        return (
                            <li
                                key={entry.uri}
                                data-testid="credential-history-entry"
                                className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0 py-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-grayscale-900">
                                            {m['credentialHistory.versionFrom']({ date })}
                                        </span>
                                        {entry.updateSummary && (
                                            <span className="text-xs text-grayscale-600 mt-0.5 leading-relaxed">
                                                {entry.updateSummary}
                                            </span>
                                        )}
                                        {state === 'unavailable' && (
                                            <span
                                                role="alert"
                                                className="text-xs text-red-700 mt-1 leading-relaxed"
                                            >
                                                {m['credentialHistory.unavailable']()}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openHistoricalVersion(entry)}
                                        disabled={state === 'loading'}
                                        className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium
                                                   text-sm hover:opacity-90 transition-opacity shrink-0
                                                   disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {state === 'loading' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                {m['credentialHistory.loadingVersion']()}
                                            </span>
                                        ) : (
                                            m['credentialHistory.view']()
                                        )}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button
                type="button"
                onClick={handleCloseModal}
                className="mt-5 w-full py-3 px-4 rounded-[20px] border border-grayscale-300
                           text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
            >
                {m['credentialHistory.done']()}
            </button>
        </div>
    );
};

export default CredentialHistoryModal;
