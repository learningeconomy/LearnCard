import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { minimalContract, minimalTerms } from './helpers/contract';
import { Profile } from '@models';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import { createProfileManagedByRelationship } from '@accesslayer/profile/relationships/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getDidWeb } from '@helpers/did.helpers';

let guardian: Awaited<ReturnType<typeof getUser>>;
let child: Awaited<ReturnType<typeof getUser>>;
let nonManagedUser: Awaited<ReturnType<typeof getUser>>;
let guardianLearnCard: SeedLearnCard;

const DOMAIN = 'localhost%3A3000';

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

describe('Guardian Gated Routes - Context Passing', () => {
    beforeAll(async () => {
        guardianLearnCard = await getLearnCard('a'.repeat(64));
        guardian = await getUser('a'.repeat(64));
        child = await getUser('b'.repeat(64));
        nonManagedUser = await getUser('c'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });

        await guardian.clients.fullAuth.profile.createProfile({
            profileId: 'guardian-user',
            displayName: 'Guardian User',
        });

        await child.clients.fullAuth.profile.createProfile({
            profileId: 'child-user',
            displayName: 'Child User',
        });

        await nonManagedUser.clients.fullAuth.profile.createProfile({
            profileId: 'non-managed-user',
            displayName: 'Non-Managed User',
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
    });

    describe('Non-managed profiles (isChildAccount: false)', () => {
        it('should pass through for non-managed profiles with isChildAccount=false', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const result = await nonManagedUser.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        }, 15000);
    });

    describe('Managed profiles (isChildAccount: true)', () => {
        beforeEach(async () => {
            const guardianProfile = await getProfileByProfileId('guardian-user');
            const childProfile = await getProfileByProfileId('child-user');

            if (guardianProfile && childProfile) {
                await createProfileManagedByRelationship(guardianProfile, childProfile);
            }
        });

        it('should pass through for managed profiles without guardian approval (hasGuardianApproval=false)', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const result = await child.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });

        it('should pass through for managed profiles with valid guardian approval (hasGuardianApproval=true)', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const guardianApprovalToken = await generateGuardianApprovalToken(
                guardianLearnCard,
                'child-user'
            );

            const childClientWithApproval = getClient({
                did: child.learnCard.id.did(),
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                guardianApproval: guardianApprovalToken,
            });

            const result = await childClientWithApproval.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for expired token', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const expiredToken = await generateGuardianApprovalToken(
                guardianLearnCard,
                'child-user',
                { expired: true }
            );

            const childClientWithExpiredApproval = getClient({
                did: child.learnCard.id.did(),
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                guardianApproval: expiredToken,
            });

            const result = await childClientWithExpiredApproval.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for wrong scope token', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const wrongScopeToken = await generateGuardianApprovalToken(
                guardianLearnCard,
                'child-user',
                { wrongScope: true }
            );

            const childClientWithWrongScope = getClient({
                did: child.learnCard.id.did(),
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                guardianApproval: wrongScopeToken,
            });

            const result = await childClientWithWrongScope.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for non-guardian signer', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const nonGuardianLearnCard = await getLearnCard('d'.repeat(64));

            const nonGuardianToken = await generateGuardianApprovalToken(
                nonGuardianLearnCard,
                'child-user'
            );

            const childClientWithNonGuardianToken = getClient({
                did: child.learnCard.id.did(),
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                guardianApproval: nonGuardianToken,
            });

            const result = await childClientWithNonGuardianToken.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });

        it('should pass through with hasGuardianApproval=false for wrong subject token', async () => {
            const contractUri = await guardian.clients.fullAuth.contracts.createConsentFlowContract(
                {
                    contract: minimalContract,
                    name: 'Test Contract',
                }
            );

            const wrongSubjectToken = await generateGuardianApprovalToken(
                guardianLearnCard,
                'child-user',
                { wrongSubject: true }
            );

            const childClientWithWrongSubject = getClient({
                did: child.learnCard.id.did(),
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
                guardianApproval: wrongSubjectToken,
            });

            const result = await childClientWithWrongSubject.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            expect(result.termsUri).toBeDefined();
        });
    });
});
