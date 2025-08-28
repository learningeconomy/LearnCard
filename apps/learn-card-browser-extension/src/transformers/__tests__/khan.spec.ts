import { describe, it, expect } from 'vitest';
import { transformCandidate } from '..';
import type { CredentialCandidate } from '../../types/messages';
import type { TransformerHelpers } from '../types';

describe('khanPlatformToObv3 transformer', () => {
  it('creates a self-attested OBv3 AchievementCredential from a khanacademy platform candidate', async () => {
    const candidate: CredentialCandidate = {
      source: 'platform',
      platform: 'khanacademy',
      title: 'Completed: Intro to HTML/CSS',
      url: 'https://www.khanacademy.org/computing/computer-programming/html-css',
      raw: {
        platform: 'khanacademy',
        event: 'completion',
        unitTitle: 'Intro to HTML/CSS',
        courseTitle: 'Computer programming',
        completedAt: '2025-08-19T20:00:00.000Z',
        url: 'https://www.khanacademy.org/computing/computer-programming/html-css',
        evidence: [
          {
            type: 'Evidence',
            name: 'Khan Academy Activity',
            description: 'Detected completion event on Khan Academy',
            url: 'https://www.khanacademy.org/computing/computer-programming/html-css'
          }
        ]
      }
    };

    const helpers: TransformerHelpers = {
      postJson: async () => ({}),
      fetchJson: async () => ({}),
      getDidAuthVp: async () => ({}),
      getDid: async () => 'did:test:123'
    };

    const out = await transformCandidate(candidate, helpers);
    expect(out).toBeTruthy();
    const [vc] = out!.vcs as Array<Record<string, unknown>>;

    // shape
    expect(Array.isArray(vc['@context'] as unknown[])).toBe(true);
    const ctx = vc['@context'] as string[];
    expect(ctx).toContain('https://w3id.org/openbadges/v3');

    const types = vc['type'] as string[];
    expect(types).toContain('AchievementCredential');

    expect(vc['issuer']).toBe('did:test:123');

    const cs = vc['credentialSubject'] as Record<string, unknown>;
    expect(cs['id']).toBe('did:test:123');
    const ach = cs['achievement'] as Record<string, unknown>;
    expect(typeof ach['name']).toBe('string');
    expect(typeof ach['criteria']).toBe('object');

    const evidence = vc['evidence'] as unknown[];
    expect(Array.isArray(evidence)).toBe(true);
  });
});
