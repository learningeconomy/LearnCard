import { describe, it, expect } from 'vitest';
import { transformCandidate } from '..';
import type { CredentialCandidate } from '../../types/messages';
import type { TransformerHelpers } from '../types';

const makeVc = (overrides: Record<string, unknown> = {}) => ({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  name: 'Sample',
  ...overrides,
});

describe('transformCandidate', () => {
  it('passes through JSON-LD VC candidates', async () => {
    const candidate: CredentialCandidate = {
      source: 'jsonld',
      raw: makeVc({ name: 'PassThrough' }),
    };

    const helpers: TransformerHelpers = {
      postJson: async () => { throw new Error('not used'); },
      fetchJson: async () => { throw new Error('not used'); },
      getDidAuthVp: async () => ({})
    };

    const out = await transformCandidate(candidate, helpers);
    expect(out).toBeTruthy();
    expect(out?.vcs.length).toBe(1);
    expect(out?.vcs[0]).toMatchObject({ name: 'PassThrough' });
  });

  it('performs VC-API handshake for link candidates', async () => {
    const candidate: CredentialCandidate = {
      source: 'link',
      url: 'https://issuer.example/exchange',
    };

    const vc = makeVc({ name: 'From VC-API' });

    const helpers: TransformerHelpers = {
      postJson: async (url, body) => {
        // first call: init returns a VP request with challenge
        if ((body as any) && Object.keys(body as any).length === 0) {
          return { verifiablePresentationRequest: { challenge: 'abc', domain: 'issuer.example' } };
        }
        // second call: finalize returns a VP with credentials
        return { verifiablePresentation: { verifiableCredential: [vc] } };
      },
      fetchJson: async () => { throw new Error('should not hit fetch fallback'); },
      getDidAuthVp: async () => ({ /* vp-jwt-or-object */ })
    };

    const out = await transformCandidate(candidate, helpers);
    expect(out).toBeTruthy();
    expect(out?.vcs.length).toBe(1);
    expect(out?.vcs[0]).toMatchObject({ name: 'From VC-API' });
  });

  it('falls back to fetching a VC as JSON', async () => {
    const candidate: CredentialCandidate = {
      source: 'link',
      url: 'https://issuer.example/vc.json',
    };

    const vc = makeVc({ name: 'From Fetch' });

    const helpers: TransformerHelpers = {
      postJson: async () => { throw new Error('init/finalize fails'); },
      fetchJson: async () => vc,
      getDidAuthVp: async () => ({})
    };

    const out = await transformCandidate(candidate, helpers);
    expect(out).toBeTruthy();
    expect(out?.vcs.length).toBe(1);
    expect(out?.vcs[0]).toMatchObject({ name: 'From Fetch' });
  });

  it('returns null when no transformer can produce VCs', async () => {
    const candidate: CredentialCandidate = {
      source: 'link',
      url: 'https://issuer.example/unknown',
    };

    const helpers: TransformerHelpers = {
      postJson: async () => { throw new Error('nope'); },
      fetchJson: async () => ({ not: 'a vc' }),
      getDidAuthVp: async () => ({})
    };

    const out = await transformCandidate(candidate, helpers);
    expect(out).toBeNull();
  });
});
