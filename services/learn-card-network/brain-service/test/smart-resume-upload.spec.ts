import { afterEach, expect, it, vi } from 'vitest';
import { uploadSmartResume } from '@helpers/smartResume.helpers';
import { resolveUri } from '@helpers/uri.helpers';
import { normalFullTerms } from './helpers/contract';

vi.mock('@helpers/uri.helpers', () => ({ resolveUri: vi.fn() }));
afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
});
it('publishes only selected fields and deduplicated credentials with the existing SmartResume payload', async () => {
    const terms = structuredClone(normalFullTerms);
    terms.read.credentials.categories = {
        Achievement: { shared: ['urn:synthetic', 'urn:synthetic'] },
    };
    terms.read.personal = {
        name: 'Synthetic Learner',
        email: 'synthetic@example.com',
        ignored: 'private',
    };
    vi.mocked(resolveUri).mockResolvedValue({
        id: 'urn:synthetic',
        boostCredential: {
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:learner' },
        },
    });
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'synthetic-token' })))
        .mockResolvedValueOnce(
            new Response(JSON.stringify({ redirect_url: 'https://example.com/resume' }))
        );
    vi.stubGlobal('fetch', fetch);
    expect(await uploadSmartResume(terms, 'did:example:learner', 'synthetic-recipient')).toBe(
        'https://example.com/resume'
    );
    expect(resolveUri).toHaveBeenCalledOnce();
    const payload = JSON.parse(fetch.mock.calls[1][1].body);
    expect(payload.recipient).toEqual({
        id: 'did:example:learner',
        givenName: 'Synthetic Learner',
        familyName: '',
        email: 'synthetic@example.com',
    });
    expect(payload.credentials).toEqual([
        {
            id: 'urn:synthetic',
            issuer: { id: 'did:example:issuer' },
            credentialSubject: { id: 'did:example:learner' },
        },
    ]);
    expect(JSON.stringify(payload)).not.toContain('private');
});
it('does not publish a partial selection when credential resolution fails', async () => {
    vi.mocked(resolveUri).mockRejectedValue(new Error('Synthetic resolution failure'));
    const fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ access_token: 'synthetic-token' })));
    vi.stubGlobal('fetch', fetch);
    await expect(
        uploadSmartResume(normalFullTerms, 'did:example:learner', 'synthetic-recipient')
    ).rejects.toThrow('Synthetic resolution failure');
    expect(fetch).toHaveBeenCalledOnce();
});
