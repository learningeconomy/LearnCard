import { useCallback, useState } from 'react';
import {
    ToastTypeEnum,
    useArchiveCredentialRecords,
    useBulkDeleteCredentialRecords,
    useRestoreCredentialRecords,
    useToast,
} from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
import { credentialSelectionStore } from '../../stores/credentialSelectionStore';

export type BulkMutationAction = 'archive' | 'restore' | 'delete';

const successMessage = (action: BulkMutationAction): string => {
    switch (action) {
        case 'archive':
            return m['bulkSelection.archiveSuccess']();
        case 'restore':
            return m['bulkSelection.restoreSuccess']();
        case 'delete':
            return m['bulkSelection.deleteSuccess']();
    }
};

export const useRunBulkAction = () => {
    const { presentToast } = useToast();
    const archive = useArchiveCredentialRecords();
    const restore = useRestoreCredentialRecords();
    const remove = useBulkDeleteCredentialRecords();
    const [pendingAction, setPendingAction] = useState<BulkMutationAction>();

    const run = useCallback(
        async (action: BulkMutationAction): Promise<void> => {
            const selected = Object.values(credentialSelectionStore.get.items());
            if (!selected.length) return;

            setPendingAction(action);
            try {
                const result =
                    action === 'archive'
                        ? await archive.mutateAsync(selected.map(item => item.record))
                        : action === 'restore'
                          ? await restore.mutateAsync(selected.map(item => item.record))
                          : await remove.mutateAsync({
                                records: selected.map(item => item.record),
                            });

                credentialSelectionStore.set.deselectMany(
                    result.succeeded.map(record => record.uri)
                );
                presentToast(
                    result.failed.length
                        ? m['bulkSelection.actionFailed']()
                        : successMessage(action),
                    {
                        type: result.failed.length ? ToastTypeEnum.Error : ToastTypeEnum.Success,
                        hasDismissButton: true,
                    }
                );
            } catch {
                presentToast(m['bulkSelection.actionFailed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } finally {
                setPendingAction(undefined);
            }
        },
        [archive, presentToast, remove, restore]
    );

    return { pendingAction, run };
};
