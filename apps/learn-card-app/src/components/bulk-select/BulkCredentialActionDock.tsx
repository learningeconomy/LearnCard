import { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import * as m from '../../paraglide/messages.js';
import { credentialSelectionStore } from '../../stores/credentialSelectionStore';
import {
    BulkCredentialAction,
    getAvailableBulkCredentialActions,
    partitionBulkCredentialActions,
} from './bulkCredentialActions';
import { BulkMutationAction, useRunBulkAction } from './useRunBulkAction';

const mutationActions = new Set<BulkCredentialAction['id']>(['archive', 'restore', 'delete']);

export const BulkCredentialActionDock = () => {
    const flags = useFlags();
    const active = credentialSelectionStore.use.active();
    const context = credentialSelectionStore.use.context();
    const items = credentialSelectionStore.use.items();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { pendingAction, run } = useRunBulkAction();
    const selected = Object.values(items);

    if (!active || flags?.bulkCredentialActions !== true) return null;

    const { dock } = partitionBulkCredentialActions(
        getAvailableBulkCredentialActions(context, selected, {
            shareMultipleEnabled: flags?.shareMultipleEnabled === true,
        })
    );
    const count = selected.length;

    const execute = async (action: BulkCredentialAction): Promise<void> => {
        if (!mutationActions.has(action.id)) return;
        if (action.id === 'delete' && !confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }
        setConfirmingDelete(false);
        await run(action.id as BulkMutationAction);
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-grayscale-200 bg-white px-4 py-3 font-poppins shadow-[0_-8px_24px_rgba(24,34,78,0.12)]">
            <div className="mx-auto flex max-w-[600px] flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-grayscale-900">
                        {m['bulkSelection.selected']({ count })}
                    </span>
                    <button
                        type="button"
                        className="text-sm font-medium text-grayscale-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                        onClick={() => credentialSelectionStore.set.exit()}
                    >
                        {m['bulkSelection.done']()}
                    </button>
                </div>
                {confirmingDelete && (
                    <div className="flex items-center justify-between gap-3 rounded-[20px] bg-red-50 p-3">
                        <span className="text-sm text-red-700">
                            {m['bulkSelection.deleteConfirm']()}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 text-sm font-medium text-grayscale-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                                onClick={() => setConfirmingDelete(false)}
                            >
                                {m['common.cancel']()}
                            </button>
                            <button
                                type="button"
                                className="rounded-[20px] bg-red-600 px-3 py-2 text-sm font-medium text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                                onClick={() => run('delete')}
                            >
                                {m['bulkSelection.deleteConfirmAction']()}
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex gap-2 overflow-x-auto">
                    {dock.map(action => (
                        <button
                            key={action.id}
                            type="button"
                            disabled={!count || pendingAction !== undefined}
                            className={`shrink-0 rounded-[20px] px-4 py-3 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
                                action.tone === 'destructive'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-grayscale-900 text-white'
                            }`}
                            onClick={() => void execute(action)}
                        >
                            {pendingAction === action.id
                                ? m['bulkSelection.working']()
                                : action.label(count)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
