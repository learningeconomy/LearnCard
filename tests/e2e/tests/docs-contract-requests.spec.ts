import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { getLearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import { resolve } from 'node:path';

// Load the exact published JavaScript modules; no copied or mocked examples.
const snippets = resolve(__dirname, '../../../docs/snippets/contract-requests');
const { initializeReferralClients } = await import(`${snippets}/initialize.mjs`);
const { configureReferralPartner } = await import(`${snippets}/configure-partner.mjs`);
const { createReferralToken } = await import(`${snippets}/scoped-token.mjs`);
const { sendReferral, pollReferral } = await import(`${snippets}/request-and-poll.mjs`);
const { writeReferralOutcome } = await import(`${snippets}/write-outcome.mjs`);
const { claimAndShareOutcome } = await import(`${snippets}/claim-and-sync.mjs`);

describe('Docs: contract request integrator snippets', () => {
    it('uses scoped clients and keeps outcomes private until claim and sync', async () => {
        const suffix = randomBytes(5).toString('hex');
        const partnerSeed = randomBytes(32).toString('hex');
        const referrerSeed = randomBytes(32).toString('hex');
        const { partner, referrer } = await initializeReferralClients({
            partnerSeed,
            referrerSeed,
            networkUrl: 'http://localhost:4000/trpc',
            lcaApiUrl: 'http://localhost:5200/trpc',
            clientOptions: {
                didkit: readFile(
                    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
                ),
                cloud: { url: 'http://localhost:4100/trpc' },
            },
        });
        const learner = await getLearnCard(randomBytes(32).toString('hex'));
        for (const [role, account] of [
            ['partner', partner],
            ['referrer', referrer],
            ['learner', learner],
        ] as const) {
            await account.invoke.createProfile({
                profileId: `docs-ref-${role}-${suffix}`,
                displayName: `Synthetic ${role}`,
                bio: '',
                shortBio: '',
            });
        }
        const referrerProfile = await referrer.invoke.getProfile();
        const learnerProfile = await learner.invoke.getProfile();
        if (!referrerProfile || !learnerProfile) throw new Error('Missing synthetic profiles');
        const learnerDid = learner.id.did();
        const boostUri = await partner.invoke.createBoost(
            { ...testUnsignedBoost, issuer: partner.id.did() },
            { category: 'Achievement', name: 'Synthetic referral badge', status: 'LIVE' }
        );
        const { contractUri, signingAuthority } = await configureReferralPartner(partner, {
            recipientProfileId: referrerProfile.profileId,
            boostUri,
        });
        const partnerGrant = await createReferralToken(partner);
        const referrerGrant = await createReferralToken(
            referrer,
            'contracts:write contracts-data:read'
        );
        const runtimeReferrer = await initLearnCard({
            apiKey: referrerGrant.token,
            didkit: readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
            network: 'http://localhost:4000/trpc',
        });
        await sendReferral(runtimeReferrer, {
            contractUri,
            learnerProfileId: learnerProfile.profileId,
            reference: `docs-${suffix}`,
        });
        const pending = await pollReferral(runtimeReferrer, { contractUri, learnerDid });
        expect(pending.requests).toHaveLength(1);
        expect(pending.requests[0]).toMatchObject({ status: 'pending' });
        expect(pending.records).toEqual([]);

        const invitation = await learner.invoke.getRequestStatusForProfile(
            learnerProfile.profileId,
            undefined,
            contractUri
        );
        const details = await learner.invoke.getContract(contractUri);
        expect(details.recipients?.map(profile => profile.profileId)).toContain(
            referrerProfile.profileId
        );
        const consentOptions = {
            terms: {
                read: {
                    personal: {},
                    credentials: {
                        sharing: true,
                        shareAll: true,
                        categories: { Achievement: { sharing: true, shareAll: true, shared: [] } },
                    },
                },
                write: { personal: {}, credentials: { categories: { Achievement: true } } },
            },
            audienceVersion: details.audienceVersion,
            expectedRequestId: invitation?.requestId,
        };
        const { termsUri } = await learner.invoke.consentToContract(contractUri, consentOptions);
        const autoBoosts = (await learner.invoke.getCredentialsForContract(termsUri)).records;
        expect(autoBoosts).toHaveLength(1);
        const autoBoost = autoBoosts[0];
        if (!autoBoost) throw new Error('Auto-boost was not issued');

        const outcomeInput = {
            brainApiUrl: 'http://localhost:4000/api',
            writerApiToken: partnerGrant.token,
            contractUri,
            learnerDid,
            boostUri,
            signingAuthority,
        };
        // Possessing a referral/read token does not authorize outcome issuance.
        await expect(
            writeReferralOutcome({ ...outcomeInput, writerApiToken: referrerGrant.token })
        ).rejects.toThrow('Outcome issuance failed');
        const credentialUri = await writeReferralOutcome(outcomeInput);
        const beforeClaim = await pollReferral(runtimeReferrer, { contractUri, learnerDid });
        expect(beforeClaim.requests[0].status).toBe('accepted');
        expect(beforeClaim.records[0].credentials).toEqual([]);

        const sharedUris = [];
        for (const uri of [autoBoost.credentialUri, credentialUri]) {
            sharedUris.push(
                await claimAndShareOutcome(learner, { contractUri, termsUri, credentialUri: uri })
            );
        }
        const synced = await pollReferral(runtimeReferrer, { contractUri, learnerDid });
        expect(synced.records).toHaveLength(1);
        expect(
            synced.records[0].credentials.map((record: { uri: string }) => record.uri).sort()
        ).toEqual(sharedUris.sort());
        expect(await referrer.read.get(sharedUris[0]!)).toBeTruthy();

        await learner.invoke.withdrawConsent(termsUri);
        const withdrawn = await pollReferral(runtimeReferrer, { contractUri, learnerDid });
        expect(withdrawn.requests[0].status).toBe('accepted');
        expect(withdrawn.records).toEqual([]);
        await partner.invoke.revokeAuthGrant(partnerGrant.grantId);
        await referrer.invoke.revokeAuthGrant(referrerGrant.grantId);
    }, 180_000);
});
