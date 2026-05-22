import { beforeEach, describe, expect, it, vi } from 'vitest';

const { injectAlignmentsMock } = vi.hoisted(() => ({
    injectAlignmentsMock: vi.fn(),
}));

vi.mock('@learncard/helpers', () => ({
    isVC2Format: vi.fn(() => false),
}));

vi.mock('@services/skills-provider/inject', () => ({
    injectObv3AlignmentsIntoCredentialForBoost: injectAlignmentsMock,
    buildObv3AlignmentsForBoost: vi.fn(async () => []),
}));

vi.mock('@helpers/template.helpers', () => ({
    hasMustacheVariables: vi.fn(() => false),
    renderBoostTemplate: vi.fn((template: string) => template),
    parseRenderedTemplate: vi.fn((template: string) => JSON.parse(template)),
    shouldAutoAppendTemplateEvidence: vi.fn(() => false),
}));

vi.mock('@models', () => ({}));
vi.mock('../src/models', () => ({}));
vi.mock('@accesslayer/boost/relationships/read', () => ({ getBoostOwner: vi.fn() }));
vi.mock('@accesslayer/credential/create', () => ({ storeCredential: vi.fn() }));
vi.mock('@accesslayer/boost/relationships/create', () => ({
    createBoostInstanceOfRelationship: vi.fn(),
}));
vi.mock('@accesslayer/credential/relationships/create', () => ({
    createSentCredentialRelationship: vi.fn(),
    createCredentialIssuedViaContractRelationship: vi.fn(),
    createListingSentCredentialRelationship: vi.fn(),
}));
vi.mock('@helpers/credential.helpers', () => ({
    acceptCredential: vi.fn(),
    getCredentialUri: vi.fn(),
}));
vi.mock('@helpers/signingAuthority.helpers', () => ({
    issueCredentialWithSigningAuthority: vi.fn(),
}));
vi.mock('@helpers/notifications.helpers', () => ({ addNotificationToQueue: vi.fn() }));
vi.mock('@helpers/did.helpers', () => ({ getDidWeb: vi.fn(() => 'did:web:example.com:recipient') }));
vi.mock('@helpers/status-list.helpers', () => ({
    appendBitstringStatusListEntries: vi.fn(async credential => credential),
}));
vi.mock('@helpers/boost-hash.helpers', () => ({
    computeBoostTemplateHash: vi.fn(() => 'hash'),
}));
vi.mock('@helpers/uri.helpers', () => ({ constructUri: vi.fn() }));
vi.mock('@tracing', () => ({ trace: vi.fn(), traceDb: vi.fn() }));

describe('alignment injection hardening', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        injectAlignmentsMock.mockImplementation(async credential => {
            const subject = Array.isArray(credential.credentialSubject)
                ? credential.credentialSubject[0]
                : credential.credentialSubject;

            subject.achievement = {
                ...(subject.achievement || {}),
                alignment: [
                    {
                        targetName: 'Skill A',
                        targetUrl: 'https://example.com/frameworks/framework-1/skills/skill-a',
                        type: ['Alignment'],
                    },
                ],
            };
        });
    });

    it('injects OBv3 alignments while preparing the unsigned credential', async () => {
        const { prepareCredentialFromBoost } = await import('../../src/helpers/boost.helpers');

        const boost = {
            dataValues: {
                boost: JSON.stringify({
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
                    credentialSubject: {
                        achievement: {
                            name: 'Skillful Learner',
                        },
                    },
                }),
            },
        } as any;

        const prepared = await prepareCredentialFromBoost(
            boost,
            'https://example.com/boosts/boost-1',
            'example.com',
            {
                recipientDid: 'did:web:example.com:users:recipient',
                issuerDid: 'did:web:example.com:issuer',
            }
        );

        expect(injectAlignmentsMock).toHaveBeenCalledTimes(1);
        expect(injectAlignmentsMock).toHaveBeenCalledWith(prepared, boost, 'example.com');
        expect(prepared.issuer).toBe('did:web:example.com:issuer');
        expect((prepared as any).boostId).toBe('https://example.com/boosts/boost-1');
        expect((prepared.credentialSubject as any).id).toBe('did:web:example.com:users:recipient');
        expect((prepared.credentialSubject as any).achievement.alignment).toEqual([
            {
                targetName: 'Skill A',
                targetUrl: 'https://example.com/frameworks/framework-1/skills/skill-a',
                type: ['Alignment'],
            },
        ]);
    });

    it('does not expose a resolve-path alignment helper anymore', async () => {
        const boostHelpers = await import('../../src/helpers/boost.helpers');

        expect('ensureAlignmentsForBoostCredential' in boostHelpers).toBe(false);
    });
});
