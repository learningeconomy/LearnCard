import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { buildNativeTemplate, type NativeCredentialDraft } from './credential-draft';

const draft: NativeCredentialDraft = {
    requestID: 'public-spike-draft',
    title: 'Kindness',
    summary: 'A thoughtful teammate.',
    kind: 'Achievements',
    achievementType: 'Badge',
    criteria: 'Supported their peers.',
    artworkURL: 'https://cdn.filestackcontent.com/public-test-artwork',
    recipient: 'test-recipient',
};

test('builder template interoperates with real VC v2 signing and preserves artwork and recipient', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const issuer = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    const holder = await initLearnCard({ seed: 'b'.repeat(64), didkit: wasm });
    const template = buildNativeTemplate(draft, issuer.id.did(), 'Public Test Issuer');
    expect('id' in template.credentialSubject).toBe(false);
    expect('validFrom' in template).toBe(false);
    // The SDK's send path supplies these per-recipient fields before signing.
    const credential = await issuer.invoke.issueCredential({
        ...template,
        id: 'urn:uuid:0ac8f673-2605-4692-bac5-31a8bfb2480c',
        validFrom: new Date().toISOString(),
        credentialSubject: { ...template.credentialSubject, id: holder.id.did() },
    });
    const verification = await holder.invoke.verifyCredential(credential, { checks: ['proof'] });
    expect(verification.errors).toHaveLength(0);
    expect(credential.credentialSubject).toMatchObject({
        id: holder.id.did(),
        achievement: {
            image: { id: draft.artworkURL },
            criteria: { narrative: draft.criteria },
            achievementType: 'Badge',
        },
    });
}, 30_000);

test('invalid drafts and non-provider artwork cannot reach issuance', () => {
    for (const changes of [
        { title: ' ' },
        { summary: 'x'.repeat(1001) },
        { achievementType: 'MadeUp' },
        { artworkURL: 'file:///private/photo.jpg' },
        { artworkURL: 'https://cdn.filestackcontent.com.evil.test/photo' },
    ]) {
        expect(() =>
            buildNativeTemplate({ ...draft, ...changes }, 'did:key:public-test', 'Test')
        ).toThrow();
    }
});
