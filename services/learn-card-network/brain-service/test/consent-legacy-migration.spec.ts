import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { migrateLegacyConsentFlowContracts } from '@helpers/consentflow-legacy-migration.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const recoveryFixture = async () => {
    const suffix = randomBytes(5).toString('hex');
    const owner = await getUser(randomBytes(32).toString('hex'));
    const learner = await getUser(randomBytes(32).toString('hex'));
    await owner.clients.fullAuth.profile.createProfile({ profileId: `repair-owner-${suffix}` });
    await learner.clients.fullAuth.profile.createProfile({ profileId: `repair-user-${suffix}` });
    const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Post-marker legacy contract',
        contract: normalContract,
    });
    const untouchedUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Unrelated legacy contract',
        contract: normalContract,
    });
    const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
        contractUri: uri,
        terms: normalFullTerms,
    });
    const { termsUri: untouchedTermsUri } =
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: untouchedUri,
            terms: normalFullTerms,
        });
    const id = getIdFromUri(uri);
    const untouchedId = getIdFromUri(untouchedUri);
    const markerAt = '2026-01-01T00:00:00.000Z';
    await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract)-[:HAS_VERSION]->(version:ConsentFlowContractVersion)
         WHERE contract.id IN $ids
         DETACH DELETE version
         REMOVE contract.currentVersion
         WITH contract
         MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
         REMOVE terms.consentedVersion
         FOREACH (_ IN CASE WHEN contract.id=$untouchedId THEN [1] ELSE [] END |
             SET terms.status='stale', terms.oneTime=true)`,
        { ids: [id, untouchedId], untouchedId }
    );
    await neogma.queryRunner.run(
        `MERGE (migration:ConsentFlowContractMigration {id:'legacy-v1'})
         SET migration.completedAt=$markerAt`,
        { markerAt }
    );
    const assertUnrelatedUnchanged = async () => {
        const result = await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract {id:$id})<-[:CONSENTS_TO]-(terms:ConsentFlowTerms)
             MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'})
             RETURN contract.currentVersion AS version, terms.consentedVersion AS accepted,
                 terms.status AS status, migration.completedAt AS marker,
                 COUNT { (contract)-[:HAS_VERSION]->() } AS snapshots`,
            { id: untouchedId }
        );
        expect(result.records[0].get('version')).toBeNull();
        expect(result.records[0].get('accepted')).toBeNull();
        expect(result.records[0].get('status')).toBe('stale');
        expect(Number(result.records[0].get('snapshots'))).toBe(0);
        expect(result.records[0].get('marker')).toBe(markerAt);
    };
    const cleanup = async () => {
        await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract) WHERE contract.id IN $ids
             OPTIONAL MATCH (contract)-[:HAS_VERSION]->(version:ConsentFlowContractVersion)
             OPTIONAL MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
             DETACH DELETE version, terms, contract`,
            { ids: [id, untouchedId] }
        );
        await neogma.queryRunner.run(
            `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'}) DELETE migration`
        );
    };
    return { owner, uri, id, termsUri, untouchedTermsUri, assertUnrelatedUnchanged, cleanup };
};

describe('legacy contract startup migration', () => {
    it('backfills healthy data once while isolating malformed historical contracts', async () => {
        const suffix = randomBytes(5).toString('hex');
        const owner = await getUser(randomBytes(32).toString('hex'));
        const learner = await getUser(randomBytes(32).toString('hex'));
        await owner.clients.fullAuth.profile.createProfile({
            profileId: `migration-owner-${suffix}`,
        });
        await learner.clients.fullAuth.profile.createProfile({
            profileId: `migration-user-${suffix}`,
        });
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Migration QA',
            contract: normalContract,
        });
        const malformedUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Malformed historical request',
            contract: normalContract,
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: normalFullTerms,
        });
        const id = getIdFromUri(uri);
        const malformedId = getIdFromUri(malformedUri);
        await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract)-[relationship:HAS_VERSION]->(version:ConsentFlowContractVersion)
             WHERE contract.id IN $ids
             DELETE relationship, version
             SET contract.currentVersion=null
             WITH contract
             FOREACH (_ IN CASE WHEN contract.id=$malformedId THEN [1] ELSE [] END |
                 SET contract['contract.read.credentials.categories.Achievement.required']='invalid')`,
            { ids: [id, malformedId], malformedId }
        );
        await neogma.queryRunner.run(
            `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'}) DELETE migration`
        );
        await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms {id:$id}) SET terms.consentedVersion=null`,
            { id: getIdFromUri(termsUri) }
        );
        try {
            await migrateLegacyConsentFlowContracts();
            const incompleteMarker = await neogma.queryRunner.run(
                `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'})
                 RETURN migration.completedAt AS completedAt`
            );
            expect(incompleteMarker.records).toHaveLength(0);
            await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id}) DETACH DELETE contract`,
                { id: malformedId }
            );
            await migrateLegacyConsentFlowContracts();
            const completeMarker = await neogma.queryRunner.run(
                `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'})
                 RETURN migration.completedAt AS completedAt`
            );
            expect(completeMarker.records).toHaveLength(1);
            await migrateLegacyConsentFlowContracts();
            expect((await getConsentFlowContractVersionRecord(id, 1))?.contract).toEqual(
                normalContract
            );
            expect(await getConsentFlowContractVersionRecord(malformedId, 1)).toBeNull();
            const versions = await owner.clients.fullAuth.contracts.getContractVersions({ uri });
            expect(versions.map(version => version.version)).toEqual([1]);
            const consent = await learner.clients.fullAuth.contracts.getConsentStatus({
                uri,
                profileId: `migration-user-${suffix}`,
            });
            expect(consent).toMatchObject({
                status: 'live',
                consentedVersion: 1,
                currentVersion: 1,
                needsReconsent: false,
            });
            const data = await owner.clients.fullAuth.contracts.getConsentedDataForContract({
                uri,
            });
            expect(data.records.map(record => record.personal)).toEqual([
                normalFullTerms.read.personal,
            ]);
        } finally {
            await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id}) DETACH DELETE contract`,
                { id: malformedId }
            );
            await neogma.queryRunner.run(
                `MATCH (migration:ConsentFlowContractMigration {id:'legacy-v1'}) DELETE migration`
            );
        }
    });
    it('repairs concurrent post-marker reads once and normalizes only that connection', async () => {
        const fixture = await recoveryFixture();
        try {
            await neogma.queryRunner.run(
                `MATCH (terms:ConsentFlowTerms {id:$id}) SET terms.status='stale', terms.oneTime=true`,
                { id: getIdFromUri(fixture.termsUri) }
            );
            const snapshots = await Promise.all(
                Array.from({ length: 4 }, () => getConsentFlowContractVersionRecord(fixture.id, 1))
            );
            expect(snapshots.map(snapshot => snapshot?.contract)).toEqual(
                Array.from({ length: 4 }, () => normalContract)
            );
            const versions = await fixture.owner.clients.fullAuth.contracts.getContractVersions({
                uri: fixture.uri,
            });
            expect(versions.map(version => version.version)).toEqual([1]);
            const terms = await neogma.queryRunner.run(
                `MATCH (terms:ConsentFlowTerms {id:$id})
                 RETURN terms.consentedVersion AS accepted, terms.status AS status`,
                { id: getIdFromUri(fixture.termsUri) }
            );
            expect(Number(terms.records[0].get('accepted'))).toBe(1);
            expect(terms.records[0].get('status')).toBe('consumed');
            await fixture.assertUnrelatedUnchanged();
        } finally {
            await fixture.cleanup();
        }
    });

    it('publishes an update after scoped legacy recovery while preserving the original snapshot', async () => {
        const fixture = await recoveryFixture();
        try {
            const updated =
                await fixture.owner.clients.fullAuth.contracts.updateConsentFlowContract({
                    uri: fixture.uri,
                    changes: { subtitle: 'Updated after recovery' },
                });
            expect(updated).toMatchObject({ kind: 'relaxed', version: 2 });
            expect((await getConsentFlowContractVersionRecord(fixture.id, 1))?.contract).toEqual(
                normalContract
            );
            const versions = await fixture.owner.clients.fullAuth.contracts.getContractVersions({
                uri: fixture.uri,
            });
            expect(versions.map(version => version.version).sort((a, b) => a - b)).toEqual([1, 2]);
            await fixture.assertUnrelatedUnchanged();
        } finally {
            await fixture.cleanup();
        }
    });

    it('retires a post-marker legacy contract and withdraws its existing connection', async () => {
        const fixture = await recoveryFixture();
        try {
            await fixture.owner.clients.fullAuth.contracts.deleteConsentFlowContract({
                uri: fixture.uri,
            });
            const result = await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id})<-[:CONSENTS_TO]-(terms:ConsentFlowTerms)
                 RETURN contract.status AS contractStatus, terms.status AS termsStatus,
                     contract.currentVersion AS version`,
                { id: fixture.id }
            );
            expect(result.records[0].get('contractStatus')).toBe('retired');
            expect(result.records[0].get('termsStatus')).toBe('withdrawn');
            expect(Number(result.records[0].get('version'))).toBe(2);
            expect((await getConsentFlowContractVersionRecord(fixture.id, 1))?.contract).toEqual(
                normalContract
            );
            await fixture.assertUnrelatedUnchanged();
        } finally {
            await fixture.cleanup();
        }
    });

    it('rejects update and retirement when versioned history is missing', async () => {
        const fixture = await recoveryFixture();
        try {
            await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id}) SET contract.currentVersion=1`,
                { id: fixture.id }
            );
            await expect(
                fixture.owner.clients.fullAuth.contracts.updateConsentFlowContract({
                    uri: fixture.uri,
                    changes: { subtitle: 'Must not publish' },
                })
            ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
            await expect(
                fixture.owner.clients.fullAuth.contracts.deleteConsentFlowContract({
                    uri: fixture.uri,
                })
            ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
            expect(await getConsentFlowContractVersionRecord(fixture.id, 1)).toBeNull();
            await fixture.assertUnrelatedUnchanged();
        } finally {
            await fixture.cleanup();
        }
    });

    it('does not record an accepted version for a malformed legacy request', async () => {
        const fixture = await recoveryFixture();
        try {
            await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id})
                 SET contract['contract.read.credentials.categories.Achievement.required']='invalid'`,
                { id: fixture.id }
            );
            expect(await getConsentFlowContractVersionRecord(fixture.id, 1)).toBeNull();
            const result = await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id})<-[:CONSENTS_TO]-(terms:ConsentFlowTerms)
                 RETURN contract.currentVersion AS version, terms.consentedVersion AS accepted`,
                { id: fixture.id }
            );
            expect(result.records[0].get('version')).toBeNull();
            expect(result.records[0].get('accepted')).toBeNull();
            await fixture.assertUnrelatedUnchanged();
        } finally {
            await fixture.cleanup();
        }
    });
});
