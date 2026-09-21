import { buildShareManifest, encryptSharePayload } from 'learn-card-base/helpers/share-links';
export const id = 'AAAAAAAAAAAAAAAAAAAAAA';
export const key = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const proof = {
    type: 'Ed25519Signature2020',
    created: '2026-09-21T00:00:00Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:example:issuer#key',
    proofValue: 'fixture-only',
};
const names = [
    'Community leadership',
    'Designing for accessibility',
    'Climate action volunteer',
    'First aid and CPR',
    'Creative problem solving',
    'Project management',
];
const credentials = names.map((name, index) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:fixture:${index}`,
    type: ['VerifiableCredential'],
    name,
    issuer: {
        id: 'did:example:issuer',
        name: index % 2 ? 'Open Learning Institute' : 'Community Learning Collective',
    },
    credentialSubject: { id: 'did:example:alex' },
    description:
        'Recognizing practical skills, meaningful contributions, and learning through experience.',
    proof,
}));
const params = new URLSearchParams(location.search);
export const wallet = {
    id: { did: () => 'did:example:alex' },
    read: { get: async (uri: string) => credentials[Number(uri.split(':').at(-1))] },
    index: {
        LearnCloud: {
            get: async () => [],
            getPage: async () => ({
                records: credentials.map((_, i) => ({ uri: `fixture:${i}` })),
                hasMore: false,
            }),
        },
    },
    invoke: {
        getProfile: async () => ({ profileId: 'alex', displayName: 'Alex Morgan' }),
        issuePresentation: async (vp: object) => ({
            ...vp,
            proof: { ...proof, proofPurpose: 'authentication' },
        }),
        createDagJwe: async () => ({ protected: 'e30', iv: 'a', ciphertext: 'b', tag: 'c' }),
        createShareLink: async () => ({
            status: 'completed',
            share: { status: 'active', expiresAt: '2026-10-21T00:00:00Z' },
        }),
        resolveShareLink: async () =>
            params.get('state')
                ? { state: params.get('state'), id }
                : {
                      state: 'active',
                      id,
                      contentVersion: 1,
                      title: 'A little of what I can do',
                      note: 'A few highlights from my learning journey. Thank you for taking a look.',
                      selectedCount: 3,
                      sharer: { displayName: 'Alex Morgan' },
                      expiresAt: '2026-10-21T00:00:00Z',
                  },
        getShareLinkContent: async () => ({
            id,
            contentVersion: 1,
            receipt: 'fixture-receipt',
            envelope: await encryptSharePayload({
                shareId: id,
                contentVersion: 1,
                key,
                payload: buildShareManifest({
                    shareId: id,
                    contentVersion: 1,
                    createdAt: '2026-09-21T00:00:00Z',
                    sharer: { profileId: 'alex', displayName: 'Alex Morgan' },
                    presentation: {
                        '@context': ['https://www.w3.org/2018/credentials/v1'],
                        type: 'VerifiablePresentation',
                        holder: 'did:example:alex',
                        verifiableCredential: credentials.slice(0, 3),
                        proof: { ...proof, proofPurpose: 'authentication' },
                    },
                    selection: [0, 1, 2].map(credentialIndex => ({ credentialIndex })),
                }),
            }),
        }),
        verifyPresentation: async () => ({ checks: ['proof'], warnings: [], errors: [] }),
        verifyCredential: async () => ({ checks: ['proof'], warnings: [], errors: [] }),
        acknowledgeShareLinkView: async () => ({ ok: true }),
    },
};
export const getBespokeLearnCard = async () => wallet;
export const useWallet = () => ({ initWallet: getBespokeLearnCard });
export const getAppBaseUrl = () => 'https://preview.example';
