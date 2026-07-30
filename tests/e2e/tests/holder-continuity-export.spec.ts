import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verifyCredential as verifyWithDigitalCredentials } from '@digitalcredentials/verifier-core';
import { describe, expect, test } from 'vitest';
import type { UnsignedVC } from '@learncard/types';

import {
    createLearnCardBundle,
    importLearnCardBundle,
    readLearnCardBundleData,
    restoreLearnCardFromBundle,
} from '@learncard/holder-continuity';
import { getLearnCard } from './helpers/learncard.helpers';
import type { LearnCardBundleWallet } from '@learncard/holder-continuity';

const randomSeed = (): string => randomBytes(32).toString('hex');

describe('Holder continuity export', () => {
    test('exports, decrypts, verifies, restores, and self-imports a stored VC', async () => {
        const source = await getLearnCard(randomSeed());
        const target = await getLearnCard(randomSeed());
        const unsignedVc: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            id: `urn:uuid:${randomBytes(16).toString('hex')}`,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'Holder Continuity Test Credential',
            issuer: {
                type: ['Profile'],
                id: source.id.did(),
                name: 'LearnCard Holder Continuity Test Issuer',
            },
            validFrom: new Date().toISOString(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${randomBytes(16).toString('hex')}`,
                    type: ['Achievement'],
                    achievementType: 'Achievement',
                    name: 'Continuity Export',
                    description: 'Credential used to verify LearnCard holder continuity export.',
                    criteria: { type: 'Criteria', narrative: 'Export and import round trip.' },
                },
            },
        };
        const vc = await source.invoke.issueCredential(unsignedVc);
        const uri = await source.store.LearnCloud.uploadEncrypted!(vc);

        await source.index.LearnCloud.add({
            id: `holder-continuity-${Date.now()}`,
            uri,
            category: 'Achievement',
            title: 'Holder Continuity Test Credential',
        });

        const bundle = await createLearnCardBundle(source as unknown as LearnCardBundleWallet, {
            password: 'correct horse battery staple',
            fetchStatusLists: false,
        });
        const decrypted = await readLearnCardBundleData(bundle.data, {
            password: 'correct horse battery staple',
        });
        const credentialEntry = decrypted.entries.find(entry => entry.type === 'credential');

        expect(credentialEntry).toBeDefined();

        const exportedVc = JSON.parse(credentialEntry!.content);
        const registries = [
            {
                name: 'LEF Member Registry',
                type: 'dcc-legacy',
                governanceUrl: 'https://learningeconomy.io',
                url: 'https://registries.learncard.com/trusted/registry.json',
            },
        ];
        const externalVerification = await verifyWithDigitalCredentials({
            credential: exportedVc,
            knownDIDRegistries: registries,
        });

        if (externalVerification.errors) expect(externalVerification.errors).toHaveLength(0);
        expect(
            externalVerification.log?.some(step => step.id === 'valid_signature' && step.valid)
        ).toBe(true);

        const dir = await mkdtemp(join(tmpdir(), 'learncard-holder-continuity-'));
        const path = join(dir, 'bundle.zip');

        await writeFile(path, bundle.data);

        const restored = (await restoreLearnCardFromBundle(path, {
            password: 'correct horse battery staple',
            init: {
                network: 'http://localhost:4000/trpc',
                cloud: { url: 'http://localhost:4100/trpc' },
                didkit: readFile(
                    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
                ),
            },
        })) as unknown as Awaited<ReturnType<typeof getLearnCard>>;

        expect(restored.id.did()).toBe(source.id.did());

        const restoredRecords = await restored.index.LearnCloud.get({
            category: 'Achievement',
        });
        const restoredRecord = restoredRecords.find(
            (record: { title?: string; uri: string }) =>
                record.title === 'Holder Continuity Test Credential'
        );

        expect(restoredRecord).toBeDefined();
        await expect(restored.read.get(restoredRecord!.uri)).resolves.toEqual(vc);

        const report = await importLearnCardBundle(path, {
            password: 'correct horse battery staple',
            wallet: target as unknown as LearnCardBundleWallet,
        });

        expect(report.errors).toEqual([]);
        expect(report.importedCredentials).toBeGreaterThanOrEqual(1);

        const importedRecords = await target.index.LearnCloud.get({
            category: 'Achievement',
        });
        const importedRecord = importedRecords.find(
            record => record.title === 'Holder Continuity Test Credential'
        );

        expect(importedRecord).toBeDefined();
        await expect(target.read.get(importedRecord!.uri)).resolves.toEqual(vc);
    });
});
