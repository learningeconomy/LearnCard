import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { migrateLegacyConsentFlowContracts } from '@helpers/consentflow-legacy-migration.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

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
            `MATCH (terms:ConsentFlowTerms {id:$id}) SET terms.consentedVersion=null`,
            { id: getIdFromUri(termsUri) }
        );
        try {
            await migrateLegacyConsentFlowContracts();
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
        }
    });
});
