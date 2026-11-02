import { beforeEach, describe, expect, it } from 'vitest';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import {
    credentialSelectionStore,
    getCredentialSelectionCount,
    getCredentialSelectionCountByCategory,
    isCredentialSelected,
    SelectedCredential,
} from './credentialSelectionStore';
import type { LCR } from 'learn-card-base/types/credential-records';

const record = (uri: string, category: SelectedCredential['category']): LCR =>
    ({ id: `record:${uri}`, uri, category }) as LCR;

const achievement: SelectedCredential = {
    uri: 'achievement:1',
    recordId: 'record:achievement:1',
    category: 'Achievement',
    record: record('achievement:1', 'Achievement'),
};

const badge: SelectedCredential = {
    uri: 'badge:1',
    recordId: 'record:badge:1',
    category: 'Social Badge',
    record: record('badge:1', 'Social Badge'),
};

describe('credentialSelectionStore', () => {
    beforeEach(() => {
        switchedProfileStore.set.switchedDid('did:web:one');
        credentialSelectionStore.set.exit();
    });

    it('keeps selections while category routes change', () => {
        credentialSelectionStore.set.enter();
        credentialSelectionStore.set.toggle(achievement, 'achievements');
        credentialSelectionStore.set.toggle(badge, 'socialBadges');
        expect(getCredentialSelectionCount()).toBe(2);
        expect(getCredentialSelectionCountByCategory()).toEqual({
            Achievement: 1,
            'Social Badge': 1,
        });
        expect(isCredentialSelected(achievement.uri)).toBe(true);
    });

    it('clears selection when the active account changes or logs out', () => {
        credentialSelectionStore.set.enter();
        credentialSelectionStore.set.selectMany([achievement, badge]);
        switchedProfileStore.set.switchedDid('did:web:two');
        credentialSelectionStore.set.syncAccount();
        expect(credentialSelectionStore.get.active()).toBe(false);
        expect(getCredentialSelectionCount()).toBe(0);

        credentialSelectionStore.set.enter();
        credentialSelectionStore.set.selectMany([achievement]);
        switchedProfileStore.set.switchedDid(undefined);
        credentialSelectionStore.set.syncAccount();
        expect(getCredentialSelectionCount()).toBe(0);
    });
});
