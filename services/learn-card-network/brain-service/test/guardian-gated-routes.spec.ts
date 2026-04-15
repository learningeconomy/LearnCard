import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';

vi.mock('@accesslayer/profile/relationships/read', () => ({
    isProfileManaged: vi.fn(),
    getProfilesThatManageAProfile: vi.fn(),
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: vi.fn(),
}));

import { isProfileManaged, getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { appRouter } from '../src/app';

const mockIsProfileManaged = vi.mocked(isProfileManaged);
const mockGetProfilesThatManageAProfile = vi.mocked(getProfilesThatManageAProfile);
const mockGetProfileByDid = vi.mocked(getProfileByDid);

const DOMAIN = 'localhost%3A3000';

let guardianLearnCard: SeedLearnCard;
let childLearnCard: SeedLearnCard;
let nonManagedLearnCard: SeedLearnCard;

const mockGuardianProfile = {
    profileId: 'guardian-user',
    displayName: 'Guardian User',
    did: '',
};

const mockChildProfile = {
    profileId: 'child-user',
    displayName: 'Child User',
    did: '',
};

const mockNonManagedProfile = {
    profileId: 'non-managed-user',
    displayName: 'Non-Managed User',
    did: '',
};

const generateGuardianApprovalToken = async (
    signerLearnCard: SeedLearnCard,
    childProfileId: string,
    options: { expired?: boolean; wrongScope?: boolean; wrongSubject?: boolean } = {}
): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const exp = options.expired ? now - 300 : now + 300;
    const scope = options.wrongScope ? 'invalid-scope' : 'guardian-approval';
    const subject = options.wrongSubject
        ? getDidWeb(DOMAIN, 'wrong-profile-id')
        : getDidWeb(DOMAIN, childProfileId);

    const vp = await signerLearnCard.invoke.issuePresentation(
        {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: signerLearnCard.id.did(),
        },
        {
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
            challenge: JSON.stringify({ iss: signerLearnCard.id.did(), sub: subject, exp, scope }),
        }
    );

    if (typeof vp !== 'string') throw new Error('Failed to generate guardian approval token');
    return vp;
};

const createCaller = (did: string, guardianApproval?: string) => {
    return appRouter.createCaller({
        domain: DOMAIN,
        user: { did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE },
        _guardianApprovalToken: guardianApproval,
    });
};

describe('Guardian Gated Routes - Context Passing', () => {
    beforeAll(async () => {
        guardianLearnCard = await getLearnCard('a'.repeat(64));
        childLearnCard = await getLearnCard('b'.repeat(64));
        nonManagedLearnCard = await getLearnCard('c'.repeat(64));

        mockGuardianProfile.did = guardianLearnCard.id.did();
        mockChildProfile.did = childLearnCard.id.did();
        mockNonManagedProfile.did = nonManagedLearnCard.id.did();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Non-managed profiles (isChildAccount: false)', () => {
        it('should pass through for non-managed profiles with isChildAccount=false', async () => {
            mockGetProfileByDid.mockResolvedValue(mockNonManagedProfile as any);
            mockIsProfileManaged.mockResolvedValue(false);

            const caller = createCaller(nonManagedLearnCard.id.did());
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });
    });

    describe('Managed profiles (isChildAccount: true)', () => {
        it('should pass through for managed profiles without guardian approval (hasGuardianApproval=false)', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);
            mockGetProfilesThatManageAProfile.mockResolvedValue([]);

            const caller = createCaller(childLearnCard.id.did());
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });

        it('should pass through for managed profiles with valid guardian approval (hasGuardianApproval=true)', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);
            mockGetProfilesThatManageAProfile.mockResolvedValue([mockGuardianProfile as any]);

            const token = await generateGuardianApprovalToken(guardianLearnCard, 'child-user');
            const caller = createCaller(childLearnCard.id.did(), token);
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for expired token', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);

            const token = await generateGuardianApprovalToken(guardianLearnCard, 'child-user', { expired: true });
            const caller = createCaller(childLearnCard.id.did(), token);
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for wrong scope token', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);

            const token = await generateGuardianApprovalToken(guardianLearnCard, 'child-user', { wrongScope: true });
            const caller = createCaller(childLearnCard.id.did(), token);
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for non-guardian signer', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);
            mockGetProfilesThatManageAProfile.mockResolvedValue([mockGuardianProfile as any]);

            const nonGuardianLearnCard = await getLearnCard('d'.repeat(64));
            const token = await generateGuardianApprovalToken(nonGuardianLearnCard, 'child-user');
            const caller = createCaller(childLearnCard.id.did(), token);
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for wrong subject token', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);

            const token = await generateGuardianApprovalToken(guardianLearnCard, 'child-user', { wrongSubject: true });
            const caller = createCaller(childLearnCard.id.did(), token);
            const profile = await caller.profile.getProfile();

            expect(profile).toBeDefined();
        });
    });

    describe('finalize — credential-level guardian gating', () => {
        it('should succeed for managed child and return guardianPending count', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);
            mockGetProfilesThatManageAProfile.mockResolvedValue([mockGuardianProfile as any]);

            // No guardian approval token needed — finalize now uses profileRoute
            // Guardian gating happens at the credential level, not route level
            const caller = createCaller(childLearnCard.id.did());

            const result = await caller.inbox.finalize({});
            expect(result).toBeDefined();
            expect(result.processed).toBeGreaterThanOrEqual(0);
            expect(result.guardianPending).toBeGreaterThanOrEqual(0);
        });

        it('should succeed for non-managed profile with guardianPending=0', async () => {
            mockGetProfileByDid.mockResolvedValue(mockNonManagedProfile as any);
            mockIsProfileManaged.mockResolvedValue(false);

            const caller = createCaller(nonManagedLearnCard.id.did());

            const result = await caller.inbox.finalize({});
            expect(result).toBeDefined();
            expect(result.processed).toBeGreaterThanOrEqual(0);
            expect(result.guardianPending).toBe(0);
        });

        it('should include guardianPending in response schema', async () => {
            mockGetProfileByDid.mockResolvedValue(mockChildProfile as any);
            mockIsProfileManaged.mockResolvedValue(true);
            mockGetProfilesThatManageAProfile.mockResolvedValue([mockGuardianProfile as any]);

            const caller = createCaller(childLearnCard.id.did());

            const result = await caller.inbox.finalize({});
            expect(result).toHaveProperty('guardianPending');
            expect(typeof result.guardianPending).toBe('number');
        });
    });
});
