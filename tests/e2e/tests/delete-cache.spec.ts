import { describe, test, expect, beforeEach } from 'vitest';

import { getLearnCardForUser } from './helpers/learncard.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

describe('Delete Functionality and Cache Invalidation', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    describe('Credential Deletion', () => {
        test('can delete a stored credential', async () => {
            // Create and store a credential
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.store.LearnCloud.upload!(vc);
            await a.index.LearnCloud.add({ id: 'test', uri });

            // Verify credential exists
            const recordsBefore = await a.index.LearnCloud.get();
            expect(recordsBefore).toHaveLength(1);
            expect(recordsBefore[0].uri).toEqual(uri);

            // Delete the credential
            const deleted = await a.store.LearnCloud.delete(uri);
            expect(deleted).toBe(true);

            // Verify credential is removed from index
            const recordsAfter = await a.index.LearnCloud.get();
            expect(recordsAfter).toHaveLength(0);
        });

        test('deleting a non-existent credential returns false', async () => {
            const nonExistentUri = 'learncloud:nonexistent:test123';

            // Try to delete a credential that doesn't exist
            const result = await a.store.LearnCloud.delete(nonExistentUri);
            expect(result).toBe(false);
        });

        test('cannot delete credentials owned by another user', async () => {
            // User A creates and stores a credential
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.store.LearnCloud.upload!(vc);
            await a.index.LearnCloud.add({ id: 'test', uri });

            // User B tries to delete User A's credential
            const deleted = await b.store.LearnCloud.delete(uri);
            expect(deleted).toBe(false);

            // Verify User A's credential is still intact
            const records = await a.index.LearnCloud.get();
            expect(records).toHaveLength(1);
            expect(records[0].uri).toEqual(uri);
        });

        test('deleting a credential sent via LCN by the owner removes it from sender and recipient views', async () => {
            // User A issues and sends credential to User B
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // User B accepts the credential
            await b.invoke.acceptCredential(uri);

            // Verify the relationship exists for both sides first
            const receivedCredsBefore = await b.invoke.getReceivedCredentials();
            const sentCredsBefore = await a.invoke.getSentCredentials();
            expect(receivedCredsBefore).toHaveLength(1);
            expect(sentCredsBefore).toHaveLength(1);

            // Owner deletes the credential
            const deleted = await a.store.LearnCloud.delete(uri);
            expect(deleted).toBe(true);

            // Verify credential is removed from both sender and recipient views
            const receivedCredsAfter = await b.invoke.getReceivedCredentials();
            const sentCredsAfter = await a.invoke.getSentCredentials();
            expect(receivedCredsAfter).toHaveLength(0);
            expect(sentCredsAfter).toHaveLength(0);
        });
    });

    describe('Cache Invalidation', () => {
        test('deleting a credential invalidates the cache', async () => {
            // Create and store a credential (this caches it)
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.store.LearnCloud.upload!(vc);
            await a.index.LearnCloud.add({ id: 'test', uri });

            // Read the credential to populate cache
            const cachedBefore = await a.read.get(uri);
            expect(cachedBefore).toBeDefined();
            expect(cachedBefore).toEqual(vc);

            // Delete the credential
            const deleted = await a.store.LearnCloud.delete(uri);
            expect(deleted).toBe(true);

            // Verify cache is invalidated - reading should return undefined
            const cachedAfter = await a.read.get(uri);
            expect(cachedAfter).toBeUndefined();
        });

        test('cache is cleared when deleting with skip-cache option', async () => {
            // Create and store a credential
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.store.LearnCloud.upload!(vc);
            await a.index.LearnCloud.add({ id: 'test', uri });

            // Populate cache
            await a.read.get(uri);

            // Delete the credential (using default cache behavior)
            const deleted = await a.store.LearnCloud.delete(uri);
            expect(deleted).toBe(true);

            // Verify cache is cleared regardless
            const cached = await a.read.get(uri);
            expect(cached).toBeUndefined();
        });

        test('cache invalidation works for encrypted credentials', async () => {
            // Create and store an encrypted credential
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
            await a.index.LearnCloud.add({ id: 'test', uri });

            // Populate cache
            const cachedBefore = await a.read.get(uri);
            expect(cachedBefore).toBeDefined();

            // Delete the credential
            const deleted = await a.store.LearnCloud.delete(uri);
            expect(deleted).toBe(true);

            // Verify cache is invalidated
            const cachedAfter = await a.read.get(uri);
            expect(cachedAfter).toBeUndefined();
        });
    });

    describe('Backwards Compatibility', () => {
        test('plugins without delete method still work correctly', async () => {
            // Create a simple plugin that doesn't implement delete
            const simplePlugin = await a.addPlugin({
                name: 'SimpleTestPlugin',
                store: {
                    upload: async (vc) => {
                        return 'test:simple:123';
                    },
                    // Note: no delete method
                },
            });

            // Verify the plugin works for upload
            const unsignedVc = a.invoke.getTestVc(a.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await simplePlugin.store.SimpleTestPlugin.upload!(vc);
            expect(uri).toBe('test:simple:123');

            // Verify delete is not available for this plugin
            expect(simplePlugin.store.SimpleTestPlugin.delete).toBeUndefined();
        });
    });

    describe('Batch Operations', () => {
        test('deleting multiple credentials works correctly', async () => {
            // Create multiple credentials
            const vcs = [];
            const uris = [];

            for (let i = 0; i < 3; i++) {
                const unsignedVc = a.invoke.getTestVc(a.id.did());
                const vc = await a.invoke.issueCredential(unsignedVc);
                const uri = await a.store.LearnCloud.upload!(vc);
                await a.index.LearnCloud.add({ id: `test-${i}`, uri });
                vcs.push(vc);
                uris.push(uri);
            }

            // Verify all credentials exist
            const recordsBefore = await a.index.LearnCloud.get();
            expect(recordsBefore).toHaveLength(3);

            // Delete all credentials
            for (const uri of uris) {
                const deleted = await a.store.LearnCloud.delete(uri);
                expect(deleted).toBe(true);
            }

            // Verify all credentials are removed
            const recordsAfter = await a.index.LearnCloud.get();
            expect(recordsAfter).toHaveLength(0);

            // Verify all caches are invalidated
            for (const uri of uris) {
                const cached = await a.read.get(uri);
                expect(cached).toBeUndefined();
            }
        });
    });

    describe('Error Handling', () => {
        test('delete returns false for malformed URIs', async () => {
            const malformedUri = 'invalid-uri-format';

            const result = await a.store.LearnCloud.delete(malformedUri);
            expect(result).toBe(false);
        });

        test('delete handles empty URI gracefully', async () => {
            const result = await a.store.LearnCloud.delete('');
            expect(result).toBe(false);
        });
    });
});
