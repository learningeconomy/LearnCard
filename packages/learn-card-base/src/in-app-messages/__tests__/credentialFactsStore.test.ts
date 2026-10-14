import {
    addCredentialSummary,
    clearCredentialFacts,
    loadCredentialFacts,
    onCredentialSummaryAdded,
    removeMissingCredentialFacts,
    saveCredentialFact,
} from '../credentialFactsStore';
import type { CredentialSummary } from '../credentialFacts';

const summary = (uri: string, issuer: string): CredentialSummary => ({
    uri,
    category: 'Learning History',
    types: ['VerifiableCredential', 'ClrCredential'],
    issuer,
    nestedIssuers: [],
    achievementTypes: [],
    issuedAt: null,
});

describe('credentialFactsStore', () => {
    beforeEach(async () => {
        await clearCredentialFacts();
    });

    it('isolates summaries by account DID', async () => {
        await saveCredentialFact('did:example:alice', summary('lc:alice', 'did:issuer:a'));
        await saveCredentialFact('did:example:bob', summary('lc:bob', 'did:issuer:b'));

        expect(await loadCredentialFacts('did:example:alice')).toEqual([
            summary('lc:alice', 'did:issuer:a'),
        ]);
        expect(await loadCredentialFacts('did:example:bob')).toEqual([
            summary('lc:bob', 'did:issuer:b'),
        ]);
    });

    it('prunes removed credentials without touching another account', async () => {
        await saveCredentialFact('did:example:alice', summary('lc:keep', 'did:issuer:a'));
        await saveCredentialFact('did:example:alice', summary('lc:remove', 'did:issuer:a'));
        await saveCredentialFact('did:example:bob', summary('lc:bob', 'did:issuer:b'));

        await removeMissingCredentialFacts('did:example:alice', new Set(['lc:keep']));

        expect(await loadCredentialFacts('did:example:alice')).toEqual([
            summary('lc:keep', 'did:issuer:a'),
        ]);
        expect(await loadCredentialFacts('did:example:bob')).toHaveLength(1);
    });

    it('publishes the explicit account DID and unsubscribes listeners cleanly', async () => {
        const listener = vi.fn();
        const unsubscribe = onCredentialSummaryAdded(listener);

        await addCredentialSummary(
            'did:example:alice',
            'lc:claimed',
            { type: ['VerifiableCredential'], issuer: 'did:issuer:a' },
            'Achievement'
        );

        expect(listener).toHaveBeenCalledWith(
            'did:example:alice',
            expect.objectContaining({ uri: 'lc:claimed', issuer: 'did:issuer:a' })
        );

        unsubscribe();
        await addCredentialSummary('did:example:bob', 'lc:later', {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:b',
        });

        expect(listener).toHaveBeenCalledTimes(1);
    });
});
