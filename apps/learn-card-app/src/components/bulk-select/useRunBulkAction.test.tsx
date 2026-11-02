import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCR } from 'learn-card-base/types/credential-records';
import {
    credentialSelectionStore,
    getCredentialSelectionCount,
    SelectedCredential,
} from '../../stores/credentialSelectionStore';

const mocks = vi.hoisted(() => ({
    archive: { mutateAsync: vi.fn() },
    remove: { mutateAsync: vi.fn() },
    restore: { mutateAsync: vi.fn() },
    presentToast: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    useArchiveCredentialRecords: () => mocks.archive,
    useBulkDeleteCredentialRecords: () => mocks.remove,
    useRestoreCredentialRecords: () => mocks.restore,
    useToast: () => ({ presentToast: mocks.presentToast }),
}));

vi.mock('../../paraglide/messages.js', () => ({
    'bulkSelection.actionFailed': () => 'Action failed',
    'bulkSelection.archiveSuccess': () => 'Credentials archived',
    'bulkSelection.deleteSuccess': () => 'Credentials deleted',
    'bulkSelection.restoreSuccess': () => 'Credentials restored',
}));

import { useRunBulkAction } from './useRunBulkAction';

const createSelection = (uri: string): SelectedCredential => {
    const record = {
        id: `record:${uri}`,
        uri,
        category: 'Achievement',
    } as LCR;
    return { uri, recordId: record.id, category: 'Achievement', record };
};

describe('useRunBulkAction', () => {
    beforeEach(() => {
        credentialSelectionStore.set.exit();
        mocks.archive.mutateAsync.mockReset();
        mocks.remove.mutateAsync.mockReset();
        mocks.restore.mutateAsync.mockReset();
        mocks.presentToast.mockReset();
    });

    it('exits select mode after every selected credential archives', async () => {
        const selection = createSelection('credential:one');
        credentialSelectionStore.set.enter('passport');
        credentialSelectionStore.set.selectMany([selection]);
        mocks.archive.mutateAsync.mockResolvedValue({ succeeded: [selection.record], failed: [] });

        const { result } = renderHook(useRunBulkAction);
        await act(async () => result.current.run('archive'));

        expect(credentialSelectionStore.get.active()).toBe(false);
        expect(getCredentialSelectionCount()).toBe(0);
    });

    it('keeps select mode active when a failed credential remains selected', async () => {
        const succeeded = createSelection('credential:one');
        const failed = createSelection('credential:two');
        credentialSelectionStore.set.enter('passport');
        credentialSelectionStore.set.selectMany([succeeded, failed]);
        mocks.archive.mutateAsync.mockResolvedValue({
            succeeded: [succeeded.record],
            failed: [failed.record],
        });

        const { result } = renderHook(useRunBulkAction);
        await act(async () => result.current.run('archive'));

        expect(credentialSelectionStore.get.active()).toBe(true);
        expect(getCredentialSelectionCount()).toBe(1);
    });
});
