import { describe, expect, it } from 'vitest';
import { SelectedCredential } from '../../stores/credentialSelectionStore';
import {
    BulkCredentialAction,
    getAvailableBulkCredentialActions,
    partitionBulkCredentialActions,
} from './bulkCredentialActions';

const selection: SelectedCredential[] = [
    { uri: 'credential:1', recordId: 'record:1', category: 'Achievement' },
];

describe('bulk credential actions', () => {
    it('uses context and the share flag to decide availability', () => {
        expect(
            getAvailableBulkCredentialActions('passport', selection, {
                shareMultipleEnabled: false,
            }).map(action => action.id)
        ).toEqual(['archive', 'delete']);
        expect(
            getAvailableBulkCredentialActions('archived', selection, {
                shareMultipleEnabled: true,
            }).map(action => action.id)
        ).toEqual(['restore', 'delete']);
    });

    it('places a fifth available action in More without changing the dock limit', () => {
        const fake: BulkCredentialAction = {
            id: 'export',
            label: () => 'Export',
            tone: 'default',
            contexts: ['passport'],
            priority: 40,
            isAvailable: () => true,
        };
        const available = getAvailableBulkCredentialActions(
            'passport',
            selection,
            { shareMultipleEnabled: true },
            [
                {
                    id: 'one',
                    label: () => 'One',
                    tone: 'default',
                    contexts: ['passport'],
                    priority: 1,
                    isAvailable: () => true,
                },
                {
                    id: 'two',
                    label: () => 'Two',
                    tone: 'default',
                    contexts: ['passport'],
                    priority: 2,
                    isAvailable: () => true,
                },
                {
                    id: 'three',
                    label: () => 'Three',
                    tone: 'default',
                    contexts: ['passport'],
                    priority: 3,
                    isAvailable: () => true,
                },
                {
                    id: 'four',
                    label: () => 'Four',
                    tone: 'default',
                    contexts: ['passport'],
                    priority: 4,
                    isAvailable: () => true,
                },
                fake,
            ]
        );
        expect(partitionBulkCredentialActions(available)).toMatchObject({
            dock: [{ id: 'one' }, { id: 'two' }, { id: 'three' }],
            overflow: [{ id: 'four' }, { id: 'export' }],
        });
    });
});
