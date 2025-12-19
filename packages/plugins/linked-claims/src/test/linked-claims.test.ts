import { getLinkedClaimsPlugin } from '../index';
import type { VC, VerificationCheck } from '@learncard/types';

// Minimal mock LearnCard with just the surfaces the plugin uses
const createMockLearnCard = () => {
  const mock = {
    id: { did: () => 'did:example:issuer' },
    invoke: {
      issueCredential: async (unsigned: any): Promise<VC> => ({
        id: 'urn:uuid:endorsement-1',
        ...unsigned,
      }) as any,
      verifyCredential: async (_vc: VC, _opts?: any): Promise<VerificationCheck> => ({
        checks: [],
        warnings: [],
        errors: [],
      }),
    },
    // Not used in these tests, but kept for completeness
    store: { TestStore: { uploadEncrypted: async (_: any) => 'lc://test-uri' } },
    index: {
      LearnCloud: {
        add: async (_: any) => true,
        get: async (_: any) => [],
      },
    },
    read: { get: async (_: string) => undefined },
  } as unknown as any;

  return mock;
};

const VC_V2 = 'https://www.w3.org/ns/credentials/v2';
const OBV3 = 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json';

const makeOriginalWithId = (): VC => ({
  '@context': [VC_V2],
  type: ['VerifiableCredential'],
  issuer: 'did:example:someone',
  validFrom: new Date().toISOString(),
  credentialSubject: { id: 'did:example:subject-123' },
  id: 'urn:uuid:original-123',
} as any);

const makeOriginalWithoutIdButSubject = (): VC => ({
  '@context': [VC_V2],
  type: ['VerifiableCredential'],
  issuer: 'did:example:someone',
  validFrom: new Date().toISOString(),
  credentialSubject: { id: 'did:example:subject-abc' },
} as any);

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

describe('LinkedClaims Plugin', () => {
  test('endorseCredential: minimal (comment only) with original id', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);

    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(
      lc,
      original,
      { endorsementComment: 'Solid work' },
      {}
    );

    const ctx = endorsement['@context'] as any[];
    expect(Array.isArray(ctx)).toBe(true);
    expect(ctx).toEqual(expect.arrayContaining([VC_V2, OBV3]));

    const types = endorsement.type as string[];
    expect(types).toEqual(expect.arrayContaining(['VerifiableCredential', 'EndorsementCredential']));

    expect((endorsement as any).issuer).toBe('did:example:issuer');

    const cs = (endorsement as any).credentialSubject;
    const csObj = Array.isArray(cs) ? cs[0] : cs;
    expect(csObj.id).toBe('urn:uuid:original-123'); // prefers original.id when present
    expect(csObj.type).toEqual(expect.arrayContaining(['EndorsementSubject']));
    expect(csObj.endorsementComment).toBe('Solid work');

    // default name applied when not provided
    expect((endorsement as any).name).toBe('Endorsement of urn:uuid:original-123');
  });

  test('endorseCredential: with name and description only, resolves subject id fallback', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithoutIdButSubject();

    const endorsement = await plugin.methods.endorseCredential(
      lc,
      original,
      { name: 'Kudos', description: 'Peer endorsement' },
      {}
    );

    const cs = (endorsement as any).credentialSubject;
    const csObj = Array.isArray(cs) ? cs[0] : cs;
    expect(csObj.id).toBe('did:example:subject-abc');
    expect((endorsement as any).name).toBe('Kudos');
    expect((endorsement as any).description).toBe('Peer endorsement');
    expect(csObj.endorsementComment).toBeUndefined();
  });

  test('endorseCredential: throws if original lacks id and credentialSubject.id', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);

    const original = {
      '@context': [VC_V2],
      type: ['VerifiableCredential'],
      issuer: 'did:example:none',
      validFrom: new Date().toISOString(),
      credentialSubject: {},
    } as any as VC;

    await expect(
      plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {})
    ).rejects.toThrow('Original credential must have either id or credentialSubject.id');
  });

  test('verifyEndorsement: valid endorsement passes and adds linked-claims check', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'Nice' }, {});

    const result = await plugin.methods.verifyEndorsement(lc, endorsement, {});
    expect(result.errors).toHaveLength(0);
    expect(result.checks).toEqual(expect.arrayContaining(['linked-claims']));
  });

  test('verifyEndorsement: missing OBv3 context -> error', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {});
    const bad = clone(endorsement);
    (bad as any)['@context'] = [VC_V2];

    const res = await plugin.methods.verifyEndorsement(lc, bad as any, {});
    expect(res.errors.join(' ')).toMatch(/missing VCv2 or OBv3 context/);
  });

  test('verifyEndorsement: missing VC v2 context -> error', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {});
    const bad = clone(endorsement);
    (bad as any)['@context'] = [OBV3];

    const res = await plugin.methods.verifyEndorsement(lc, bad as any, {});
    expect(res.errors.join(' ')).toMatch(/missing VCv2 or OBv3 context/);
  });

  test('verifyEndorsement: missing EndorsementCredential type -> error', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {});
    const bad = clone(endorsement);
    (bad as any).type = ['VerifiableCredential'];

    const res = await plugin.methods.verifyEndorsement(lc, bad as any, {});
    expect(res.errors.join(' ')).toMatch(/missing EndorsementCredential type/);
  });

  test('verifyEndorsement: subject type missing EndorsementSubject -> error', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {});
    const bad = clone(endorsement);
    const cs = (bad as any).credentialSubject;
    const csObj = Array.isArray(cs) ? cs[0] : cs;
    csObj.type = ['SomeOtherType'];

    const res = await plugin.methods.verifyEndorsement(lc, bad as any, {});
    expect(res.errors.join(' ')).toMatch(/credentialSubject\.type must include EndorsementSubject/);
  });

  test('verifyEndorsement: missing credentialSubject.id -> error', async () => {
    const lc = createMockLearnCard();
    const plugin = getLinkedClaimsPlugin(lc);
    const original = makeOriginalWithId();

    const endorsement = await plugin.methods.endorseCredential(lc, original, { endorsementComment: 'x' }, {});
    const bad = clone(endorsement);
    const cs = (bad as any).credentialSubject;
    const csObj = Array.isArray(cs) ? cs[0] : cs;
    delete csObj.id;

    const res = await plugin.methods.verifyEndorsement(lc, bad as any, {});
    expect(res.errors.join(' ')).toMatch(/credentialSubject\.id missing/);
  });
});
