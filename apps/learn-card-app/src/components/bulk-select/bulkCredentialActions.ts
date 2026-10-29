import type { SelectedCredential } from '../../stores/credentialSelectionStore';
import * as m from '../../paraglide/messages.js';

export type BulkCredentialActionContext = 'passport' | 'archived';

export type BulkCredentialActionEnvironment = {
    shareMultipleEnabled: boolean;
};

export type BulkCredentialAction = {
    id: 'share' | 'archive' | 'restore' | 'delete' | string;
    label: (count: number) => string;
    tone: 'default' | 'destructive';
    contexts: BulkCredentialActionContext[];
    priority: number;
    isAvailable: (
        selection: readonly SelectedCredential[],
        environment: BulkCredentialActionEnvironment
    ) => boolean;
};

export const bulkCredentialActions: BulkCredentialAction[] = [
    {
        id: 'share',
        label: count => m['bulkSelection.share']({ count }),
        tone: 'default',
        contexts: ['passport'],
        priority: 10,
        isAvailable: (selection, environment) =>
            environment.shareMultipleEnabled && selection.length > 0,
    },
    {
        id: 'archive',
        label: count => m['bulkSelection.archive']({ count }),
        tone: 'default',
        contexts: ['passport'],
        priority: 20,
        isAvailable: selection => selection.length > 0,
    },
    {
        id: 'restore',
        label: count => m['bulkSelection.restore']({ count }),
        tone: 'default',
        contexts: ['archived'],
        priority: 20,
        isAvailable: selection => selection.length > 0,
    },
    {
        id: 'delete',
        label: count => m['bulkSelection.delete']({ count }),
        tone: 'destructive',
        contexts: ['passport', 'archived'],
        priority: 30,
        isAvailable: selection => selection.length > 0,
    },
];

export const getAvailableBulkCredentialActions = (
    context: BulkCredentialActionContext,
    selection: readonly SelectedCredential[],
    environment: BulkCredentialActionEnvironment,
    actions = bulkCredentialActions
): BulkCredentialAction[] =>
    actions
        .filter(
            action =>
                action.contexts.includes(context) && action.isAvailable(selection, environment)
        )
        .sort((left, right) => left.priority - right.priority);

export const partitionBulkCredentialActions = (
    actions: readonly BulkCredentialAction[]
): { dock: BulkCredentialAction[]; overflow: BulkCredentialAction[] } => ({
    dock: actions.slice(0, 3),
    overflow: actions.slice(3),
});
