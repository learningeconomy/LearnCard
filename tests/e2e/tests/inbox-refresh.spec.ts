import { randomBytes } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { getClient } from '@learncard/network-brain-client';
import { injectManagedRefreshService } from '@learncard/helpers';
import type { UnsignedVC, VC, VP } from '@learncard/types';
import { getLearnCard } from './helpers/learncard.helpers';

/** Fresh identities also allow this test to run alone without resetting a developer's demo DB. */
describe('Universal Inbox refresh with real signing', () => {
    it('issues through REST before a holder exists, publishes before claim, then refreshes after claim', async () => {
        const suffix = randomBytes(5).toString('hex');
        const issuer = await getLearnCard(randomBytes(32).toString('hex'));
        const holder = await getLearnCard(randomBytes(32).toString('hex'));
        await issuer.invoke.createProfile({
            profileId: `inbox-issuer-${suffix}`,
            displayName: 'Inbox Refresh School',
            bio: '',
            shortBio: '',
        });
        const sa = (await issuer.invoke.createSigningAuthority(`inb${suffix}`))!;
        await issuer.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
        await issuer.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);
        const grant = await issuer.invoke.addAuthGrant({
            name: 'Inbox refresh test',
            scope: 'inbox:write inbox:read credentials:write credentials:read',
        });
        const token = await issuer.invoke.getAPITokenForAuthGrant(grant);
        const template: UnsignedVC = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: issuer.id.did(),
            name: 'Provisional results',
            credentialSubject: {},
        };
        const issueResponse = await fetch('http://localhost:4000/api/inbox/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                recipient: { type: 'email', value: `refresh-${suffix}@example.com` },
                credential: template,
                refresh: true,
                idempotencyKey: `issue-${suffix}`,
                configuration: {
                    signingAuthority: { endpoint: sa.endpoint, name: sa.name },
                    delivery: { suppress: true },
                },
            }),
        });
        const issued = await issueResponse.json();
        expect(issueResponse.status, JSON.stringify(issued)).toBe(200);
        expect(issued.status).toBe('PENDING');
        expect(issued.refresh.holderDid).toBeUndefined();
        const receipt = issued.refresh;
        const pending = injectManagedRefreshService(
            {
                ...template,
                id: receipt.credentialId,
                issuer: receipt.issuerDid,
                credentialStatus: receipt.credentialStatus,
                name: 'Final grade A',
            },
            receipt.refreshService
        );
        const published = await issuer.invoke.publishCredentialRefresh({
            refreshId: receipt.refreshId,
            mode: 'signing-authority',
            credential: pending,
            signingAuthority: { type: 'http', endpoint: sa.endpoint!, name: sa.name },
            idempotencyKey: 'pending-final',
        });
        expect(published).toMatchObject({ version: 2, notification: 'not-applicable' });
        // Claim with a real DIDAuth VP, even without creating a network profile for the holder.
        const client = await getClient(
            'http://localhost:4000/trpc',
            async challenge =>
                holder.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge }) as Promise<string>
        );
        const localExchangeId = new URL(issued.claimUrl).pathname.split('/').pop()!;
        const challenge = await client.workflows.participateInExchange.mutate({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const vp = (await holder.invoke.getDidAuthVp({
            challenge: challenge.verifiablePresentationRequest?.challenge,
            domain: challenge.verifiablePresentationRequest?.domain,
        })) as VP;
        const claim = await client.workflows.participateInExchange.mutate({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });
        const vc = claim.verifiablePresentation?.verifiableCredential?.[0] as VC;
        expect(vc).toMatchObject({
            id: receipt.credentialId,
            name: 'Final grade A',
            credentialSubject: { id: holder.id.did() },
        });
        // The test wallets share one DIDKit process: refresh the DID document that
        // issuer setup may have cached before its authority was registered.
        await holder.invoke.resolveDid(receipt.issuerDid, { noCache: true });
        expect(await holder.invoke.verifyCredential(vc)).toMatchObject({
            errors: [],
            warnings: [],
            checks: expect.arrayContaining(['proof']),
        });
        const metadata = await issuer.invoke.getInboxCredential(issued.issuanceId);
        expect(metadata?.refresh?.holderDid).toBe(holder.id.did());
        const next = {
            ...pending,
            name: 'Final grade A with honors',
            credentialSubject: { id: metadata!.refresh!.holderDid! },
        };
        expect(
            await issuer.invoke.publishCredentialRefresh({
                refreshId: receipt.refreshId,
                mode: 'signing-authority',
                credential: next,
                signingAuthority: { type: 'http', endpoint: sa.endpoint!, name: sa.name },
                idempotencyKey: 'honors',
            })
        ).toMatchObject({ version: 3 });
        const refreshed = await holder.invoke.refreshCredential(vc, {
            allowInsecureHttp: true,
            allowPrivateAddresses: true,
            maxRedirects: 0,
        });
        expect(refreshed.status).toBe('updated');
        if (refreshed.status === 'updated')
            expect(refreshed.credential.name).toBe('Final grade A with honors');
    }, 120_000);
});
