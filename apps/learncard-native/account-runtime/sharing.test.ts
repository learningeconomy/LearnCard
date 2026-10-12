import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import {
    prepareShare,
    shareWallet,
    buildAppShareLinkUrl,
} from '../../../apps/learn-card-app/src/components/share-links/shareLinkFlow';
import { decryptSharePayload } from '../../../packages/learn-card-base/src/helpers/share-links/share-link-crypto';
import { validateShareManifest } from '../../../packages/learn-card-base/src/helpers/share-links/share-manifest';
import { parseShareLinkUrl } from '../../../packages/learn-card-base/src/helpers/share-links/share-link-url';
import { buildNativeTemplate } from './credential-draft';

test('native selection uses web encryption, preserves signed originals, and keeps content key in fragment', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const wallet = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    const template = buildNativeTemplate(
        {
            requestID: 'public-test',
            title: 'Selected credential',
            summary: 'Public compatibility fixture',
            kind: 'Achievements',
            achievementType: 'Badge',
            criteria: '',
        },
        wallet.id.did(),
        'Test Issuer'
    );
    const credential = await wallet.invoke.issueCredential({
        ...template,
        validFrom: new Date().toISOString(),
        credentialSubject: { ...template.credentialSubject, id: wallet.id.did() },
    });
    const refs = ['test:selected:one', 'test:selected:two'];
    const adapter = shareWallet({
        ...wallet,
        read: {
            get: async (uri: string) => {
                if (!refs.includes(uri)) throw new Error('Unexpected ref');
                return credential;
            },
        },
        index: { LearnCloud: { get: async () => [] } },
        invoke: {
            ...wallet.invoke,
            getProfile: async () => ({
                profileId: 'public-native-test',
                displayName: 'Native Test',
            }),
        },
    });
    const prepared = await prepareShare(
        adapter,
        refs,
        'Native share compatibility',
        '',
        new Date(Date.now() + 30 * 86400_000).toISOString()
    );
    const payload = await decryptSharePayload({
        shareId: prepared.input.id,
        contentVersion: 1,
        key: prepared.key,
        envelope: prepared.input.envelope,
    });
    const manifest = validateShareManifest(payload, {
        shareId: prepared.input.id,
        contentVersion: 1,
    });
    expect(manifest.ok).toBe(true);
    expect(prepared.payload.presentation.verifiableCredential).toEqual([credential, credential]);
    const proof = await wallet.invoke.verifyPresentation(prepared.payload.presentation, {
        proofPurpose: 'authentication',
    });
    expect(proof.errors).toHaveLength(0);
    const link = buildAppShareLinkUrl(
        'https://staging.learncard.app',
        prepared.input.id,
        prepared.key
    );
    expect(parseShareLinkUrl(link).ok).toBe(true);
    expect(new URL(link).pathname.includes(prepared.key)).toBe(false);
    expect(new URL(link).search).toBe('');
    const recovery = await wallet.invoke.decryptDagJwe(prepared.input.ownerEncryptedRecovery);
    expect(recovery).toMatchObject({ selection: [{ ref: refs[0] }, { ref: refs[1] }] });
}, 30_000);
