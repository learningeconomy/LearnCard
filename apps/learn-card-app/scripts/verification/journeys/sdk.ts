import { randomBytes, randomUUID } from 'node:crypto';

import { prepareFixtureById } from '@learncard/credential-library';

import { STACK } from '../constants';
import { expect } from '../expect';
import type { FeatureDefinition } from '../types';

/** OBv3 boost template, as tests/e2e and the docs build them. */
export const boostTemplate = (issuer: string, name: string) => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer,
    validFrom: new Date().toISOString(),
    name,
    credentialSubject: {
        id: issuer,
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            // The app files credentials by achievementType (CATEGORY_MAP): Badge → Social Badge.
            achievementType: 'Badge',
            name,
            description: 'Issued by lc verify through the LearnCard SDK.',
            image: '',
            criteria: { narrative: 'Ran the LearnCard verification journey.' },
        },
    },
});

export const sdkFeature: FeatureDefinition = {
    id: 'sdk',
    title: 'SDK from checkout source: identity, issue/verify, presentations, LearnCloud, boosts',
    surface: 'sdk',
    entries: [
        'sdk-identity',
        'sdk-issue-verify',
        'sdk-presentation',
        'sdk-cloud-roundtrip',
        'sdk-boost-send-accept',
    ],
    run: async context => {
        const { issuer, recipient } = context.actors;
        const observations: Record<string, unknown> = {};

        // sdk-identity: a seed-derived wallet joins the owned network; a second wallet resolves it.
        const issuerLc = await context.sdk(issuer);
        const recipientLc = await context.sdk(recipient);
        const issuerDid = issuerLc.id.did();
        expect(issuerDid).toBe(`${STACK.brainDid}:users:${issuer.profileId}`);
        const resolved = await recipientLc.invoke.getProfile(issuer.profileId);
        expect(resolved?.profileId).toBe(issuer.profileId);
        observations.identity = { issuerDid, keyDid: issuerLc.id.did('key') };

        // sdk-issue-verify: a credential-library OBv3 fixture signs and verifies; tampering fails.
        const unsigned = prepareFixtureById('obv3/minimal-badge', { issuerDid });
        const signed = await issuerLc.invoke.issueCredential(unsigned);
        const verification = await issuerLc.invoke.verifyCredential(signed);
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');
        const tampered = structuredClone(signed) as typeof signed & { name?: string };
        tampered.name = `${tampered.name ?? 'Badge'} (tampered)`;
        const tamperedResult = await issuerLc.invoke.verifyCredential(tampered);
        expect(tamperedResult.errors.length).toBeGreaterThan(0);
        observations.issueVerify = {
            fixture: 'obv3/minimal-badge',
            checks: verification.checks,
            tamperedErrors: tamperedResult.errors,
        };
        await context.record('sdk-signed-credential', signed);

        // sdk-presentation: wrap the credential in a signed presentation and verify it.
        const presentation = await issuerLc.invoke.issuePresentation(
            await issuerLc.invoke.newPresentation(signed)
        );
        const presentationResult = await recipientLc.invoke.verifyPresentation(presentation);
        expect(presentationResult.errors).toEqual([]);
        observations.presentation = { checks: presentationResult.checks };

        // sdk-cloud-roundtrip: encrypted LearnCloud storage + personal index, read back by URI.
        const uri = await issuerLc.store.LearnCloud.uploadEncrypted!(signed);
        const indexId = `lc-verify-${randomBytes(4).toString('hex')}`;
        await issuerLc.index.LearnCloud.add({ id: indexId, uri });
        const readBack = await issuerLc.read.get(uri);
        expect(readBack).toEqual(signed);
        const indexed = await issuerLc.index.LearnCloud.get();
        expect(indexed.some(record => record.id === indexId && record.uri === uri)).toBe(true);
        observations.cloud = { uri, indexId };

        // sdk-boost-send-accept: create a boost, send it, recipient sees + accepts it; the network
        // graph records the receipt (CREDENTIAL_RECEIVED with a null status means claimed).
        const boostName = `SDK verify ${randomBytes(3).toString('hex')}`;
        const boostUri = await issuerLc.invoke.createBoost(boostTemplate(issuerDid, boostName), {
            name: boostName,
            category: 'Social Badge',
        });
        const sentUri = await issuerLc.invoke.sendBoost(recipient.profileId, boostUri);
        const incoming = await recipientLc.invoke.getIncomingCredentials();
        expect(incoming.some(item => item.uri === sentUri)).toBe(true);
        await recipientLc.invoke.acceptCredential(sentUri);
        const received = await recipientLc.invoke.getReceivedCredentials();
        expect(received.some(item => item.uri === sentUri)).toBe(true);
        const graph = await context.inspect.neo4j(
            `MATCH (:Profile {profileId: '${issuer.profileId}'})-[:CREDENTIAL_SENT]->(c:Credential)-[r:CREDENTIAL_RECEIVED]->(:Profile {profileId: '${recipient.profileId}'}) RETURN count(c) AS received, sum(CASE WHEN r.status IS NULL THEN 1 ELSE 0 END) AS claimed`
        );
        await context.record('sdk-boost-graph', graph);
        expect(graph).toMatch(/^received, claimed\n1, 1$/m);
        const recipients = await issuerLc.invoke.getBoostRecipients(boostUri);
        expect(recipients.some(item => item.to.profileId === recipient.profileId)).toBe(true);
        observations.boost = { boostName, boostUri, sentUri, graph };

        return {
            entries: [
                'sdk-identity',
                'sdk-issue-verify',
                'sdk-presentation',
                'sdk-cloud-roundtrip',
                'sdk-boost-send-accept',
            ],
            observations,
        };
    },
};
