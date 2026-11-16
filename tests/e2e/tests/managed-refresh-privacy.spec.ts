import { describe, test, expect, beforeEach } from 'vitest';
import neo4j from 'neo4j-driver';

import type { UnsignedVC, VC } from '@learncard/types';
import { JWEValidator } from '@learncard/types';
import { assertManagedCredentialBinding } from '@learncard/helpers';

import { getLearnCardForUser, USERS, type LearnCard } from './helpers/learncard.helpers';

/**
 * LC-2345 A3 — holder-mode (student-only encrypted) managed sends, proven end to end
 * against the real dockerized network (brain-service, learn-cloud, lca-api) through the
 * public SDK surface only.
 *
 * This is the privacy guarantee the "Send a Private, Refreshable Credential" how-to and
 * its trust statement promise: once `send({ refresh: true, encryption: 'holder' })` signs
 * and encrypts a credential, its claims are readable by the holder (and their account
 * managers) only — never by the issuer's own wallet, and never by any network read the
 * issuer is authorized to make.
 *
 * See `packages/plugins/learn-card-network/src/test/holder-send.test.ts` (SDK unit
 * coverage of the client-side guards and retry semantics) and
 * `services/learn-card-network/brain-service/test/holder-mode-send.spec.ts`
 * (server-side structural checks) for the lower-level proofs this spec builds on; this
 * file only exercises the public SDK, the same way a partner integration would.
 */

const SENTINEL_CLAIM = 'LC-2345-E2E-SENTINEL-CLAIM-9d41b6';

/**
 * SSRF guard opt-ins for the local docker endpoint: it is plain HTTP on a loopback
 * host, so the holder-side refresh primitive needs the explicit local-development
 * opt-in, plus a private-address opt-in. Both exceptions are deliberately scoped to
 * this local test (see `credential-refresh.spec.ts`).
 */
const LOCAL_REFRESH_OPTIONS = {
    allowInsecureHttp: true,
    allowPrivateAddresses: true,
    resolveHost: async () => ['127.0.0.1'],
} as const;

/**
 * Student-side verification (A3 steps 1-3): read the public delivery binding, decrypt,
 * verify the proof and status, and check the decrypted credential's identity against
 * the binding before it would ever be displayed or saved. This mirrors
 * `ingestManagedCredential` (`packages/learn-card-base/src/helpers/ingestManagedCredential.ts`),
 * reimplemented here against only the packages this e2e suite already depends on so the
 * test exercises the same wallet surface a real integration would, without pulling in
 * `learn-card-base`'s React-oriented dependency surface.
 */
const verifyAndDecryptManagedCredential = async (wallet: LearnCard, uri: string): Promise<VC> => {
    const receipt = await wallet.invoke.getCredentialRefreshReceipt({ uri });

    if (!receipt) throw new Error(`No managed delivery receipt for ${uri}`);

    const credential = (await wallet.read.get(uri)) as VC;
    const check = await wallet.invoke.verifyCredential(credential);

    if (!check.checks.includes('proof') || check.errors.length > 0 || check.warnings.length > 0) {
        throw new Error(`Credential failed verification: ${JSON.stringify(check)}`);
    }

    assertManagedCredentialBinding(credential, receipt);

    return credential;
};

/** Every property on every node of the given label in the live network database. */
const dumpNodeText = async (label: string): Promise<string> => {
    const driver = neo4j.driver('bolt://localhost:7687');
    const session = driver.session();

    try {
        const result = await session.run(`MATCH (n:${label}) RETURN properties(n) AS props`);

        return JSON.stringify(result.records.map(record => record.get('props')));
    } finally {
        await session.close();
        await driver.close();
    }
};

/** The raw stored credential text for whatever the issuer most recently sent. */
const dumpSentCredentialText = async (issuerProfileId: string): Promise<string> => {
    const driver = neo4j.driver('bolt://localhost:7687');
    const session = driver.session();

    try {
        const result = await session.run(
            `MATCH (:Profile {profileId: $issuerProfileId})-[:CREDENTIAL_SENT]->(c:Credential)
             RETURN c.credential AS credential`,
            { issuerProfileId }
        );

        return String(result.records[0]?.get('credential'));
    } finally {
        await session.close();
        await driver.close();
    }
};

/** No test-credential claim value anywhere the issuer's reads or the holder's notifications can see. */
const assertNoSentinelLeak = async (holder: LearnCard): Promise<void> => {
    expect(await dumpNodeText('Boost')).not.toContain(SENTINEL_CLAIM);
    expect(await dumpNodeText('CredentialRefresh')).not.toContain(SENTINEL_CLAIM);
    expect(await dumpNodeText('RefreshSendIntent')).not.toContain(SENTINEL_CLAIM);
    expect(
        JSON.stringify(
            await holder.invoke.getNotifications({ limit: 50, sort: 'REVERSE_CHRONOLOGICAL' })
        )
    ).not.toContain(SENTINEL_CLAIM);
};

/** A minimal VCDM v2 credential carrying the sentinel in a standard top-level term, so
 * it needs no custom JSON-LD context fragment to round-trip through signing. */
const buildUnsignedTranscript = (holderDid: string, description: string): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:placeholder-overwritten-by-send',
    credentialSubject: { id: holderDid },
    description,
});

describe('Managed refresh privacy (LC-2345 holder mode)', () => {
    let issuer: LearnCard;
    let holder: LearnCard;

    beforeEach(async () => {
        issuer = await getLearnCardForUser('a');
        holder = await getLearnCardForUser('b');
    }, 120_000);

    test(
        'holder-mode send: the student decrypts and verifies, the issuer cannot decrypt, ' +
            'and no claim value reaches the issuer, a notification, or any network read',
        async () => {
            const holderDid = holder.id.did();

            // 1. Issuer sends with holder-mode encryption: identical call shape to an
            // ordinary managed refresh send, plus `encryption: 'holder'`.
            const sent = await issuer.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                template: { credential: buildUnsignedTranscript(holderDid, SENTINEL_CLAIM) },
                display: { name: 'Official Transcript', category: 'Learning History' },
                refresh: true,
                encryption: 'holder',
            });

            expect(sent.type).toBe('boost');
            expect(sent.credentialUri).toMatch(/^lc:network:/);
            const refresh = sent.refresh;

            expect(refresh?.refreshId).toBeTruthy();
            expect(refresh?.holderDid).toBe(holderDid);

            // 2. The student claims, then verifies before display (A3 steps 1-3) —
            // decrypting with their own key and checking the binding, exactly as the
            // claim modal does before it would ever offer Accept.
            await expect(holder.invoke.acceptCredential(sent.credentialUri)).resolves.toBe(true);

            const held = await verifyAndDecryptManagedCredential(holder, sent.credentialUri);

            expect(held.id).toBe(refresh!.credentialId);
            expect(held.description).toBe(SENTINEL_CLAIM);

            // 3. The issuer's own wallet holds the network DID it signed with, not a
            // holder/manager key-agreement key, so it cannot decrypt what it just sent —
            // and the wire ciphertext itself never carries the claim in the clear.
            const rawStored = await dumpSentCredentialText(USERS.a.profileId);
            const jwe = JWEValidator.parse(JSON.parse(rawStored));

            expect(JSON.stringify(jwe)).not.toContain(SENTINEL_CLAIM);

            const issuerAttempt = await issuer.invoke.decryptDagJwe<VC>(jwe).catch(() => null);

            expect(issuerAttempt).not.toEqual(held);

            const holderAttempt = await holder.invoke.decryptDagJwe<VC>(jwe);

            expect(holderAttempt).toEqual(held);

            // 4. Every other read the issuer is authorized to make is equally blind to
            // the claims: the stored Boost is a display-only anchor (A2), and the audit
            // history is metadata-only.
            const issuerBoost = await issuer.invoke.getBoost(sent.uri);

            expect(JSON.stringify(issuerBoost.boost)).not.toContain(SENTINEL_CLAIM);

            const history = await issuer.invoke.getCredentialRefreshHistory({
                refreshId: refresh!.refreshId,
            });

            expect(JSON.stringify(history)).not.toContain(SENTINEL_CLAIM);
            await assertNoSentinelLeak(holder);

            // 5. Publish v2 with an explicit `notify`: the network cannot compare
            // encrypted versions to decide materiality for you.
            const v2Description = `${SENTINEL_CLAIM}-v2`;
            const published = await issuer.invoke.publishHolderEncryptedRefreshable(
                refresh!,
                buildUnsignedTranscript(holderDid, v2Description),
                { notify: true }
            );

            expect(published.version).toBe(2);
            expect(published.notification).toBe('queued');

            const refreshed = await holder.invoke.refreshCredential(held, {
                ...LOCAL_REFRESH_OPTIONS,
                baseline: {
                    credentialStatus: refresh!.credentialStatus,
                    refreshService: refresh!.refreshService,
                },
            });

            expect(refreshed.status, JSON.stringify(refreshed)).toBe('updated');
            if (refreshed.status !== 'updated') throw new Error('Expected an updated result');
            expect(refreshed.managedVersion).toBe(2);
            expect(refreshed.credential.description).toBe(v2Description);

            await assertNoSentinelLeak(holder);

            // 6. Revoke: every version of a managed refresh shares the same public
            // status entries (A1), so both the original and the published version
            // report revoked once the issuer revokes.
            await expect(
                issuer.invoke.revokeBoostRecipient(sent.uri, USERS.b.profileId)
            ).resolves.toBe(true);

            const v1Verification = await holder.invoke.verifyCredential(held);

            expect(v1Verification.errors.join('\n')).toMatch(/revoked/i);

            const v2Verification = await holder.invoke.verifyCredential(refreshed.credential);

            expect(v2Verification.errors.join('\n')).toMatch(/revoked/i);
        },
        180_000
    );
});
