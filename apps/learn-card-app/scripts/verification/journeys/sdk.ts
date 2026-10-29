import { randomBytes, randomUUID } from 'node:crypto';

import { prepareFixtureById } from '@learncard/credential-library';

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
    title: 'SDK from checkout source: credentials, storage, boosts and public preview ownership',
    surface: 'sdk',
    entries: [
        'sdk-identity',
        'sdk-issue-verify',
        'sdk-presentation',
        'sdk-cloud-roundtrip',
        'sdk-boost-send-accept',
        'sdk-share-preview-lifecycle',
    ],
    run: async context => {
        const { issuer, recipient } = context.actors;
        const observations: Record<string, unknown> = {};

        const { issuerLc, recipientLc, issuerDid } = await context.step(
            null,
            'sdk-identity',
            async () => {
                const issuerLc = await context.sdk(issuer);
                const recipientLc = await context.sdk(recipient);
                const issuerDid = issuerLc.id.did();
                expect(issuerDid).toBe(`${context.stack.brainDid}:users:${issuer.profileId}`);
                const resolved = await recipientLc.invoke.getProfile(issuer.profileId);
                expect(resolved?.profileId).toBe(issuer.profileId);
                observations.identity = { issuerDid, keyDid: issuerLc.id.did('key') };
                return { issuerLc, recipientLc, issuerDid };
            }
        );

        const signed = await context.step(null, 'sdk-issue-verify', async () => {
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
            return signed;
        });

        await context.step(null, 'sdk-presentation', async () => {
            const presentation = await issuerLc.invoke.issuePresentation(
                await issuerLc.invoke.newPresentation(signed)
            );
            const presentationResult = await recipientLc.invoke.verifyPresentation(presentation);
            expect(presentationResult.errors).toEqual([]);
            observations.presentation = { checks: presentationResult.checks };
        });

        await context.step(null, 'sdk-cloud-roundtrip', async () => {
            const uri = await issuerLc.store.LearnCloud.uploadEncrypted!(signed);
            const indexId = `lc-verify-${randomBytes(4).toString('hex')}`;
            await issuerLc.index.LearnCloud.add({ id: indexId, uri });
            const readBack = await issuerLc.read.get(uri);
            expect(readBack).toEqual(signed);
            const indexed = await issuerLc.index.LearnCloud.get();
            expect(indexed.some(record => record.id === indexId && record.uri === uri)).toBe(true);
            observations.cloud = { uri, indexId };
        });

        await context.step(null, 'sdk-boost-send-accept', async () => {
            const boostName = `SDK verify ${randomBytes(3).toString('hex')}`;
            const boostUri = await issuerLc.invoke.createBoost(
                boostTemplate(issuerDid, boostName),
                {
                    name: boostName,
                    category: 'Social Badge',
                }
            );
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
        });

        await context.step(null, 'sdk-share-preview-lifecycle', async () => {
            const publisher = await context.sdk(context.actors.learner);
            const shareUri = `urn:encrypted:${randomUUID()}`;
            const metadata = {
                name: 'Preview ownership regression',
                issuer: 'Example School',
                image: 'https://cdn.example.test/badge.png',
            };
            const id = await publisher.invoke.publishCredentialSharePreview({
                ...metadata,
                shareUri,
            });
            const readPreview = (previewId: string, uri?: string) => {
                const url = new URL(
                    `${context.stack.brainApi}/credential-share-previews/${previewId}`
                );
                if (uri !== undefined) url.searchParams.set('shareUri', uri);
                return fetch(url);
            };
            expect(await (await readPreview(id, shareUri)).json()).toEqual(metadata);
            expect((await readPreview(id)).status).toBe(400);
            expect((await readPreview(id, 'urn:encrypted:another')).status).toBe(404);
            const unauthenticatedDelete = await fetch(
                `${context.stack.brainApi}/credential-share-previews/${id}/delete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}',
                }
            );
            expect(unauthenticatedDelete.status).toBe(401);

            await expect(
                recipientLc.invoke.publishCredentialSharePreview({
                    id,
                    name: 'Forged preview',
                    issuer: 'Another issuer',
                    shareUri,
                })
            ).rejects.toMatchObject({ data: { code: 'NOT_FOUND' } });
            expect(await recipientLc.invoke.deleteCredentialSharePreview(id)).toBe(false);
            expect(await (await readPreview(id, shareUri)).json()).toEqual(metadata);
            const auditMatch = `MATCH (:Profile {profileId: '${context.actors.learner.profileId}'})-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(p:CredentialSharePreview {id: '${id}'})`;
            const auditQuery = `${auditMatch} RETURN p.createdAt AS createdAt`;
            const modifiedQuery = `${auditMatch} RETURN p.updatedAt AS updatedAt`;
            const originalAudit = await context.inspect.neo4j(auditQuery);
            expect(originalAudit).toMatch(/\d{4}-\d{2}-\d{2}T/);
            const originalModified = await context.inspect.neo4j(modifiedQuery);
            expect(originalModified).toMatch(/\d{4}-\d{2}-\d{2}T/);

            const otherUri = `urn:encrypted:${randomUUID()}`;
            await expect(
                publisher.invoke.publishCredentialSharePreview({
                    id,
                    name: 'Must not replace the original card',
                    issuer: metadata.issuer,
                    shareUri: otherUri,
                })
            ).rejects.toMatchObject({ data: { code: 'NOT_FOUND' } });
            expect(await (await readPreview(id, shareUri)).json()).toEqual(metadata);
            expect((await readPreview(id, otherUri)).status).toBe(404);
            expect(
                await publisher.invoke.publishCredentialSharePreview({
                    id,
                    name: 'Updated preview',
                    issuer: metadata.issuer,
                    shareUri,
                })
            ).toBe(id);
            expect(await (await readPreview(id, shareUri)).json()).toEqual({
                name: 'Updated preview',
                issuer: metadata.issuer,
            });
            expect(await context.inspect.neo4j(auditQuery)).toBe(originalAudit);
            expect(await context.inspect.neo4j(modifiedQuery)).not.toBe(originalModified);
            expect(await publisher.invoke.deleteCredentialSharePreview(id)).toBe(true);
            expect((await readPreview(id, shareUri)).status).toBe(404);

            const ownedIds = await Promise.all(
                [0, 1].map(() =>
                    publisher.invoke.publishCredentialSharePreview({ ...metadata, shareUri })
                )
            );
            await publisher.invoke.deleteProfile();
            for (const ownedId of ownedIds) {
                expect((await readPreview(ownedId, shareUri)).status).toBe(404);
            }
            const remaining = await context.inspect.neo4j(
                `MATCH (p:CredentialSharePreview) WHERE p.id IN ['${ownedIds.join("','")}'] RETURN count(p) AS n`
            );
            expect(remaining).toMatch(/^n\n0$/m);
            observations.sharePreviews = {
                ownershipEnforced: true,
                uriBindingEnforced: true,
                presentationBindingImmutable: true,
                modifiedTimeRecorded: true,
                unauthenticatedDeleteRejected: true,
                refreshedWithoutImage: true,
                ownerAndProfileDeletion: true,
            };
        });

        return {
            observations,
        };
    },
};
